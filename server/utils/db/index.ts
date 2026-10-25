import { drizzle } from "drizzle-orm/libsql";
import { requiredEnv } from "../env";

export const db = drizzle(requiredEnv("DATABASE_URL"));
