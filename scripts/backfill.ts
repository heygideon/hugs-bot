// * hugs v1 had no database of hugs being sent or received
//   (which is kinda necessary for a leaderboard)
// * this script reads every message in the hugs channel,
//   parses hug send/return messages (i.e, who sent a hug,
//   to who, and when), and backfills them into the db

const CHANNEL = "C09RR27E2HL"; // -> #hugs

import { events } from "../src/db/schema";
import { requiredEnv } from "../src/lib/env";
import { App } from "@slack/bolt";
import type { ConversationsHistoryResponse } from "@slack/web-api";
import yoctoSpinner from "yocto-spinner";
import { styleText } from "node:util";
import confirm from "@inquirer/confirm";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile("./.env");
} catch (e) {}

// import database after env is defined
const { db } = await import("../src/db");

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
type MessageElement = Prettify<
  NonNullable<ConversationsHistoryResponse["messages"]>[0]
>;

const { client } = new App({
  token: requiredEnv("SLACK_XOXB"),
  signingSecret: "empty",
});
let spinner = yoctoSpinner({ color: "gray", text: "preparing..." }).start();

const parsed: (typeof events.$inferInsert)[] = [];

const unknownMessages = {
  unknown: [] as string[],
  ignored: [] as string[],
};
const IGNORE_REGEXES = [
  /_\+ \d+ more_/, // trailing line from multiple hugs (_+ 3 more_)
];
function handleUnknownMessage(message: string, ignored_bot_id?: string) {
  if (ignored_bot_id) {
    unknownMessages.ignored.push(`[${ignored_bot_id}] ${message}`);
  } else if (IGNORE_REGEXES.some((r) => r.test(message))) {
    unknownMessages.ignored.push(message);
  } else {
    unknownMessages.unknown.push(message);
  }
}

// <@user> sent a hug to <@user>!
// <@user> sent a hug back to <@user>!
function parseSingleBotMessage(message: MessageElement) {
  // already matched with this regex earlier, so non-null assertion is okay
  const match = message.text!.match(parseSingleBotMessage.regex)!;
  const { from, type, to } = match.groups!;
  const createdAt = new Date(parseInt(message.ts!.split(".")[0]) * 1000);

  parsed.push({
    type: type === "hug back" ? "hug_return" : "hug_send",
    fromId: from,
    toId: to,
    source: "workflow",
    createdAt,
  });
}
parseSingleBotMessage.regex =
  /<@(?<from>U[A-Z0-9]{8,10})> \*?sent a (?<type>hug(?: back)?)\*? to <@(?<to>U[A-Z0-9]{8,10})>!/;

// <@user> sent a hug to n people!
function parseMultipleBotMessage(message: MessageElement) {
  for (const block of message.blocks || []) {
    if (block.type !== "section" || !block.text?.text) continue;

    const match = block.text.text.match(
      /<@(?<from>U[A-Z0-9]{8,10})>.+<@(?<to>U[A-Z0-9]{8,10})>/,
    );
    if (!match) {
      handleUnknownMessage(block.text.text);
      continue;
    }

    const { from, to } = match.groups!;
    const createdAt = new Date(parseInt(message.ts!.split(".")[0]) * 1000);
    parsed.push({
      type: "hug_send",
      fromId: from,
      toId: to,
      source: "v1",
      createdAt,
    });
  }
}
parseMultipleBotMessage.regex = /<@(U[A-Z0-9]{10})> sent a hug to \d+ people!/;

// here, make someone's day
// (workflow era: hugs were sent threaded on the original message)
async function parseWorkflowThread(message: MessageElement) {
  if (!message.ts) return;

  // extra rate-limit throttling
  await new Promise((r) => setTimeout(r, 200));

  const thread = await client.conversations.replies({
    channel: CHANNEL,
    ts: message.ts,
  });
  if (thread.has_more) {
    console.log(
      styleText("yellow", `Replies may be missing from thread ${message.ts}`),
    );
  }

  for (const subMessage of thread.messages || []) {
    // <@user> sent <@user> a hug
    // <@user> sent <@user> a hug back
    const REGEX =
      /<@(?<from>U[A-Z0-9]{8,10})> sent <@(?<to>U[A-Z0-9]{8,10})> a (?<type>hug(?: back)?)/;

    if (
      subMessage.ts === message.ts ||
      (subMessage as MessageElement).subtype !== "bot_message"
    ) {
      continue;
    }

    const match = (subMessage.text || "").match(REGEX);
    if (!match) {
      handleUnknownMessage(subMessage.text || "");
      continue;
    }

    const { from, to, type } = match.groups!;
    const createdAt = new Date(parseInt(subMessage.ts!.split(".")[0]) * 1000);
    parsed.push({
      type: type === "hug back" ? "hug_return" : "hug_send",
      fromId: from,
      toId: to,
      source: "workflow",
      createdAt,
    });
  }
}
parseWorkflowThread.regex = /here, make someone's day/;

