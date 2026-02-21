import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const SESSION_COOKIE = "scout_session";

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtpCode() {
  const n = crypto.randomInt(0, 1000000);
  return n.toString().padStart(6, "0");
}

export function hashOtp(code: string) {
  return sha256Hex(code);
}

export function createOrGetUser(email: string) {
  const d = getDb();
  const normalized = normalizeEmail(email);

  const existing = d.prepare("select id, email, created_at from users where email = ?").get(normalized) as any;
  if (existing) return existing;

  const info = d.prepare("insert into users(email) values(?)").run(normalized);
  return d
    .prepare("select id, email, created_at from users where id = ?")
    .get(Number(info.lastInsertRowid)) as any;
}

export function getUserByEmail(email: string) {
  const d = getDb();
  const normalized = normalizeEmail(email);
  return d
    .prepare("select id, email, username, password_hash, verified_at, created_at from users where email = ?")
    .get(normalized) as any;
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(password, salt, 32);
  return `s2:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [tag, saltHex, keyHex] = parts;
  if (tag !== "s2") return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

export function markUserVerified(email: string) {
  const d = getDb();
  const normalized = normalizeEmail(email);
  d.prepare("update users set verified_at = datetime('now') where email = ?").run(normalized);
}

export function storeOtp(params: { email: string; code: string; ttlMinutes?: number }) {
  const d = getDb();
  const normalized = normalizeEmail(params.email);
  const codeHash = hashOtp(params.code);
  const ttl = params.ttlMinutes ?? 10;

  d.prepare(
    "insert into otp_codes(email, code_hash, expires_at) values(?, ?, datetime('now', ?))"
  ).run(normalized, codeHash, `+${ttl} minutes`);
}

export function verifyOtp(params: { email: string; code: string }) {
  const d = getDb();
  const normalized = normalizeEmail(params.email);
  const codeHash = hashOtp(params.code);

  const row = d
    .prepare(
      "select id, attempts, expires_at from otp_codes where email = ? and code_hash = ? and used_at is null order by id desc limit 1"
    )
    .get(normalized, codeHash) as any;

  if (!row) {
    const latest = d
      .prepare(
        "select id, attempts, expires_at from otp_codes where email = ? and used_at is null order by id desc limit 1"
      )
      .get(normalized) as any;
    if (latest?.id) d.prepare("update otp_codes set attempts = attempts + 1 where id = ?").run(latest.id);
    return { ok: false, error: "Invalid code" } as const;
  }

  const expired = d.prepare("select datetime('now') > ? as expired").get(row.expires_at) as any;
  if (expired?.expired) return { ok: false, error: "Code expired" } as const;

  if ((row.attempts ?? 0) >= 8) return { ok: false, error: "Too many attempts" } as const;

  d.prepare("update otp_codes set used_at = datetime('now') where id = ?").run(row.id);
  return { ok: true } as const;
}

export async function createSession(email: string) {
  const d = getDb();
  const user = createOrGetUser(email);

  const token = randomToken(32);
  const tokenHash = sha256Hex(token);

  d.prepare(
    "insert into sessions(user_id, token_hash, expires_at) values(?, ?, datetime('now', '+30 days'))"
  ).run(user.id, tokenHash);

  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return user;
}

export async function clearSession() {
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const d = getDb();
  const tokenHash = sha256Hex(token);

  const row = d
    .prepare(
      "select u.id, u.email from sessions s join users u on u.id = s.user_id where s.token_hash = ? and datetime('now') < s.expires_at order by s.id desc limit 1"
    )
    .get(tokenHash) as any;

  return row ?? null;
}
