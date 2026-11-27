// Shared by the command-line scripts in this folder. Plain Node (no build
// step) so the same files run on a laptop and inside the production image.
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/** Loads .env.local / .env when present; real environment variables win. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

export function getDatabasePath() {
  const value = process.env.DATABASE_PATH;
  if (!value) {
    console.error("DATABASE_PATH is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  return path.resolve(value);
}

/** Opens (creating if needed) the SQLite file, with the same settings as
 * lib/db.ts. */
export function openDb(file = getDatabasePath()) {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  return db;
}
