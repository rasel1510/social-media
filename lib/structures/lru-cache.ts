/**
 * High-Performance Least Recently Used (LRU) Cache
 * Implemented using a Doubly Linked List + Hash Map
 * 
 * Time Complexities:
 * - get(key): O(1)
 * - set(key, value): O(1)
 * - delete(key): O(1)
 * - clear(): O(1)
 * 
 * Space Complexity: O(Capacity)
 */

interface LRUNode<K, V> {
  key: K;
  value: V;
  expiry: number;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

export class LRUCache<K, V> {
  private capacity: number;
  private defaultTtlMs: number;
  private map: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null = null;
  private tail: LRUNode<K, V> | null = null;

  constructor(capacity: number = 1000, defaultTtlMs: number = 60000) {
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map<K, LRUNode<K, V>>();
  }

  /**
   * Retrieves an item from the cache.
   * If expired, removes it and returns undefined.
   * Otherwise, moves the node to the head of the list and returns the value.
   */
  public get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;

    // Check expiration
    if (Date.now() > node.expiry) {
      this.removeNode(node);
      this.map.delete(key);
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToHead(node);
    return node.value;
  }

  /**
   * Inserts or updates an item in the cache.
   * Evicts the Least Recently Used (tail) if capacity is exceeded.
   */
  public set(key: K, value: V, ttlMs: number = this.defaultTtlMs): void {
    const expiry = Date.now() + ttlMs;

    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      node.value = value;
      node.expiry = expiry;
      this.moveToHead(node);
      return;
    }

    // If at capacity, evict LRU item (tail)
    if (this.map.size >= this.capacity && this.tail) {
      const evictedKey = this.tail.key;
      this.removeNode(this.tail);
      this.map.delete(evictedKey);
    }

    // Create new node and insert at head
    const newNode: LRUNode<K, V> = {
      key,
      value,
      expiry,
      prev: null,
      next: this.head,
    };

    if (this.head) {
      this.head.prev = newNode;
    }
    this.head = newNode;

    if (!this.tail) {
      this.tail = newNode;
    }

    this.map.set(key, newNode);
  }

  /**
   * Delete a specific key
   */
  public delete(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.map.delete(key);
    return true;
  }

  /**
   * Invalidate all keys matching a prefix (for grouped cache purging)
   */
  public invalidatePrefix(prefix: string): void {
    for (const key of this.map.keys()) {
      if (typeof key === "string" && key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  public size(): number {
    return this.map.size;
  }

  // --- Internal Doubly Linked List Operations ---

  private moveToHead(node: LRUNode<K, V>): void {
    if (this.head === node) return;

    this.removeNode(node);

    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }
}
