import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "~/db";
import { rateLimits } from "~/db/schema";

export async function ratelimit(userId: string) {
  // rate limit hugs sending
  // primary key userId + timestamp, effective 1 req/sec
  // with 30sec timeout for exceeding

  const ts = Math.floor(Date.now() / 1000);

  const [[existing], [limit]] = await Promise.all([
    db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.userId, userId),
          gt(rateLimits.ts, ts - 30), // within last 30s
        ),
      ),

    db
      .insert(rateLimits)
      .values({ userId, ts })
      .onConflictDoUpdate({
        target: [rateLimits.userId, rateLimits.ts],
        set: {
          count: sql`${rateLimits.count} + 1`,
        },
      })
      .returning(),
  ]);

  if (existing) return false;

  if (!limit) {
    console.warn("ratelimit failed to create row");
  }
  if (!limit || limit.count > 1) return false;

  // auto-cleanup old rate limit rows
  await db
    .delete(rateLimits)
    .where(and(lt(rateLimits.ts, ts), lt(rateLimits.count, 2)));

  return true;
}
