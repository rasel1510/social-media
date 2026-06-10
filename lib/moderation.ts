import prisma from "./db";

/**
 * Local bad-word patterns — used ONLY as a fallback when the LLM API fails.
 * Uses start-boundary matching so compound words like "shitshow" are caught.
 */
const BAD_WORD_PATTERNS: RegExp[] = [
  // Profanity roots — start-boundary only to catch derivatives
  /\bfuck/i, /\bshit/i, /\bbitch/i, /\bcunt/i, /\bwhore/i, /\bslut/i,
  /\bnigger/i, /\bnigga/i, /\bfaggot/i, /\bretard/i, /\bmotherfuck/i,
  /\basshole/i, /\bbullshit/i, /\bpiss/i, /\bdickhead/i,
  /\bstfu\b/i, /\bgtfo\b/i,
  // Short words — both boundaries to avoid false positives
  /\bass\b/i, /\bdick\b/i, /\bfag\b/i, /\bdamn\b/i, /\bcock\b/i,
];

function localBadWordCheck(content: string): boolean {
  return BAD_WORD_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * PRIMARY: Checks content for inappropriate language using the OpenRouter LLM.
 * FALLBACK: Uses a local bad-word list if the LLM call fails for any reason.
 *
 * Returns true if inappropriate content is detected, false otherwise.
 */
export async function checkContentForBadWords(content: string): Promise<boolean> {
  if (!content || !content.trim()) return false;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[Moderation] OPENROUTER_API_KEY is not set. Using local filter only.");
    return localBadWordCheck(content);
  }

  // ─── Step 1: LLM Check via OpenRouter (primary) ───
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Social Media Content Moderation",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a strict content moderation system. Your ONLY job is to detect profanity, slang, bad words, vulgar language, insults, and inappropriate language in user-submitted text.

You MUST respond with ONLY a JSON object — no markdown, no code fences, no explanation:
If the text contains ANY profanity, slang, bad words, insults, or inappropriate language → respond exactly: {"flagged":true}
If the text is clean and appropriate → respond exactly: {"flagged":false}

Here are examples:
Input: "fuck man!!!"         → {"flagged":true}
Input: "That was a total shitshow" → {"flagged":true}
Input: "stfu noob"           → {"flagged":true}
Input: "you stupid bitch"    → {"flagged":true}
Input: "Hello world"         → {"flagged":false}
Input: "Have a great day"    → {"flagged":false}

Remember: respond with ONLY the JSON object, nothing else.`,
          },
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0,
        max_tokens: 20,
      }),
      signal: controller.signal,
      cache: "no-store" as RequestCache,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "(unreadable)");
      console.error(
        `[Moderation] OpenRouter API error — status: ${response.status}, body: ${errorBody.substring(0, 300)}`
      );
      // Fall through to local filter
      console.log("[Moderation] LLM failed → falling back to local filter.");
      return localBadWordCheck(content);
    }

    const data = await response.json();
    const resText = data.choices?.[0]?.message?.content?.trim();

    if (!resText) {
      console.warn("[Moderation] LLM returned empty response:", JSON.stringify(data).substring(0, 300));
      return localBadWordCheck(content);
    }

    console.log(`[Moderation] LLM response for "${content.substring(0, 60)}": ${resText}`);

    // Parse the LLM response
    const result = parseLLMResponse(resText);
    if (result !== null) {
      return result;
    }

    // If parsing failed completely, fall back to local check
    console.warn("[Moderation] Could not parse LLM response. Falling back to local filter.");
    return localBadWordCheck(content);
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[Moderation] OpenRouter API timed out after 15s.");
    } else {
      console.error("[Moderation] OpenRouter API call failed:", error.message || error);
    }
    console.log("[Moderation] LLM failed → falling back to local filter.");
    return localBadWordCheck(content);
  }
}

/**
 * Attempts to parse the LLM's response text into a boolean.
 * Returns true/false if successfully parsed, or null if parsing fails.
 */
function parseLLMResponse(text: string): boolean | null {
  // Strip markdown code fences if the model wraps its response
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.flagged === "boolean") return parsed.flagged;
    if (typeof parsed.containsBadWords === "boolean") return parsed.containsBadWords;
  } catch {
    // not valid JSON, continue
  }

  // Try to extract a JSON object from the text
  const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.flagged === "boolean") return parsed.flagged;
      if (typeof parsed.containsBadWords === "boolean") return parsed.containsBadWords;
    } catch {
      // still failed
    }
  }

  // Last resort: look for the word "true" near "flagged"
  const lower = cleaned.toLowerCase();
  if (lower.includes('"flagged"') || lower.includes('"containsbadwords"')) {
    if (lower.includes("true")) return true;
    if (lower.includes("false")) return false;
  }

  return null;
}

/**
 * Increments demerit points.
 * If user reaches 3 demerit points, deletes user and returns { deleted: true }.
 * Otherwise, updates points and creates a warning notification, returning { deleted: false, newPoints }.
 */
export async function applyDemeritPoint(userId: string, postId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { demeritPoints: true },
  });

  if (!user) throw new Error("User not found");

  const currentPoints = user.demeritPoints || 0;
  const newPoints = currentPoints + 1;

  if (newPoints >= 3) {
    // Delete user and cascade delete everything
    await prisma.user.delete({
      where: { id: userId },
    });
    return {
      deleted: true,
      error:
        "Your account has been permanently deleted because you accumulated 3 demerit points for content policy violations.",
    };
  }

  // Update user demerit points
  await prisma.user.update({
    where: { id: userId },
    data: { demeritPoints: newPoints },
  });

  // Create notification
  await (prisma as any).notification.create({
    data: {
      userId: userId,
      actorId: userId, // Self is the actor
      type: "DEMERIT",
      postId: postId || null,
    },
  });

  return {
    deleted: false,
    newPoints,
    warning: `Warning: Your content contains slang/inappropriate language. You have received a demerit point (${newPoints}/3). 3 demerit points will result in permanent account deletion.`,
  };
}
