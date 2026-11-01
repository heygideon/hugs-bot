import { App } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";
import { env, requiredEnv } from "~/lib/env";

export const CHANNEL = env("SLACK_CHANNEL") || "C09RR27E2HL"; // -> #hugs

export const receiver = new VercelReceiver();
export const app = new App({
  token: requiredEnv("SLACK_XOXB"),
  signingSecret: requiredEnv("SLACK_SIGNING_SECRET"),
  receiver,
  deferInitialization: true,
});
