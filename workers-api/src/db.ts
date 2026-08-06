import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { getEnv } from "./config";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    const { DATABASE_URL } = getEnv();
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    const sql = neon(DATABASE_URL);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

export type DB = ReturnType<typeof getDb>;
