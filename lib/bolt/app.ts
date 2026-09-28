// this code is so brittle but it works so I'm not touching it :D

import { App, type BlockAction, type ButtonAction } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";

const receiver = new VercelReceiver();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
  deferInitialization: true,
});

app.command("/give-hug", async ({ client, command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  const dedupe = <T>(array: T[]) => [...new Set(array)];
  const initial_users = dedupe(
    command.text
      .split(" ")
      .map((user) => user.match(/<@(?<id>[A-Z0-9]{11})\|.*>/)?.groups?.id)
      .filter((x): x is string => !!x),
  );

  const result = await client.views.open({
    trigger_id: command.trigger_id,
    view: {
      type: "modal",
      callback_id: "give_hug_modal",
      title: {
        type: "plain_text",
        text: "give a hug",
        emoji: true,
      },
      submit: {
        type: "plain_text",
        text: "send hug :neocat_heart:",
        emoji: true,
      },
      close: {
        type: "plain_text",
        text: "no hug",
        emoji: true,
      },
      blocks: [
        {
          type: "input",
          block_id: "user_block",
          label: { type: "plain_text", text: "people to hug" },
          optional: false,
          element: {
            type: "multi_users_select",
            action_id: "user",
            initial_users: initial_users,
            max_selected_items:
              command.user_id === "U09D42Q0ARJ"
                ? undefined // rules for thee but not for me
                : 50,
            focus_on_load: initial_users.length === 0,
            placeholder: {
              type: "plain_text",
              text: "select users",
            },
          },
        },
        {
          type: "input",
          block_id: "message_block",
          label: {
            type: "plain_text",
            text: "message",
          },
          optional: true,
          element: {
            type: "rich_text_input",
            action_id: "message",
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

app.view("give_hug_modal", async ({ ack, body, view, client }) => {
  const users = view.state.values.user_block.user.selected_users!;
  const message = view.state.values.message_block.message.value;

  await ack({
    response_action: "update",
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "give a hug",
        emoji: true,
      },
      close: {
        type: "plain_text",
        text: "close",
        emoji: true,
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "hugs sent! :neocat_heart:",
            emoji: true,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "made by <@U09D42Q0ARJ|heygideon>",
            },
          ],
        },
      ],
    },
  });

  for (const user of users) {
    await client.chat.postMessage({
      channel: user,
      text: `you got a hug from <@${body.user.id}>!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:neocat_hug_heart: you got a hug from <@${body.user.id}>!${
              message
                ? `\n\nthey said:\n>${message.split("\n").join("\n>")}`
                : ""
            }`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              style: "primary",
              text: {
                type: "plain_text",
                text: ":neocat_aww: give hug back!",
                emoji: true,
              },
              value: body.user.id,
              action_id: "give_hug_back",
            },
          ],
        },
      ],
    });
  }

  await client.chat.postMessage({
    channel: "C09RR27E2HL", // #hugs
    text: `<@${body.user.id}> sent a hug to ${users.length > 1 ? `${users.length} people` : `<@${users[0]}>`}!`,
    blocks: [
      ...users.slice(0, 49).map((user) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:neocat_heart: <@${body.user.id}> *sent a hug* to <@${user}>!`,
        },
      })),
      ...(users.length > 50
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `_+ ${users.length - 50} more_`,
              },
            },
          ]
        : []),
    ],
  });
});

app.action<BlockAction<ButtonAction>>(
  "give_hug_back",
  async ({ body, ack, action, client }) => {
    await ack();

    await client.chat.update({
      channel: body.channel!.id,
      ts: body.message!.ts,
      blocks: [
        body.message!.blocks[0],
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `you clicked *give hug back!*`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "send your own hugs! `/give-hug`",
            },
          ],
        },
      ],
    });

    await client.chat.postMessage({
      channel: action.value!,
      text: `:neocat_hug_heart: <@${body.user.id}> gave you a hug back!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:neocat_hug_heart: <@${body.user.id}> gave you a hug back!`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "send more hugs! `/give-hug`",
            },
          ],
        },
      ],
    });

    await client.chat.postMessage({
      channel: "C09RR27E2HL", // #hugs
      text: `<@${body.user.id}> sent a hug back to <@${action.value}>!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:neocat_snuggle: <@${body.user.id}> *sent a hug back* to <@${action.value}>!`,
          },
        },
      ],
    });
  },
);

export { app, receiver };
