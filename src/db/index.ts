import { drizzle } from "drizzle-orm/neon-serverless";
import { requiredEnv } from "~/lib/env";

export const db = drizzle(requiredEnv("DATABASE_URL"));
