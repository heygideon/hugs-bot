import { and, lt, sql } from "drizzle-orm";

export async function ratelimit(userId: string) {
  // rate limit hugs sending
  // primary key userId + timestamp, effective 1 req/sec
  const [limit] = await db
    .insert(rateLimits)
    .values({ userId })
    .onConflictDoUpdate({
      target: [rateLimits.userId, rateLimits.ts],
      set: {
        count: sql`${rateLimits.count} + 1`,
      },
    })
    .returning();

  if (!limit) {
    console.warn("ratelimit failed to create row");
  }
  if (!limit || limit.count > 1) return false;

  // auto-cleanup old rate limit rows
  await db
    .delete(rateLimits)
    .where(and(lt(rateLimits.ts, sql`(unixepoch())`), lt(rateLimits.count, 2)));

  return true;
}
