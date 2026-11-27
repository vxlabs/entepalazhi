// Re-encodes approved photos that were stored before uploads were converted
// to WebP (lib/uploads.ts). Run once after deploying that change; safe to
// run again, it only touches photos that are not .webp yet.
//   node scripts/convert-photos-to-webp.mjs            convert
//   node scripts/convert-photos-to-webp.mjs --dry-run  only list what would change
// Take a backup first (scripts/backup.mjs, plus a copy of the uploads
// folder): the original files are deleted once converted.
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { loadEnv, openDb } from "./lib.mjs";

// Keep in step with lib/uploads.ts.
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 80;

// The only shape lib/uploads.ts ever stored: <project id>/<uuid>.<ext>
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const OLD_PATH = new RegExp(`^${UUID}/${UUID}\\.(?:jpg|png)$`);

loadEnv();
const dryRun = process.argv.includes("--dry-run");
const publicRoot = path.join(path.resolve(process.env.UPLOAD_DIR ?? "./uploads"), "public");
const db = openDb();

const rows = db.prepare("select id, storage_path from project_media where storage_path not like '%.webp'").all();
const update = db.prepare("update project_media set storage_path = ? where id = ?");
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

let converted = 0;
let skipped = 0;
let before = 0;
let after = 0;

for (const row of rows) {
  if (!OLD_PATH.test(row.storage_path)) {
    console.warn(`Skipped (unexpected path): ${row.storage_path}`);
    skipped++;
    continue;
  }

  const oldFile = path.join(publicRoot, row.storage_path);
  const newPath = row.storage_path.replace(/\.(?:jpg|png)$/, ".webp");

  let webp;
  let originalSize;
  try {
    const original = await readFile(oldFile);
    originalSize = original.length;
    webp = await sharp(original)
      .autoOrient()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    console.warn(`Skipped (${error.code === "ENOENT" ? "file missing" : "not a readable image"}): ${row.storage_path}`);
    skipped++;
    continue;
  }

  if (!dryRun) {
    // New file first, then the row, then the old file: if this stops
    // half-way, no row ever points at a file that is not there.
    await writeFile(path.join(publicRoot, newPath), webp);
    update.run(newPath, row.id);
    await rm(oldFile, { force: true });
  }

  console.log(`${row.storage_path}  ${kb(originalSize)} -> ${kb(webp.length)}`);
  converted++;
  before += originalSize;
  after += webp.length;
}

db.close();
const verb = dryRun ? "Would convert" : "Converted";
console.log(`${verb} ${converted} photo(s): ${kb(before)} -> ${kb(after)}. Skipped ${skipped}.`);
