"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Utility to verify session and get user ID
 */
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;
  return session;
}

/**
 * Parses content for @username mentions, creates Mention records and Notifications.
 */
async function handleMentions(content: string, postId?: string, commentId?: string) {
  try {
    const session = await getSession();
    if (!session) return;

    // Regex to find usernames starting with @ (e.g., @rasel)
    const mentionRegex = /@(\w+[\w.]*)/g;
    const matches = Array.from(content.matchAll(mentionRegex));
    const usernames = Array.from(new Set(matches.map((match) => match[1])));

    if (usernames.length === 0) return;

    // Find users by username first
    const byUsername = await (prisma as any).user.findMany({
      where: {
        username: { in: usernames },
      },
      select: { id: true, username: true, name: true },
    });

    // For mentions that didn't match a username, try matching by name (spaces removed)
    const matchedUsernames = new Set(byUsername.map((u: any) => u.username));
    const unmatchedMentions = usernames.filter((u) => !matchedUsernames.has(u));

    let byName: any[] = [];
    if (unmatchedMentions.length > 0) {
      // Get all users and filter by name match (spaces removed)
      const allCandidates = await (prisma as any).user.findMany({
        where: {
          username: null, // Only check users without a username
        },
        select: { id: true, username: true, name: true },
      });
      byName = allCandidates.filter((u: any) =>
        unmatchedMentions.includes(u.name.replace(/\s+/g, ''))
      );
    }

    const mentionedUsers = [...byUsername, ...byName];

    for (const user of mentionedUsers) {
      // Don't notify yourself
      if (user.id === session.user.id) continue;

      // Create Mention record
      await (prisma as any).mention.create({
        data: {
          userId: user.id,
          postId: postId || null,
          commentId: commentId || null,
        },
      });

      // Create Notification
      await (prisma as any).notification.create({
        data: {
          userId: user.id,
          actorId: session.user.id,
          type: "MENTION",
          postId: postId || null,
          commentId: commentId || null,
        },
      });
    }
  } catch (error) {
    console.error("Error handling mentions:", error);
  }
}

export async function createPost(content: string, image?: string, location?: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Input Validation
    if (!content.trim() && !image && !location) throw new Error("Post content cannot be empty");
    if (content.length > 2000) throw new Error("Post content is too long");

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        image: image || null,
        location: location || null,
        authorId: session.user.id,
      },
    });

    // Handle mentions in the background
    await handleMentions(content, post.id);

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in createPost:", error);
    return { success: false, error: error.message || "Failed to create post" };
  }
}

export async function deletePost(postId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return { success: true }; // Already deleted

    if (post.authorId !== session.user.id) {
      throw new Error("You can only delete your own posts");
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deletePost:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function updatePost(postId: string, content: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    if (!content.trim()) throw new Error("Content cannot be empty");
    if (content.length > 2000) throw new Error("Content is too long");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorId !== session.user.id) {
      throw new Error("You can only edit your own posts");
    }

    await prisma.post.update({
      where: { id: postId },
      data: { content: content.trim() },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updatePost:", error);
    return { success: false, error: error.message || "Failed to update post" };
  }
}

export async function toggleReaction(postId: string, type: string = "LIKE") {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const allowedTypes = ["LIKE", "LOVE", "HAHA", "CARE", "SAD"];
    if (!allowedTypes.includes(type)) throw new Error("Invalid reaction type");

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
      } else {
        await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
      }
    } else {
      await prisma.reaction.create({
        data: {
          postId,
          userId: session.user.id,
          type,
        },
      });

      // Notify post author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });

      if (post && post.authorId !== session.user.id) {
        await (prisma as any).notification.create({
          data: {
            userId: post.authorId,
            actorId: session.user.id,
            type: "LIKE",
            postId: postId,
          }
        });
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in toggleReaction:", error);
    return { success: false, error: "Failed to react to post" };
  }
}

export async function getPostReactions(postId: string) {
  try {
    const reactions = await prisma.reaction.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return reactions;
  } catch (error) {
    console.error("Error in getPostReactions:", error);
    return [];
  }
}

export async function getUserPosts(userId: string) {
  try {
    // Reading posts can be public, but we ensure we don't return sensitive data
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            image: true,
          },
        },
        reactions: true,
        sharedPost: {
          include: {
            author: {
              select: {
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.error("Error in getUserPosts:", error);
    return [];
  }
}

export async function getPost(postId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            image: true,
          },
        },
        reactions: true,
        sharedPost: {
          include: {
            author: {
              select: {
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            shares: true,
          }
        }
      },
    });

    return post;
  } catch (error) {
    console.error("Error in getPost:", error);
    return null;
  }
}