async function parseMessage(message: MessageElement) {
  const BOT_IDS = [
    "B0A5TS33E3B", // current
    "B09UXHVPASJ", // ┐
    "B09T33Y3NLW", // ├	workflows
    "B09RLGQGM0T", // ┘
  ];
  if (!BOT_IDS.includes(message.bot_id || "")) {
    if (message.subtype === "bot_message") {
      handleUnknownMessage(message.text || "", message.bot_id || "");
    }
    return;
  }
  if (parseSingleBotMessage.regex.test(message.text || "")) {
    parseSingleBotMessage(message);
  } else if (parseMultipleBotMessage.regex.test(message.text || "")) {
    parseMultipleBotMessage(message);
  } else if (parseWorkflowThread.regex.test(message.text || "")) {
    await parseWorkflowThread(message);
  } else {
    handleUnknownMessage(message.text || "");
  }
}

const tail = () => {
  const last = parsed.at(-1);
  if (!last) return "";

  return `${styleText("italic", last.type)} ${last.fromId} → ${last.toId}`;
};

let cursor: string | undefined;
let hasMore = true;
while (hasMore) {
  spinner.text = `waiting... (${parsed.length} / ?)\n${styleText("dim", tail())}`;
  spinner.color = "gray";

  // extra rate-limit throttling, not needed at higher limits since 0.005 * n is large enough
  // await new Promise((r) => setTimeout(r, 500));
  const res = await client.conversations.history({
    channel: CHANNEL,
    cursor,
    limit: 999,
  });

  spinner.text = `parsing... (${parsed.length} / ?)\n${styleText("dim", tail())}`;
  spinner.color = "cyan";

  for (const message of res.messages!) {
    await parseMessage(message);

    spinner.text = `parsing... (${parsed.length} / ?)\n${styleText("dim", tail())}`;
    await new Promise((r) => setTimeout(r, 5));
  }

  if (res.has_more) {
    if (!res.response_metadata?.next_cursor) {
      throw new Error("expected next_cursor, none provided");
    }
    hasMore = true;
    cursor = res.response_metadata.next_cursor;
  } else {
    hasMore = false;
  }
}

spinner.success(
  `parsed ${parsed.length} hugs ${styleText(
    "italic",
    `(${parsed.filter((v) => v.type === "hug_send").length} sent, ${parsed.filter((v) => v.type === "hug_return").length} returned)`,
  )}`,
);

console.log("");
if (unknownMessages.unknown.length > 0) {
  console.log(styleText(["yellow", "bold"], "unknown messages"));
  for (const message of unknownMessages.unknown) {
    console.log(styleText("yellow", message.substring(0, 100)));
  }
} else {
  console.log(styleText(["green", "bold"], "no unknown messages"));
}

console.log("");
if (unknownMessages.ignored.length > 0) {
  console.log(styleText(["dim", "bold"], "ignored messages"));
  for (const message of unknownMessages.ignored) {
    console.log(styleText("dim", message.substring(0, 100)));
  }
} else {
  console.log(styleText(["dim", "bold"], "no ignored messages"));
}

console.log("");
const confirmed = await confirm({ message: "Okay to save?" });
if (!confirmed) {
  process.exit(1);
}

console.log("");
spinner = yoctoSpinner({ text: `saving... (0 / ${parsed.length})` });

const chunkSize = 500;
for (let i = 0; i < parsed.length; i += chunkSize) {
  const chunk = parsed.slice(i, i + chunkSize);
  await db.insert(events).values(chunk);
  spinner.text = `saving... (${Math.min(i + chunkSize - 1, parsed.length)} / ${parsed.length})`;
  await new Promise((r) => setTimeout(r, 5));
}
spinner.success(`saved ${parsed.length} hugs!`);

console.log("");
console.log("all done ^-^");
