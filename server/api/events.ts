import { createHandler } from "@vercel/slack-bolt";
import { blocks, context, section } from "slack.ts";
import { app, receiver, returnHugToUser } from "~~/server/utils/slack";
import { db } from "../utils/db";
import { events, rateLimits } from "../utils/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

app.command("/give-hug-local", async (event) => {
  await event.ack();

  const prefilledUser = event.body.text
    .split(" ")
    .map((user) => user.match(/<@(?<id>[A-Z0-9]{11})\|.*>/)?.groups?.id)
    .filter((x): x is string => !!x)[0];

  await app.client.views.open({
    trigger_id: event.body.trigger_id,
    view: {
      type: "modal",
      callback_id: "give_hug_modal",

      title: { type: "plain_text", text: "give a hug" },
      submit: {
        type: "plain_text",
        text: "send hug :neocat_heart:",
        emoji: true,
      },
      close: { type: "plain_text", text: "no hug" },

      blocks: [
        {
          type: "input",
          block_id: "user_block",
          label: { type: "plain_text", text: "user" },
          element: {
            type: "users_select",
            action_id: "user",
            initial_user: prefilledUser,
            // focus_on_load: !prefilledUser, -> appears to have no effect
            placeholder: { type: "plain_text", text: "select a user..." },
          },
        },
        {
          type: "input",
          block_id: "message_block",
          label: { type: "plain_text", text: "message" },
          optional: true,
          element: {
            type: "plain_text_input",
            action_id: "message",
            multiline: true,
            // focus_on_load: !!prefilledUser,
            placeholder: {
              type: "plain_text",
              text: "say something nice to them!",
            },
          },
        },
      ],
    },
  });
});

app.view("give_hug_modal", async (event) => {
  await event.ack({
    response_action: "update",
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "give a hug",
      },
      close: {
        type: "plain_text",
        text: "close",
      },
      blocks: blocks(
        section("hugs sent! :neocat_heart:"),
        context("made by <@U09D42Q0ARJ>"),
      ),
    },
  });

  const values = event.view.state.values;
  if (!values.user_block?.user) {
    console.warn(
      "give_hug_modal submitted without an associated user_block.user",
    );
    return;
  }
  if (!values.message_block?.message) {
    console.warn(
      "give_hug_modal submitted without an associated message_block.message",
    );
    return;
  }

  const fromId = event.body.user.id;
  const toId = values.user_block.user.selected_user as string;
  const message = values.message_block.message.value as string;

  // rate limit hugs sending
  // primary key userId + timestamp, effective 1 req/sec
  const [limit] = await db
    .insert(rateLimits)
    .values({ userId: fromId })
    .onConflictDoUpdate({
      target: [rateLimits.userId, rateLimits.ts],
      set: {
        count: sql`${rateLimits.count} + 1`,
      },
    })
    .returning();
  if (!limit || limit.count > 1) return;

  // auto-cleanup old rate limit rows
  await db
    .delete(rateLimits)
    .where(and(lt(rateLimits.ts, sql`(unixepoch())`), lt(rateLimits.count, 2)));

  await sendHugToUser({ fromId, toId, message });
});

app.action("give_hug_back", async (event) => {
  console.log("give_hug_back");
  await event.ack();

  if (event.body.type !== "block_actions") {
    console.warn(
      "give_hug_back action received with incorrect type (expected: block_actions)",
    );
    return;
  }
  if (!event.body.channel || !event.body.message) {
    console.warn(
      "give_hug_back action received without associated channel/message",
    );
    return;
  }

  if (event.action.type !== "button") {
    console.warn(
      "give_hug_back action received with incorrect action type (expected: button)",
    );
    return;
  }
  if (!event.action.value) {
    console.warn("give_hug_back action received without associated value");
    return;
  }

  const channel = event.body.channel.id;
  const ts = event.body.message.ts;
  const fromId = event.body.user.id;
  const toId = event.action.value;

  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.idempotencyKey, ts))
    .limit(1);
  if (existing) return;

  await returnHugToUser({ channel, ts, fromId, toId });
});

export default fromWebHandler(createHandler(app, receiver));
