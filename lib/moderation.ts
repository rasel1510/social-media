import prisma from "./db";

/**
 * Checks content with OpenRouter for inappropriate language (slang, bad words, profanity).
 * Returns true if inappropriate content is found, false otherwise.
 */
export async function checkContentForBadWords(content: string): Promise<boolean> {
  if (!content || !content.trim()) return false;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set. Content moderation is disabled.");
    return false;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mini Social Media Moderation",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a content moderation AI. Analyze the text provided by the user. If the text contains any offensive slang, bad words, profanity, insults, or highly inappropriate language, you must respond ONLY with a JSON object: { \"containsBadWords\": true }. If it does not contain any of these, you must respond ONLY with { \"containsBadWords\": false }. Do not write any other text or markdown codeblocks, only valid JSON."
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error(`OpenRouter API responded with status ${response.status}`);
      return false;
    }

    const data = await response.json();
    const resText = data.choices?.[0]?.message?.content?.trim();
    if (!resText) return false;

    try {
      const parsed = JSON.parse(resText);
      return !!parsed.containsBadWords;
    } catch {
      // Fallback parser: search for any '{ ... }'
      const jsonMatch = resText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return !!parsed.containsBadWords;
        } catch {}
      }
      return resText.toLowerCase().includes("true");
    }
  } catch (error) {
    console.error("Error in checkContentForBadWords:", error);
    return false;
  }
}

/**
 * Increments demerit points.
 * If user reaches 3 demerit points, deletes user and returns { deleted: true }.
 * Otherwise, updates points and creates a warning notification, returning { deleted: false, newPoints }.
 */
export async function applyDemeritPoint(userId: string, postId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { demeritPoints: true }
  });

  if (!user) throw new Error("User not found");

  const currentPoints = user.demeritPoints || 0;
  const newPoints = currentPoints + 1;

  if (newPoints >= 3) {
    // Delete user and cascade delete everything
    await prisma.user.delete({
      where: { id: userId }
    });
    return {
      deleted: true,
      error: "Your account has been permanently deleted because you accumulated 3 demerit points for content policy violations."
    };
  }

  // Update user demerit points
  await prisma.user.update({
    where: { id: userId },
    data: { demeritPoints: newPoints }
  });

  // Create notification
  await (prisma as any).notification.create({
    data: {
      userId: userId,
      actorId: userId, // Self is the actor
      type: "DEMERIT",
      postId: postId || null,
    }
  });

  return {
    deleted: false,
    newPoints,
    warning: `Warning: Your content contains slang/inappropriate language. You have received a demerit point (${newPoints}/3). 3 demerit points will result in permanent account deletion.`
  };
}
