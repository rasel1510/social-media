import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";
import { redis } from "./redis";

/**
 * Enterprise Session Cache Resolver
 * 
 * 1. Request-Scoped Deduplication (React `cache`):
 *    Multiple calls within the same request (e.g. Page + Sidebar + Child components)
 *    resolve to the EXACT SAME promise with zero extra database hits.
 * 
 * 2. Cross-Request Fast L1/Redis Session Cache:
 *    Caches session resolution in Redis store for 45 seconds to speed up navigation.
 */
export const getCurrentSession = cache(async () => {
  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get("cookie") || "";
    
    // Extract better-auth session token from cookie if available (matches both secure and standard prefixes)
    const sessionCookieMatch = cookieHeader.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/);
    const sessionToken = sessionCookieMatch ? sessionCookieMatch[1] : null;

    if (sessionToken) {
      const cacheKey = `auth:session:${sessionToken}`;
      const cachedSession = await redis.get<any>(cacheKey);
      if (cachedSession) {
        return cachedSession;
      }

      const session = await auth.api.getSession({
        headers: reqHeaders,
      });

      if (session) {
        // Cache session for 90 seconds
        await redis.set(cacheKey, session, 90);
      }
      return session;
    }

    // Fallback if no specific cookie pattern matched
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    return session;
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("Dynamic server usage")) {
      throw error;
    }
    console.error("[SessionCache] Failed to resolve session:", error);
    return null;
  }
});
