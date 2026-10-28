import { actions, blocks, button, context, section, text } from "slack.ts";
import { db } from "~/db";
import { events } from "~/db/schema";
import type { PlainTextOption, View } from "@slack/types";
import { app, CHANNEL } from "./app";
import z from "zod";

export const giveHugAnimation = () =>
  section(
    ["t", "b"]
      .reduce((acc, l) => {
        const row = Array.from({ length: 6 }).map(
          (_, i) => `:give-hug-2x-${l}-${i + 1}:`,
        );
        acc.push(row.join(""));
        return acc;
      }, [] as string[])
      .join("\n"),
  );

export const hugTypeOpts = [
  {
    value: "hug" as const,
    text: { type: "plain_text", text: ":neocat_heart: hug" },
  },
  {
    value: "boop" as const,
    text: { type: "plain_text", text: ":neocat_boop_blush: boop" },
  },
  {
    value: "pat" as const,
    text: { type: "plain_text", text: ":neocat_pat: pat" },
  },
] satisfies PlainTextOption[];
export const hugTypeSchema = z
  .enum(hugTypeOpts.map((v) => v.value))
  .catch("hug");
export type HugType = z.infer<typeof hugTypeSchema>;

type Emoji = `:${string}:`;
export const hugTypeEmojis: {
  [K in HugType]: { default: Emoji; from?: Emoji; to?: Emoji };
} = {
  hug: {
    default: ":neocat_hug_heart:",
    from: ":neocat_heart:",
    to: ":neocat_snuggle:",
  },
  boop: { default: ":neocat_boop_blush:" },
  pat: { default: ":neocat_pat:" },
};

export const giveHugModal = (opts: { prefilledUser?: string }) =>
  ({
    type: "modal",
    callback_id: "give_hug_modal",
    external_id: "give_hug_modal",

    title: { type: "plain_text", text: "give a hugs" },
    submit: {
      type: "plain_text",
      text: "send hug :neocat_heart:",
      emoji: true,
    },
    close: { type: "plain_text", text: "no hug" },

    blocks: [
      {
        type: "input",
        block_id: "type_block",
        label: { type: "plain_text", text: "type" },
        element: {
          type: "static_select",
          action_id: "type",
          placeholder: { type: "plain_text", text: "select a type..." },
          initial_option: hugTypeOpts[0],
          options: hugTypeOpts,
        },
      },
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
  type: HugType;
  fromId: string;
  toId: string;
  message?: string;
}
export async function sendHugToUser(opts: SendHugToUserOpts) {
  console.time("send_hug");

  const defaultEmoji = hugTypeEmojis[opts.type].default;
  const fromEmoji = hugTypeEmojis[opts.type].from || defaultEmoji;

  const dmPromise = app.client.chat.postMessage({
    channel: opts.toId,
    text: `you got a ${opts.type} from <@${opts.fromId}>!`,
    blocks: blocks(
      section(`${defaultEmoji} you got a ${opts.type} from <@${opts.fromId}>!`),
      ...(opts.message
        ? [section(`they said:\n>${opts.message.split("\n").join("\n>")}`)]
        : []),
      actions(
        button(
          text(`:neocat_aww: give ${opts.type} back!`)
            .mrkdwn(false)
            .emoji(true),
        )
          .style("primary")
          .id("give_hug_back")
          .value(`${opts.fromId}.${opts.type}`),
      ),
    ),
  });
  const channelPromise = app.client.chat.postMessage({
    channel: CHANNEL,
    text: `<@${opts.fromId}> sent a ${opts.type} to <@${opts.toId}>!`,
    blocks: blocks(
      section(
        `${fromEmoji} <@${opts.fromId}> sent a ${opts.type} to <@${opts.toId}>!`,
      ),
    ),
  });
  const dbInsertPromise = db.insert(events).values({
    type: `${opts.type}_send`,
    fromId: opts.fromId,
    toId: opts.toId,
    source: "v2",
  });

  await Promise.all([dmPromise, channelPromise, dbInsertPromise]);

  console.timeEnd("send_hug");
}

interface ReturnHugToUserOpts {
  type: HugType;
  channel: string;
  ts: string;
  fromId: string;
  toId: string;
}
export async function returnHugToUser(opts: ReturnHugToUserOpts) {
  console.time("return_hug");

  const defaultEmoji = hugTypeEmojis[opts.type].default;
  const toEmoji = hugTypeEmojis[opts.type].to || defaultEmoji;

  // Update original message
  const updatePromise = app.client.chat.update({
    channel: opts.channel,
    ts: opts.ts,
    blocks: blocks(
      section(`${defaultEmoji} you got a ${opts.type} from <@${opts.toId}>!`),
      section(`you clicked *give ${opts.type} back!*`),
      context(`send your own ${opts.type}s! \`/give-hug\``),
    ),
  });

  const dmPromise = app.client.chat.postMessage({
    channel: opts.toId,
    text: `<@${opts.fromId}> gave you a ${opts.type} back!`,
    blocks: blocks(
      section(
        `${defaultEmoji} <@${opts.fromId}> gave you a ${opts.type} back!`,
      ),
      context(`send more ${opts.type}s! \`/give-hug\``),
    ),
  });
  const channelPromise = app.client.chat.postMessage({
    channel: CHANNEL,
    text: `<@${opts.fromId}> sent a ${opts.type} back to <@${opts.toId}>!`,
    blocks: blocks(
      section(
        `${toEmoji} <@${opts.fromId}> sent a ${opts.type} back to <@${opts.toId}>!`,
      ),
    ),
  });
  const dbPromise = db.insert(events).values({
    type: `${opts.type}_return`,
    fromId: opts.fromId,
    toId: opts.toId,
    source: "v2",
    idempotencyKey: opts.ts,
  });

  await Promise.all([updatePromise, dmPromise, channelPromise, dbPromise]);

  console.timeEnd("return_hug");
}
