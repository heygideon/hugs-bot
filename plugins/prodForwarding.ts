// * plugin to request forwarding of Slack events from
//   production to a development environment.
// * this allows testing new features without needing to
//   set up a new Slack app, token, commands, urls...

import { styleText } from "node:util";
import type { Plugin } from "vite";

async function setForwardingOn() {
  const secret = process.env.FORWARD_SECRET;
  const productionUrl = process.env.PRODUCTION_URL;
  const forwardTo = process.env.FORWARD_TO;
  const forwardUids = process.env.FORWARD_UIDS;

  if (!secret || !productionUrl || !forwardTo || !forwardUids) {
    console.log(styleText("dim", "Skipped enabling forwarding"));
    console.log(
      styleText(
        "dim",
        "If this wasn't intentional, make sure the following keys are set in .env:",
      ),
    );
    console.log(styleText("dim", "- PRODUCTION_URL"));
    console.log(styleText("dim", "- FORWARD_SECRET"));
    console.log(styleText("dim", "- FORWARD_TO"));
    console.log(styleText("dim", "- FORWARD_UIDS"));
    return;
  }

  const res = await fetch(new URL("/api/forward", productionUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      set: "on",
      forwardTo,
      forwardUids: forwardUids.split(","),
    }),
  });
  if (res.ok) {
    console.log(styleText("green", `Enabled forwarding to ${forwardTo}`));
  } else {
    let error = "unknown error";
    try {
      error = await res.text();
    } catch (e) {}
    console.error(styleText("red", `Failed to enable forwarding: ${error}`));
  }
}
async function setForwardingOff() {
  const secret = process.env.FORWARD_SECRET;
  const productionUrl = process.env.PRODUCTION_URL;
  const forwardTo = process.env.FORWARD_TO;
  const forwardUids = process.env.FORWARD_UIDS;

  if (!secret || !productionUrl || !forwardTo || !forwardUids) {
    return;
  }

  const res = await fetch(new URL("/api/forward", productionUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      set: "off",
      forwardTo,
      forwardUids: forwardUids.split(","),
    }),
  });
  if (res.ok) {
    console.log(styleText("cyan", `Disabled forwarding to ${forwardTo}`));
  } else {
    let error = "unknown error";
    try {
      error = await res.text();
    } catch (e) {}
    console.error(styleText("red", `Failed to disable forwarding: ${error}`));
  }
}

export const prodForwarding = () =>
  ({
    name: "prod-forwarding",
    async configureServer() {
      await setForwardingOn();
    },
    async configurePreviewServer() {
      await setForwardingOn();
    },
    async closeServer() {
      await setForwardingOff();
    },
    async closePreviewServer() {
      await setForwardingOff();
    },
  }) satisfies Plugin;
