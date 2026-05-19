// components/post/hidden-post-utils.ts

/**
 * Get the list of hidden post IDs from localStorage.
 * Returns an array of post IDs (strings). If running on the server, returns an empty array.
 */
export const getHiddenPosts = (): string[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("hiddenPosts");
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Add a post ID to the hidden posts list in localStorage.
 * Avoid duplicates.
 */
export const addHiddenPost = (postId: string): void => {
  if (typeof window === "undefined") return;
  const hidden = getHiddenPosts();
  if (!hidden.includes(postId)) {
    hidden.push(postId);
    localStorage.setItem("hiddenPosts", JSON.stringify(hidden));
  }
};
