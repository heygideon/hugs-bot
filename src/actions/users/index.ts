import { createServerFn } from "@tanstack/react-start";
import { union } from "drizzle-orm/sqlite-core";
import z from "zod";
import { db } from "~/db";
import { events } from "~/db/schema";

interface FlaronUser {
  id: string;
  name: string;
  real_name: string;
  display_name: string;
}

export const searchUsers = createServerFn()
  .validator(z.string())
  .handler(async ({ data: q }) => {
    const sq = union(
      db.select({ id: events.fromId }).from(events),
      db.select({ id: events.toId }).from(events),
    ).as("sq");

    const [dbUsers, { data }] = await Promise.all([
      db.selectDistinct({ id: sq.id }).from(sq),
      fetch(
        `https://flaron.halceon.dev/users/search?q=${encodeURIComponent(q)}`,
      ).then((res) => res.json()),
    ]);

    // Only show users that also have sent/received hugs
    return (data as FlaronUser[]).filter((user) =>
      dbUsers.some((u) => u.id === user.id),
    );
  });

export const getUser = createServerFn()
  .validator(z.string())
  .handler(async ({ data: id }) => {
    const { data } = await fetch(`https://flaron.halceon.dev/user/${id}`).then(
      (res) => res.json(),
    );

    return data.user as FlaronUser;
  });
