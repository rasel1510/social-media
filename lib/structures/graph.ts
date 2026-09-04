/**
 * Social Graph & Recommendation Engine
 * Implements Graph Adjacency representation with Breadth-First-Search (BFS)
 * and Set-based Mutual Friend / Jaccard Similarity algorithms.
 * 
 * Used for:
 * 1. Mutual Friends counting in O(|F1| + |F2|) via Set intersection
 * 2. Friend Recommendations (Friends-of-Friends) in O(|V| + |E|)
 */

export interface FriendRecommendation {
  userId: string;
  mutualCount: number;
  score: number;
}

export class SocialGraph {
  // Adjacency Map: userId -> Set of friend userIds
  private adjacency: Map<string, Set<string>>;

  constructor() {
    this.adjacency = new Map();
  }

  /**
   * Add a bidirectional edge (Friendship) between user1 and user2
   */
  public addFriendship(user1: string, user2: string): void {
    if (!this.adjacency.has(user1)) {
      this.adjacency.set(user1, new Set());
    }
    if (!this.adjacency.has(user2)) {
      this.adjacency.set(user2, new Set());
    }

    this.adjacency.get(user1)!.add(user2);
    this.adjacency.get(user2)!.add(user1);
  }

  /**
   * Get direct friends of a user
   */
  public getFriends(userId: string): Set<string> {
    return this.adjacency.get(userId) || new Set();
  }

  /**
   * Compute mutual friends between two users using Set intersection
   * Time Complexity: O(min(|F1|, |F2|))
   */
  public getMutualFriends(user1: string, user2: string): string[] {
    const friends1 = this.adjacency.get(user1);
    const friends2 = this.adjacency.get(user2);

    if (!friends1 || !friends2) return [];

    const [smaller, larger] = friends1.size < friends2.size ? [friends1, friends2] : [friends2, friends1];
    const mutuals: string[] = [];

    for (const friend of smaller) {
      if (larger.has(friend)) {
        mutuals.push(friend);
      }
    }

    return mutuals;
  }

  /**
   * Compute Jaccard Similarity Coefficient: |F1 ∩ F2| / |F1 ∪ F2|
   */
  public getJaccardSimilarity(user1: string, user2: string): number {
    const friends1 = this.adjacency.get(user1);
    const friends2 = this.adjacency.get(user2);

    if (!friends1 || !friends2 || friends1.size === 0 || friends2.size === 0) return 0;

    const mutualCount = this.getMutualFriends(user1, user2).length;
    const unionCount = new Set([...friends1, ...friends2]).size;

    return unionCount === 0 ? 0 : mutualCount / unionCount;
  }

  /**
   * Friends-of-Friends (FoF) Algorithm for Friend Suggestions
   * Finds 2nd-degree connections, aggregates mutual friend count, and sorts by highest score.
   */
  public recommendFriends(
    userId: string,
    excludeIds: Set<string>,
    limit: number = 20
  ): FriendRecommendation[] {
    const userFriends = this.adjacency.get(userId) || new Set();
    const candidates = new Map<string, number>(); // candidateId -> mutual friend count

    // Iterate through all 1st-degree friends to find 2nd-degree connections
    for (const friendId of userFriends) {
      const secondDegreeFriends = this.adjacency.get(friendId) || new Set();

      for (const candidateId of secondDegreeFriends) {
        // Exclude the user, existing friends, and already pending/rejected requests
        if (candidateId === userId || userFriends.has(candidateId) || excludeIds.has(candidateId)) {
          continue;
        }

        candidates.set(candidateId, (candidates.get(candidateId) || 0) + 1);
      }
    }

    // Convert to recommendations array with Jaccard-weighted score
    const recommendations: FriendRecommendation[] = [];
    for (const [candidateId, mutualCount] of candidates.entries()) {
      const jaccard = this.getJaccardSimilarity(userId, candidateId);
      recommendations.push({
        userId: candidateId,
        mutualCount,
        score: mutualCount * 10 + jaccard,
      });
    }

    // Sort descending by score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, limit);
  }

  /**
   * Clear the graph
   */
  public clear(): void {
    this.adjacency.clear();
  }
}
