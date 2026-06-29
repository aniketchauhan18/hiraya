// Run: node scripts/ingest-kb.mjs [filename.txt] [--dry-run]
//   filename   Optional .txt file in data/ to ingest (default: nith-knowledge-base.txt)
//   --dry-run  Print sections without posting

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

config({ path: resolve(ROOT, ".env.local") });
config({ path: resolve(ROOT, ".env") });

const fileArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const KB_FILE = resolve(ROOT, "data", fileArg ?? "nith-knowledge-base.txt");
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SECRET = process.env.EMBEDDINGS_API_SECRET;
const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 1200;

if (!SECRET && !DRY_RUN) {
  console.error("Error: EMBEDDINGS_API_SECRET is not set in .env.local");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function splitSections(text) {
  const parts = text.split(/^=== .+ ===$/m);
  const headers = [...text.matchAll(/^=== (.+) ===$/gm)].map((m) => m[1]);

  const sections = [];

  const preamble = parts[0].trim();
  if (preamble.length > 50) {
    sections.push({ title: "PREAMBLE", body: preamble });
  }

  for (let i = 0; i < headers.length; i++) {
    const body = (parts[i + 1] || "").trim();
    if (body.length > 30) {
      sections.push({ title: headers[i], body });
    }
  }

  return sections;
}

async function postSection(title, body) {
  const embeddingText = `[${title}]\n\n${body}`;
  const res = await fetch(`${BASE_URL}/api/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify({ embeddingText }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  return res.json();
}

async function main() {
  console.log(`Ingesting: ${KB_FILE}`);
  if (DRY_RUN) console.log("DRY RUN — sections will be printed, not posted.\n");

  let text;
  try {
    text = readFileSync(KB_FILE, "utf-8");
  } catch {
    console.error(`Error: Could not read ${KB_FILE}`);
    console.error("Run 'node scripts/build-kb.mjs' or 'node scripts/build-clubs-kb.mjs' first.");
    process.exit(1);
  }

  const sections = splitSections(text);
  console.log(`Found ${sections.length} sections\n`);

  if (DRY_RUN) {
    for (const { title, body } of sections) {
      console.log(`--- [${title}] (${body.length} chars) ---`);
      console.log(body.slice(0, 200) + (body.length > 200 ? "..." : ""));
      console.log();
    }
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < sections.length; i++) {
    const { title, body } = sections[i];
    process.stdout.write(`  [${i + 1}/${sections.length}] ${title.padEnd(45)} `);

    try {
      const result = await postSection(title, body);
      const chunks = result.chunksInserted ?? "?";
      console.log(`✓  (${chunks} chunk${chunks !== 1 ? "s" : ""} inserted)`);
      success++;
    } catch (e) {
      console.log(`✗  ERROR: ${e.message}`);
      failed++;
    }

    if (i < sections.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone. Inserted: ${success}  Failed: ${failed}`);
  if (failed > 0) {
    console.log("Re-run the script to retry failed sections.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
