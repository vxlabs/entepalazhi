// Creates an admin account, or resets the password of an existing one.
//   node scripts/create-admin.mjs you@example.com
// The password is asked for on the terminal (or read from ADMIN_PASSWORD).
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { loadEnv, openDb } from "./lib.mjs";

loadEnv();

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node scripts/create-admin.mjs you@example.com");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question("Password (at least 10 characters): ");
  rl.close();
}
if (!password || password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

// Must match lib/password.ts.
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
const passwordHash = `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;

const db = openDb();
db.transaction(() => {
  db.prepare(
    `insert into admin_users (email, password_hash) values (@email, @hash)
     on conflict (email) do update set password_hash = excluded.password_hash`,
  ).run({ email, hash: passwordHash });
  db.prepare(
    "delete from admin_sessions where user_id = (select id from admin_users where email = @email)",
  ).run({ email });
})();
db.close();

console.log(`Admin ready: ${email}. Any existing sessions for this account were signed out.`);
