import { createServerFn } from "@tanstack/react-start";
import { leaderboardSchema } from "./schemas";
import { events } from "~/db/schema";
import { and, count, desc, like } from "drizzle-orm";
import { db } from "~/db";
import { getUserInfo } from "~/lib/cachet";

export const getLeaderboard = createServerFn()
  .validator(leaderboardSchema)
  .handler(async ({ data }) => {
    const userId = data.view === "receive" ? events.toId : events.fromId;
    const leaderboard = await db
      .select({
        userId,
        count: count(events.id),
      })
      .from(events)
      .where(
        and(
          // like(events.type, `${type.output}%`)
          data.view === "return"
            ? like(events.type, "%return")
            : like(events.type, "%send"),
        ),
      )
      .groupBy(userId)
      .orderBy((query) => desc(query.count))
      .limit(50);

    return Promise.all(
      leaderboard.map(async (row) => {
        const user = await getUserInfo(row.userId);
        return { ...row, user };
      }),
    );
  });
