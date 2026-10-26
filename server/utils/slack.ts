import { actions, blocks, button, context, section, text } from "slack.ts";
import { App } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";
import { env, requiredEnv } from "./env";
import { db } from "./db";
import { events } from "./db/schema";
import { View } from "@slack/types";

const CHANNEL = env("SLACK_CHANNEL") || "C09RR27E2HL"; // -> #hugs

export const receiver = new VercelReceiver();
export const app = new App({
  token: requiredEnv("SLACK_XOXB"),
  signingSecret: requiredEnv("SLACK_SIGNING_SECRET"),
  receiver,
  deferInitialization: true,
});

export const giveHugModal = (opts: { prefilledUser?: string }) =>
  ({
    type: "modal",
    callback_id: "give_hug_modal",
    external_id: "give_hug_modal",

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
          initial_user: opts.prefilledUser,
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
  }) satisfies View;

interface SendHugToUserOpts {
  fromId: string;
  toId: string;
  message?: string;
}
export async function sendHugToUser(opts: SendHugToUserOpts) {
  await app.client.chat.postMessage({
    channel: opts.toId,
    text: `you got a hug from <@${opts.fromId}>!`,
    blocks: blocks(
      section(`:neocat_hug_heart: you got a hug from <@${opts.fromId}>!`),
      ...(opts.message
        ? [section(`they said:\n>${opts.message.split("\n").join("\n>")}`)]
        : []),
      actions(
        button(text(":neocat_aww: give hug back!").mrkdwn(false).emoji(true))
          .style("primary")
          .id("give_hug_back")
          .value(opts.toId),
      ),
    ),
  });
  await app.client.chat.postMessage({
    channel: CHANNEL,
    text: `<@${opts.fromId}> sent a hug to <@${opts.toId}>!`,
    blocks: blocks(
      section(
        `:neocat_heart: <@${opts.fromId}> sent a hug to <@${opts.toId}>!`,
      ),
    ),
  });

  await db.insert(events).values({
    type: "hug_send",
    fromId: opts.fromId,
    toId: opts.toId,
  });
}

interface ReturnHugToUserOpts {
  channel: string;
  ts: string;
  fromId: string;
  toId: string;
}
export async function returnHugToUser(opts: ReturnHugToUserOpts) {
  // Update original message
  await app.client.chat.update({
    channel: opts.channel,
    ts: opts.ts,
    blocks: blocks(
      section(`:neocat_hug_heart: you got a hug from <@${opts.toId}>!`),
      section(`you clicked *give hug back!*`),
      context("send your own hugs! `/give-hug`"),
    ),
  });

  await app.client.chat.postMessage({
    channel: opts.toId,
    text: `<@${opts.fromId}> gave you a hug back!`,
    blocks: blocks(
      section(`:neocat_hug_heart: <@${opts.fromId}> gave you a hug back!`),
      section("send more hugs! `/give-hug`"),
    ),
  });

  await app.client.chat.postMessage({
    channel: CHANNEL,
    text: `<@${opts.fromId}> sent a hug back to <@${opts.toId}>!`,
    blocks: blocks(
      section(
        `:neocat_snuggle: <@${opts.fromId}> sent a hug back to <@${opts.toId}>!`,
      ),
    ),
  });

  await db.insert(events).values({
    type: "hug_return",
    fromId: opts.fromId,
    toId: opts.toId,
    idempotencyKey: opts.ts,
  });
}
