// Applies pending drizzle migrations. Run with DATABASE_URL set, from the
// repo root (or anywhere — the migrations folder resolves relative to this
// file, not the cwd):
//   npm run db:migrate
// The web container runs this on startup before `next start`.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');
const client = postgres(url, { max: 1 });
await migrate(drizzle(client), { migrationsFolder });
console.log('migrations applied');
await client.end();
