import { createHandler } from "@vercel/slack-bolt";
import { actions, blocks, button, context, section } from "slack.ts";
import {
  giveHugModal,
  hugTypeSchema,
  returnHugToUser,
  sendHugToUser,
} from "./helpers";
import { db } from "~/db";
import { events } from "~/db/schema";
import { eq } from "drizzle-orm";
import { ratelimit } from "~/lib/ratelimit";
import { app, receiver } from "./app";

app.command("/give-hug-v2", async (event) => {
  if (event.body.user_id !== "U09D42Q0ARJ") {
    await event.ack({
      response_type: "ephemeral",
      text: "not your time yet! wait a little longer <3",
    });
    return;
  }

  await event.ack();

  const prefilledUser = event.body.text
    .split(" ")
    .map((user) => user.match(/<@(?<id>[A-Z0-9]{11})\|.*>/)?.groups?.id)
    .filter((x): x is string => !!x)[0];

  await app.client.views.open({
    trigger_id: event.body.trigger_id,
    view: giveHugModal({ prefilledUser }),
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
        actions(button("send another?").id("send_another")),
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

  const type = hugTypeSchema.parse(
    values.type_block?.type?.selected_option?.value,
  );
  const fromId = event.body.user.id;
  const toId = values.user_block.user.selected_user!;
  const message = values.message_block.message.value!;

  const allowed = await ratelimit(fromId);
  if (!allowed) return;

  await sendHugToUser({ type, fromId, toId, message });
});

app.action("send_another", async (event) => {
  await event.ack();
  if (event.body.type !== "block_actions") {
    console.warn(
      "send_another action received with incorrect type (expected: block_actions)",
    );
    return;
  }
  if (!event.body.view) {
    console.warn("send_another action received without associated view");
    return;
  }

  await app.client.views.update({
    view_id: event.body.view.id,
    hash: event.body.view.hash,
    view: giveHugModal({}),
  });
});

app.action("give_hug_back", async (event) => {
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
  const [toId, _type] = event.action.value.split(".");
  const type = hugTypeSchema.parse(_type);

  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.idempotencyKey, ts))
    .limit(1);
  if (existing) return;

  await returnHugToUser({ type, channel, ts, fromId, toId });
});

export const handleSlackEvent = createHandler(app, receiver);
