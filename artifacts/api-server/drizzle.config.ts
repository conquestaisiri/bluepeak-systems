import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
  out: "./drizzle",
  schema: path.join(process.cwd(), "../../lib/db/src/schema/index.ts").replace(/\\/g, "/"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});