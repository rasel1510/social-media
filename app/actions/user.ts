"use server";

import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { userCache, userTrie, CacheManager } from "@/lib/cache-manager";

export async function updateProfile(data: {
  bio?: string;
  study?: string;
  work?: string;
  address?: string;
  name?: string;
}) {
  const session = await getCurrentSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Basic validation
  if (data.name !== undefined && data.name.trim() === "") {
    throw new Error("Name cannot be empty");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.study !== undefined && { study: data.study }),
      ...(data.work !== undefined && { work: data.work }),
      ...(data.address !== undefined && { address: data.address }),
    },
  });

  // Invalidate cache and update Trie
  CacheManager.invalidateUser(userId);
  CacheManager.indexUser(updatedUser);

  revalidatePath(`/profile/${updatedUser.username || updatedUser.id}`);
  revalidatePath("/");

  return { success: true, user: updatedUser };
}

/**
 * High-Speed Trie Prefix User Search for @mentions and Autocomplete
 * Achieves O(L) time complexity instead of O(N) database scans.
 */
export async function searchMentionUsers(query: string) {
  const session = await getCurrentSession();

  if (!session?.user) return [];

  const currentUserId = session.user.id;
  const cleanQuery = query.trim().toLowerCase();

  // 1. Check Trie memory index first (O(L))
  if (cleanQuery) {
    const trieMatches = userTrie.findByPrefix(cleanQuery, 5);
    const filteredMatches = trieMatches.filter((u) => u.id !== currentUserId);
    if (filteredMatches.length >= 3) {
      return filteredMatches;
    }
  }

  // 2. Query database with indexed B-Tree search
  const whereClause: any = {
    id: { not: currentUserId },
  };

  if (cleanQuery && cleanQuery.length >= 1) {
    whereClause.OR = [
      { name: { contains: cleanQuery, mode: "insensitive" } },
      { username: { contains: cleanQuery, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
    take: 5,
    orderBy: { name: "asc" },
  });

  // Cache in Trie for instant subsequent searches
  for (const user of users) {
    CacheManager.indexUser(user);
  }

  return users;
}
