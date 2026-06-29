import pg from "pg";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

config({ path: resolve(ROOT, ".env.local") });
config({ path: resolve(ROOT, ".env") });

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

const { rows } = await client.query('SELECT COUNT(*) FROM "TextData"');
const before = parseInt(rows[0].count, 10);

await client.query('TRUNCATE "TextData" RESTART IDENTITY');

console.log(`Cleared ${before} rows from TextData. Table is now empty.`);

await client.end();
