import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { forwardingConfig } from "~/db/schema";
import { handleSlackEvent } from "~/slack";
import { isValidSlackRequest } from "@slack/bolt";
import { env, requiredEnv } from "~/lib/env";

async function getUidFromSlackRequest(request: Request) {
  if (!request.body) return null;
  const body = await request.clone().text();

  if (
    !isValidSlackRequest({
      headers: {
        "x-slack-signature": request.headers.get("x-slack-signature") || "",
        "x-slack-request-timestamp": parseInt(
          request.headers.get("x-slack-request-timestamp") || "",
        ),
      },
      body,
      signingSecret: requiredEnv("SLACK_SIGNING_SECRET"),
    })
  ) {
    return null;
  }

  const formData = await request.clone().formData();

  // slash commands (easy)
  const userId = formData.get("user_id");
  if (userId && typeof userId === "string") {
    return userId;
  }

  // modals and actions (less easy)
  let _payload = formData.get("payload");
  if (_payload && typeof _payload === "string") {
    try {
      const payload = JSON.parse(_payload);
      if (payload && payload.user?.id && typeof payload.user.id === "string") {
        return payload.user.id as string;
      }
    } catch (e) {}
  }

  return null;
}
async function tryForwardRequest(request: Request) {
  // If no forward secret is set, it's a pretty good clue we can skip this
  if (!env("FORWARD_SECRET")) return;

  const [uid, [config]] = await Promise.all([
    getUidFromSlackRequest(request),
    db.select().from(forwardingConfig).where(eq(forwardingConfig.id, 1)),
  ]);
  if (!uid || !config) return null;
  if (!config.forwardUids.includes(uid)) return null;

  const newRequest = new Request(config.forwardTo, {
    headers: new Headers(request.headers),
    method: request.method,
    redirect: request.redirect,
    body: await request.clone().text(),
  });
  try {
    const res = await fetch(newRequest, {
      signal: AbortSignal.timeout(1000), // timeout of 1000ms is probably enough!
    });
    if (res.ok) return res;
  } catch (e) {
    console.warn("Error when forwarding request:", e);
  }

  return null;
}

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // if forwarding is set up, try to forward request
        // to a dev/testing environment
        const res = await tryForwardRequest(request);
        if (res) return res;

        // otherwise, continue as normal
        return handleSlackEvent(request);
      },
    },
  },
});
