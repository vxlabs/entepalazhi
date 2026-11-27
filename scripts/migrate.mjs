// Applies db/migrations/*.sql in filename order, once each.
//   node scripts/migrate.mjs          apply pending migrations
//   node scripts/migrate.mjs --seed   also load db/seed.sql (sample data, dev only)
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getDatabasePath, loadEnv, openDb } from "./lib.mjs";

loadEnv();
const file = getDatabasePath();
const db = openDb(file);

db.exec(`
  create table if not exists schema_migrations (
    name        text not null primary key,
    applied_at  text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`);

const applied = new Set(db.prepare("select name from schema_migrations").all().map((r) => r.name));

const dir = path.join(process.cwd(), "db", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const record = db.prepare("insert into schema_migrations (name) values (?)");

let ran = 0;
for (const name of files) {
  if (applied.has(name)) continue;
  try {
    db.transaction(() => {
      db.exec(readFileSync(path.join(dir, name), "utf8"));
      record.run(name);
    })();
    console.log(`applied ${name}`);
    ran += 1;
  } catch (error) {
    console.error(`FAILED ${name}: ${error.message}`);
    db.close();
    process.exit(1);
  }
}

console.log(ran === 0 ? `${file}: already up to date.` : `${file}: ${ran} migration(s) applied.`);

if (process.argv.includes("--seed")) {
  const { n } = db.prepare("select count(*) as n from projects").get();
  if (n > 0) {
    console.log("Seed skipped: the projects table already has rows.");
  } else {
    db.transaction(() => db.exec(readFileSync(path.join(process.cwd(), "db", "seed.sql"), "utf8")))();
    console.log("Sample data loaded.");
  }
}

db.close();
