import { and, count, desc, like } from "drizzle-orm";
import { fallback, parse, picklist } from "valibot";

interface CachetUserResponse {
  id: string;
  userId: string;
  displayName: string;
  realName: string;
  pronouns: string;
  imageUrl: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = parse(fallback(picklist(["hug"]), "hug"), query.type);
  const view = parse(
    fallback(picklist(["send", "receive", "return"]), "send"),
    query.view,
  );

  const userId = view === "receive" ? events.toId : events.fromId;
  const leaderboard = await db
    .select({
      userId,
      count: count(events.id),
    })
    .from(events)
    .where(
      and(
        // like(events.type, `${type.output}%`)
        view === "return"
          ? like(events.type, "%return")
          : like(events.type, "%send"),
      ),
    )
    .groupBy(userId)
    .orderBy((query) => desc(query.count))
    .limit(50);

  const infos = await Promise.allSettled(
    leaderboard.map(async (row) => {
      const user: CachetUserResponse = await fetch(
        `https://cachet.hackclub.com/users/${row.userId}`,
      ).then((res) => res.json());
      return user;
    }),
  );

  return leaderboard.map((row, idx) => {
    const info = infos[idx];
    if (!info || info.status === "rejected") {
      console.warn(`failed to fetch user info for id ${row.userId}`);
      return {
        ...row,
        user: {
          displayName: row.userId,
          avatar: `https://cachet.hackclub.com/users/${row.userId}/r`,
        },
      };
    }

    return {
      ...row,
      user: {
        displayName: info.value.displayName,
        avatar: info.value.imageUrl.replace("_512", "_48"),
      },
    };
  });
});
