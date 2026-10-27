import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { forwardingConfig } from "~/db/schema";
import { handleSlackEvent } from "~/slack";
import { isValidSlackRequest } from "@slack/bolt";
import { requiredEnv } from "~/lib/env";

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
        return payload.user.id;
      }
    } catch (e) {}
  }

  return null;
}

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const uid = await getUidFromSlackRequest(request);

        // * if forwarding is set up, try to forward request
        //   to a dev/testing environment
        // * if errors, should fallback gracefully to prod
        // * timeout of 1000ms is probably enough!
        const [forward] = await db
          .select()
          .from(forwardingConfig)
          .where(eq(forwardingConfig.id, 1));
        if (forward && forward.forwardUids.split(",").includes(uid)) {
          const newRequest = new Request(forward.forwardTo, {
            headers: new Headers(request.headers),
            method: request.method,
            redirect: request.redirect,
            body: await request.clone().text(),
          });
          try {
            const res = await fetch(newRequest, {
              signal: AbortSignal.timeout(1000),
            });
            if (res.ok) return res;
          } catch (e) {}
        }

        // otherwise, continue as normal
        return handleSlackEvent(request);
      },
    },
  },
});