// ----- COMMENT ACTIONS -----

export async function createComment(content: string, postId: string, parentId?: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    if (!content.trim()) throw new Error("Comment cannot be empty");
    if (content.length > 500) throw new Error("Comment is too long");

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        parentId: parentId || null,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { name: true, username: true, image: true }
        }
      }
    });

    // Handle mentions
    await handleMentions(content, postId, comment.id);

    // Notify post author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (post && post.authorId !== session.user.id) {
      await (prisma as any).notification.create({
        data: {
          userId: post.authorId,
          actorId: session.user.id,
          type: "COMMENT",
          postId: postId,
          commentId: comment.id,
        }
      });
    }

    // If it's a reply, notify the parent comment author too
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true }
      });
      if (parentComment && parentComment.authorId !== session.user.id && parentComment.authorId !== post?.authorId) {
        await (prisma as any).notification.create({
          data: {
            userId: parentComment.authorId,
            actorId: session.user.id,
            type: "REPLY",
            postId: postId,
            commentId: comment.id,
          }
        });
      }
    }

    revalidatePath("/");
    return { success: true, comment };
  } catch (error: any) {
    console.error("Error in createComment:", error);
    return { success: false, error: error.message || "Failed to post comment" };
  }
}

export async function updateComment(commentId: string, content: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    if (!content.trim()) throw new Error("Comment cannot be empty");
    if (content.length > 500) throw new Error("Comment is too long");

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== session.user.id) throw new Error("Unauthorized");

    await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateComment:", error);
    return { success: false, error: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) return { success: true };
    if (comment.authorId !== session.user.id) throw new Error("Unauthorized");

    // Delete replies manually if not handled by cascade
    await prisma.comment.deleteMany({
      where: { parentId: commentId }
    });

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteComment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function getComments(postId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { 
        postId,
        parentId: null,
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { name: true, username: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { name: true, username: true, image: true } }
          }
        }
      }
    });
    return comments;
  } catch (error) {
    console.error("Error in getComments:", error);
    return [];
  }
}

// ----- SHARE ACTIONS -----

export async function createShare(postId: string, content?: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    if (content && content.length > 2000) throw new Error("Caption is too long");

    await prisma.share.create({
      data: {
        postId,
        sharerId: session.user.id,
      }
    });

    const sharePost = await prisma.post.create({
      data: {
        content: content?.trim() || null,
        authorId: session.user.id,
        sharedPostId: postId,
      },
      include: {
        author: { select: { name: true, username: true, image: true } },
        sharedPost: {
          include: {
            author: { select: { name: true, username: true, image: true } },
          },
        },
        reactions: true,
      }
    });

    // Notify original post author
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (originalPost && originalPost.authorId !== session.user.id) {
      await (prisma as any).notification.create({
        data: {
          userId: originalPost.authorId,
          actorId: session.user.id,
          type: "SHARE",
          postId: sharePost.id,
        }
      });
    }

    revalidatePath("/");
    return { success: true, sharePost };
  } catch (error: any) {
    console.error("Error in createShare:", error);
    return { success: false, error: "Failed to share post" };
  }
}

export async function updateUserProfileImage(imageUrl: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in updateUserProfileImage:", error);
    return { success: false, error: "Failed to update profile image" };
  }
}

export async function updateUserCoverImage(imageUrl: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { coverImage: imageUrl },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in updateUserCoverImage:", error);
    return { success: false, error: "Failed to update cover image" };
  }
}

// ----- NOTIFICATION ACTIONS -----

export async function getNotifications() {
  try {
    const session = await getSession();
    if (!session) return [];

    const notifications = await (prisma as any).notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
          }
        },
      },
    });

    return notifications;
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return [];
  }
}

export async function markNotificationsAsRead() {
  try {
    const session = await getSession();
    if (!session) return { success: false };

    await (prisma as any).notification.updateMany({
      where: { 
        userId: session.user.id,
        isRead: false 
      },
      data: { isRead: true },
    });

    revalidatePath("/Notifications");
    return { success: true };
  } catch (error) {
    console.error("Error in markNotificationsAsRead:", error);
    return { success: false };
  }
}
export async function getUnreadNotificationCount() {
  try {
    const session = await getSession();
    if (!session) return 0;

    const count = await (prisma as any).notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error("Error in getUnreadNotificationCount:", error);
    return 0;
  }
}
