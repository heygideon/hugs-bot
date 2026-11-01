// * hugs v2 had broken rate-limit code (see de4a1fe)
// * this script reads every message in the hugs channel
//   (or database events) between specific times, removes
//   those messages, removes any dms and database events,
//   and sends a message to affected users

const CHANNEL = "C09RR27E2HL"; // -> #hugs

const groups = [
  { oldest: 1792967591, latest: 1792970914 },
  { oldest: 1793316449, latest: 1793316797 },
];

import { App } from "@slack/bolt";
import { blocks, context, section } from "slack.ts";
import yoctoSpinner from "yocto-spinner";
import { requiredEnv } from "~/lib/env";
import confirm from "@inquirer/confirm";
import { loadEnvFile } from "node:process";
import { and, count, gte, lte, or } from "drizzle-orm";
import { events } from "~/db/schema";

try {
  loadEnvFile("./.env");
} catch (e) {}

// import database after env is defined
const { db } = await import("../src/db");

let spinner = yoctoSpinner({ color: "gray", text: "preparing..." }).start();

const { client } = new App({
  token: requiredEnv("SLACK_XOXB"),
  signingSecret: "empty",
});

interface MessageToDelete {
  channel: string;
  ts: string;
}
let messages: MessageToDelete[] = [];
let uids: string[] = [];

// for (const { oldest, latest } of groups) {
//   let cursor: string | undefined;
//   let hasMore = true;
//   while (hasMore) {
//     spinner.color = "cyan";
//     spinner.text = "scanning channel...";
//
//     // extra rate-limit throttling
//     await new Promise((r) => setTimeout(r, 1200));
//     const res = await client.conversations.history({
//       channel: CHANNEL,
//       cursor,
//       limit: 999,
//       oldest: oldest.toString(),
//       latest: latest.toString(),
//     });
//
//     for (const message of res.messages!) {
//       if (message.bot_id !== "B0A5TS33E3B" || !message.text || !message.ts)
//         continue;
//
//       const pattern = /to <@(?<to>U[A-Z0-9]{8,10})>!/;
//       const match = message.text.match(pattern);
//       if (!match) continue;
//
//       const { to } = match.groups!;
//       if (!uids.includes(to)) uids.push(to);
//
//       messages.push({ channel: CHANNEL, ts: message.ts });
//     }
//
//     if (res.has_more) {
//       if (!res.response_metadata?.next_cursor) {
//         throw new Error("expected next_cursor, none provided");
//       }
//       hasMore = true;
//       cursor = res.response_metadata.next_cursor;
//     } else {
//       hasMore = false;
//     }
//   }
// }

const toIds = await db
  .selectDistinct({
    toId: events.toId,
  })
  .from(events)
  .where(
    or(
      ...groups.map(({ oldest, latest }) =>
        and(
          gte(events.createdAt, new Date(oldest * 1000)),
          lte(events.createdAt, new Date(latest * 1000 + 1000)),
        ),
      ),
    ),
  );
for (const row of toIds) {
  uids.push(row.toId);
}

for (const user of uids) {
  spinner.color = "cyan";
  spinner.text = `scanning ims... (${uids.indexOf(user) + 1} / ${uids.length})`;

  const { channel } = await client.conversations.open({
    users: user,
  });
  if (!channel?.id) continue;

  for (const { oldest, latest } of groups) {
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
      // extra rate-limit throttling
      await new Promise((r) => setTimeout(r, 1200));
      const res = await client.conversations.history({
        channel: channel.id,
        cursor,
        limit: 999,
        oldest: oldest.toString(),
        latest: latest.toString(),
      });

      for (const message of res.messages!) {
        if (!message.text || !message.ts) continue;

        messages.push({ channel: channel.id, ts: message.ts });
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
  }
}

spinner.success(`${messages.length} messages for ${uids.length} users`);

console.log("");
const confirmed = await confirm({ message: "Okay to delete messages?" });
if (!confirmed) {
  process.exit(1);
}

console.log("");
spinner = yoctoSpinner({
  text: `deleting... (0 / ${messages.length})`,
}).start();

for (let i = 0; i < messages.length; i += 1) {
  spinner.text = `deleting... (${i} / ${messages.length})`;
  const message = messages[i];

  await client.chat.delete(message);

  await new Promise((r) => setTimeout(r, 1200));
}
spinner.success(`deleted ${messages.length} messages`);

spinner = yoctoSpinner({ text: `notifying ${uids.length} users...` }).start();
for (const user of uids) {
  await client.chat.postEphemeral({
    channel: user,
    user,
    text: "meow! apologies for earlier... all the messages should be cleared now.",
    blocks: blocks(
      section(
        "meow! apologies for earlier - my rate-limiting code wasn't working as intended. it's my first day, so I guess I got a nice hack club welcome :neocat_shy:",
      ),
      section(
        "all the messages should be cleared now. thanks for your patience!",
      ),
      context("<@U09D42Q0ARJ> asked me to say this <3"),
    ),
  });
  await new Promise((r) => setTimeout(r, 500));
}
spinner.success(`notified ${uids.length} users`);

console.log("");
spinner = yoctoSpinner({
  text: "scanning db...",
}).start();

const [eventsToDelete] = await db
  .select({
    count: count(),
  })
  .from(events)
  .where(
    or(
      ...groups.map(({ oldest, latest }) =>
        and(
          gte(events.createdAt, new Date(oldest * 1000)),
          lte(events.createdAt, new Date(latest * 1000 + 1000)),
        ),
      ),
    ),
  );

spinner.success(`${eventsToDelete.count} events found`);

console.log("");
const confirmed2 = await confirm({ message: "Okay to delete events?" });
if (!confirmed2) {
  process.exit(1);
}

console.log("");
spinner = yoctoSpinner({ text: "deleting..." }).start();
await db
  .delete(events)
  .where(
    or(
      ...groups.map(({ oldest, latest }) =>
        and(
          gte(events.createdAt, new Date(oldest * 1000)),
          lte(events.createdAt, new Date(latest * 1000 + 1000)),
        ),
      ),
    ),
  );
spinner.success(`deleted ${eventsToDelete.count} events`);

console.log("");
console.log("all done ^-^");
