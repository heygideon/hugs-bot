import z from "zod";

export const leaderboardSchema = z.object({
  type: z.enum(["hug", "boop", "pat"]).default("hug").catch("hug"),
  view: z.enum(["send", "receive", "return"]).default("send").catch("send"),
  user: z.string().optional().catch(undefined),
});
