// Drizzle client factory. Call getDb() inside request handlers — never at
// module top level — so `next build` works without DATABASE_URL set.
// postgres-js connects lazily anyway; the client is only created on the
// first query. Cached on globalThis for Next.js dev hot-reloads.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const globalForDb = globalThis;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!globalForDb.__mmscheduler_db) globalForDb.__mmscheduler_db = createDb();
  return globalForDb.__mmscheduler_db;
}
