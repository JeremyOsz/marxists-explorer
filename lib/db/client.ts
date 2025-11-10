import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __dbPool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __db__: NodePgDatabase<typeof schema> | undefined;
}

const pool = globalThis.__dbPool__ ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dbPool__ = pool;
}

export const db: NodePgDatabase<typeof schema> =
  globalThis.__db__ ??
  drizzle(pool, {
    schema,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__db__ = db;
}

export type Database = typeof db;

