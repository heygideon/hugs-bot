import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import z from "zod";
import { db } from "~/db";
import { forwardingConfig } from "~/db/schema";

const forwardSchema = z.object({
  secret: z.string(),
  set: z.enum(["on", "off"]),
  forwardTo: z.union([z.httpUrl(), z.url({ hostname: /^localhost$/ })]),
  forwardUids: z.array(z.string().trim()).min(1),
  ts: z.number().int().positive(),
});
async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return hash;
}

export const Route = createFileRoute("/api/forward")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { success, data } = forwardSchema.safeParse(await request.json());
        if (!success) {
          return new Response("Bad request", { status: 400 });
        }

        const { secret, set, forwardTo, forwardUids, ts } = data;
        const secretHash = await sha256(secret);
        const storedHash = await sha256(process.env.FORWARD_SECRET || "");
        if (
          !timingSafeEqual(Buffer.from(secretHash), Buffer.from(storedHash)) ||
          !process.env.FORWARD_SECRET
        ) {
          console.log(
            "Request made to enable/disable forwarding, but secret did not match",
          );
          return new Response("Unauthorised", { status: 401 });
        }

        if (set === "on") {
          await db
            .insert(forwardingConfig)
            .values({ id: 1, forwardTo, forwardUids, ts })
            .onConflictDoUpdate({
              target: [forwardingConfig.id],
              set: { forwardTo, forwardUids, ts },
            });
        } else {
          // * when vite restarts, it sometimes sends "off" after "on"
          // * so only delete the entry if it matches url and ts
          await db
            .delete(forwardingConfig)
            .where(
              and(
                eq(forwardingConfig.forwardTo, forwardTo),
                eq(forwardingConfig.ts, ts),
              ),
            );
        }

        return new Response("Success", { status: 200 });
      },
    },
  },
});
