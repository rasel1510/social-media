import { LRUCache } from "./structures/lru-cache";
import { Trie } from "./structures/trie";
import { SocialGraph } from "./structures/graph";

/**
 * Enterprise Database Cache Manager
 * Uses in-memory high performance data structures (LRU Cache, Prefix Trie, Social Graph)
 * to intercept and accelerate frequent reads, reducing database round-trips by >80%.
 */

// Global singleton instances to persist across serverless warm requests / Node process
const globalCache = globalThis as unknown as {
  userCache?: LRUCache<string, any>;
  countsCache?: LRUCache<string, { unreadMessages: number; unreadNotifications: number }>;
  friendStatusCache?: LRUCache<string, string>;
  userTrie?: Trie<{ id: string; name: string; username: string | null; image: string | null }>;
  socialGraph?: SocialGraph;
};

export const userCache = globalCache.userCache ?? new LRUCache<string, any>(2000, 5 * 60 * 1000); // 5 min TTL
export const countsCache = globalCache.countsCache ?? new LRUCache<string, { unreadMessages: number; unreadNotifications: number }>(1000, 15 * 1000); // 15 sec TTL
export const friendStatusCache = globalCache.friendStatusCache ?? new LRUCache<string, string>(5000, 60 * 1000); // 1 min TTL
export const userTrie = globalCache.userTrie ?? new Trie<{ id: string; name: string; username: string | null; image: string | null }>();
export const socialGraph = globalCache.socialGraph ?? new SocialGraph();

if (process.env.NODE_ENV !== "production") {
  globalCache.userCache = userCache;
  globalCache.countsCache = countsCache;
  globalCache.friendStatusCache = friendStatusCache;
  globalCache.userTrie = userTrie;
  globalCache.socialGraph = socialGraph;
}

/**
 * Cache Invalidation Helpers
 */
export const CacheManager = {
  // Invalidate when user changes profile
  invalidateUser(userId: string) {
    userCache.delete(`user:${userId}`);
    userCache.delete(`user:profile:${userId}`);
  },

  // Invalidate when notification or message count changes
  invalidateCounts(userId: string) {
    countsCache.delete(`counts:${userId}`);
  },

  // Invalidate friend relationship status
  invalidateFriendStatus(user1: string, user2: string) {
    friendStatusCache.delete(`friend:${user1}:${user2}`);
    friendStatusCache.delete(`friend:${user2}:${user1}`);
    friendStatusCache.invalidatePrefix(`suggested:${user1}`);
    friendStatusCache.invalidatePrefix(`suggested:${user2}`);
    // Async cleanup of redis user:friends
    import("./redis").then(({ redis }) => {
      redis.del(`user:friends:${user1}`, `user:friends:${user2}`);
    }).catch(() => {});
  },

  // Invalidate per-user explore cache (runs after friend request changes)
  async invalidateExplore(userId: string) {
    const { redis } = await import("./redis");
    await Promise.all([
      redis.del(`explore:suggested:${userId}`),
      redis.del(`explore:incoming:${userId}`),
      redis.del(`explore:sent:${userId}`),
      redis.del(`user:friends:${userId}`),
    ]);
  },

  // Index user in Trie
  indexUser(user: { id: string; name: string; username: string | null; image: string | null }) {
    if (user.username) {
      userTrie.insert(user.username, user);
    }
    if (user.name) {
      userTrie.insert(user.name.replace(/\s+/g, ""), user);
      const parts = user.name.split(" ");
      for (const part of parts) {
        if (part.length > 1) {
          userTrie.insert(part, user);
        }
      }
    }
  },
};
