import { defineConfig } from "drizzle-kit";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile("./.env");
} catch (e) {}

export default defineConfig({
  out: "./drizzle",
  schema: "./server/utils/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
