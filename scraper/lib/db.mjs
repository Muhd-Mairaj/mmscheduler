// Drizzle client for the scraper (plain Node, no Next.js).
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../db/schema.js';

export function openDb(url) {
  if (!url) throw new Error('DATABASE_URL is not set (see .env)');
  const client = postgres(url, { max: 5 });
  return { db: drizzle(client, { schema }), close: () => client.end() };
}
