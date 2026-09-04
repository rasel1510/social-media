/**
 * High-Speed Prefix Trie Data Structure
 * Optimized for O(L) autocompletion and mention matching,
 * where L is the length of the search string (independent of total database size N).
 */

interface TrieNode<T> {
  children: Map<string, TrieNode<T>>;
  isEndOfWord: boolean;
  value?: T;
}

export class Trie<T> {
  private root: TrieNode<T>;

  constructor() {
    this.root = {
      children: new Map(),
      isEndOfWord: false,
    };
  }

  /**
   * Insert a word into the Trie with associated metadata
   * Time Complexity: O(L) where L is the word length
   */
  public insert(word: string, value: T): void {
    let current = this.root;
    const normalized = word.toLowerCase().trim();

    for (const char of normalized) {
      if (!current.children.has(char)) {
        current.children.set(char, {
          children: new Map(),
          isEndOfWord: false,
        });
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    current.value = value;
  }

  /**
   * Search for exact word
   * Time Complexity: O(L)
   */
  public search(word: string): T | undefined {
    let current = this.root;
    const normalized = word.toLowerCase().trim();

    for (const char of normalized) {
      if (!current.children.has(char)) {
        return undefined;
      }
      current = current.children.get(char)!;
    }

    return current.isEndOfWord ? current.value : undefined;
  }

  /**
   * Find all entries matching a given prefix (e.g. for autocompletion)
   * Time Complexity: O(P + K) where P is prefix length and K is number of matches
   */
  public findByPrefix(prefix: string, maxResults: number = 10): T[] {
    let current = this.root;
    const normalized = prefix.toLowerCase().trim();

    for (const char of normalized) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    const results: T[] = [];
    this.collectAll(current, results, maxResults);
    return results;
  }

  private collectAll(node: TrieNode<T>, results: T[], maxResults: number): void {
    if (results.length >= maxResults) return;

    if (node.isEndOfWord && node.value !== undefined) {
      results.push(node.value);
    }

    for (const child of node.children.values()) {
      if (results.length >= maxResults) break;
      this.collectAll(child, results, maxResults);
    }
  }

  /**
   * Clear the Trie
   */
  public clear(): void {
    this.root = {
      children: new Map(),
      isEndOfWord: false,
    };
  }
}
