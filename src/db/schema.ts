import {
  integer,
  primaryKey,
  pgTable,
  text,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial().primaryKey(),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  type: text({
    enum: [
      "hug_send",
      "hug_return",
      "boop_send",
      "boop_return",
      "pat_send",
      "pat_return",
    ],
  }).notNull(),
  source: text({ enum: ["workflow", "v1", "v2"] }).notNull(),

  // Idempotency key for hug_return
  idempotencyKey: text("idempotency_key"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rateLimits = pgTable(
  "rate_limits",
  {
    userId: text("user_id").notNull(),
    ts: timestamp().notNull().defaultNow(),
    count: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.userId, t.ts] })],
);

export const forwardingConfig = pgTable("forwarding_config", {
  id: integer().primaryKey(),
  forwardTo: text("forward_to").notNull(),
  forwardUids: text("forward_uids").array().notNull(),
});
