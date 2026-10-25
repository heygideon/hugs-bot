import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: integer().primaryKey({ autoIncrement: true }),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  type: text({ enum: ["hug_send", "hug_return"] }).notNull(),

  // Idempotency key for hug_return
  idempotencyKey: text("idempotency_key"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => sql`(unixepoch())`),
});

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    userId: text("user_id").notNull(),
    ts: integer()
      .notNull()
      .default(sql`(unixepoch())`),
    count: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.userId, t.ts] })],
);
