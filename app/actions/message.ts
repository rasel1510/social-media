"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

// 1. Get all conversations for the current user
export async function getConversations() {
  try {
    const session = await getSession();
    if (!session) return [];

    const currentUserId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      include: {
        user1: { select: { id: true, name: true, username: true, image: true } },
        user2: { select: { id: true, name: true, username: true, image: true } },
        messages: {
          where: { isRead: false, senderId: { not: currentUserId } },
          select: { id: true },
        },
      },
      orderBy: { lastMsgAt: "desc" },
    });

    return conversations.map((conv) => {
      const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
      return {
        id: conv.id,
        user: otherUser,
        lastMessage: conv.lastMessage,
        lastMsgAt: conv.lastMsgAt,
        unreadCount: conv.messages.length,
      };
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

// 2. Get or create a conversation with a specific friend
export async function getOrCreateConversation(friendId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const currentUserId = session.user.id;

    // First check if they are friends
    const isFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: friendId },
          { userId1: friendId, userId2: currentUserId },
        ],
      },
    });

    if (!isFriend) {
      throw new Error("You can only message your friends");
    }
    // Check if conversation exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: friendId },
          { user1Id: friendId, user2Id: currentUserId },
        ],
      },
      include: {
        user1: { select: { id: true, name: true, username: true, image: true } },
        user2: { select: { id: true, name: true, username: true, image: true } },
        messages: {
          where: { isRead: false, senderId: { not: currentUserId } },
          select: { id: true },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: currentUserId,
          user2Id: friendId,
        },
        include: {
          user1: { select: { id: true, name: true, username: true, image: true } },
          user2: { select: { id: true, name: true, username: true, image: true } },
          messages: {
            where: { isRead: false, senderId: { not: currentUserId } },
            select: { id: true },
          },
        },
      });
    }

    const otherUser = conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1;
    const formattedConversation = {
      id: conversation.id,
      user: otherUser,
      lastMessage: conversation.lastMessage,
      lastMsgAt: conversation.lastMsgAt,
      unreadCount: conversation.messages.length,
    };

    return { success: true, conversation: formattedConversation };
  } catch (error: any) {
    console.error("Error in getOrCreateConversation:", error);
    return { success: false, error: error.message || "Failed to initiate chat" };
  }
}

// 3. Get messages for a conversation
export async function getMessages(conversationId: string, limit = 50) {
  try {
    const session = await getSession();
    if (!session) return [];

    const currentUserId = session.user.id;

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { user1Id: true, user2Id: true },
    });

    if (!conversation || (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId)) {
      return [];
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, image: true, username: true } },
        post: {
          include: {
            author: { select: { id: true, name: true, image: true, username: true } }
          }
        }
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// 4. Send a message
export async function sendMessage(conversationId: string, content: string, audioUrl?: string, imageUrl?: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const currentUserId = session.user.id;
    if (!content.trim() && !audioUrl && !imageUrl) throw new Error("Message cannot be empty");

    // Combine conversation and friendship check into one query if possible
    // or at least optimize the existing ones.
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: { select: { id: true } },
        user2: { select: { id: true } },
      }
    });

    if (!conversation) throw new Error("Invalid conversation");
    
    const isParticipant = conversation.user1Id === currentUserId || conversation.user2Id === currentUserId;
    if (!isParticipant) throw new Error("Unauthorized access to conversation");

    const friendId = conversation.user1Id === currentUserId ? conversation.user2Id : conversation.user1Id;

    // Check friendship exists and is active
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: friendId },
          { userId1: friendId, userId2: currentUserId },
        ],
      },
    });

    if (!friendship) throw new Error("You are no longer friends with this user");

    const lastMsgPreview = content.trim() ? content : imageUrl ? "📷 Image message" : "🎤 Audio message";

    // Optimized transaction: Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          audioUrl,
          imageUrl,
          senderId: currentUserId,
          conversationId,
        },
        include: {
          sender: { select: { id: true, name: true, image: true, username: true } }
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: lastMsgPreview,
          lastMsgAt: new Date(),
        },
      }),
    ]);

    // Side effects: Firebase push and Revalidation
    // We wrap these to ensure they don't block each other if one fails
    const sideEffects = [
      adminDb.ref(`messages/${conversationId}`).push({
        ...message,
        createdAt: message.createdAt.toISOString(),
      }).catch(e => console.error("Firebase push error:", e)),
      
      // revalidatePath is critical for the UI to update unread counts etc.
      (async () => {
        try {
          revalidatePath(`/Messages`);
        } catch (e) {
          console.error("Revalidation error:", e);
        }
      })()
    ];

    // Wait for critical side effects if necessary, or just return
    // In Next.js Server Actions, awaiting revalidatePath is usually recommended
    await Promise.all(sideEffects);

    return { success: true, message };
  } catch (error: any) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message || "Failed to send message" };
  }
}

// 5. Mark messages as read
export async function markAsRead(conversationId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false };

    const currentUserId = session.user.id;

    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });
    
    if (result.count > 0) {
      revalidatePath(`/Messages`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return { success: false };
  }
}

// 6. Get total unread count for sidebar badge
export async function getUnreadCount() {
  try {
    const session = await getSession();
    if (!session) return 0;

    const currentUserId = session.user.id;

    const count = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { user1Id: currentUserId },
            { user2Id: currentUserId }
          ]
        },
        senderId: { not: currentUserId },
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    return 0;
  }
}

// 7. Send a post in a message
export async function sendPostInMessage(postId: string, friendId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const currentUserId = session.user.id;

    // Get or create conversation
    const res = await getOrCreateConversation(friendId);
    if (!res.success || !res.conversation) throw new Error(res.error || "Failed to start chat");

    const conversationId = res.conversation.id;

    // Get post info for last message preview
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { content: true, author: { select: { name: true } } }
    });

    const lastMsgPreview = `Shared a post by ${post?.author.name || "someone"}`;

    // Create message with postId
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: "Shared a post",
          senderId: currentUserId,
          conversationId,
          postId: postId,
        },
        include: {
          sender: { select: { id: true, name: true, image: true, username: true } },
          post: {
            include: {
              author: { select: { id: true, name: true, image: true, username: true } }
            }
          }
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: lastMsgPreview,
          lastMsgAt: new Date(),
        },
      }),
    ]);

    // Push to Firebase for real-time update
    try {
      await adminDb.ref(`messages/${conversationId}`).push({
        ...message,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (firebaseError) {
      console.error("Firebase push error:", firebaseError);
    }

    revalidatePath(`/Messages`);
    return { success: true, message };
  } catch (error: any) {
    console.error("Error sharing post in message:", error);
    return { success: false, error: error.message || "Failed to share post" };
  }
}
