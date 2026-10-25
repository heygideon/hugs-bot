import { actions, blocks, button, context, section, text } from "slack.ts";
import { App } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";

const env = (key: string) => process.env[key];
const requiredEnv = (key: string) => {
  const value = env(key);
  if (value) return value;

  throw new Error(`${key} is not defined in .env`);
};

const CHANNEL = env("SLACK_CHANNEL") || "C09RR27E2HL"; // -> #hugs

export const receiver = new VercelReceiver();
export const app = new App({
  token: requiredEnv("SLACK_XOXB"),
  signingSecret: requiredEnv("SLACK_SIGNING_SECRET"),
  receiver,
  deferInitialization: true,
});

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
}
