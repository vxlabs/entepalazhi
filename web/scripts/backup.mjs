// Writes a consistent copy of the database while the site keeps running.
//   node scripts/backup.mjs              -> <database folder>/backups/entepalazhi-<UTC timestamp>.db
//   node scripts/backup.mjs out/file.db  -> that path
// Copying the .db file directly is not safe while the site is running
// (recent writes can still be in the -wal file); this uses SQLite's backup API.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { getDatabasePath, loadEnv, openDb } from "./lib.mjs";

loadEnv();
const source = getDatabasePath();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.resolve(process.argv[2] ?? path.join(path.dirname(source), "backups", `entepalazhi-${stamp}.db`));
mkdirSync(path.dirname(target), { recursive: true });

const db = openDb(source);
await db.backup(target);
db.close();
console.log(`Backup written: ${target}`);
