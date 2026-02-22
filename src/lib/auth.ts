import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type postgres from "postgres";
import crypto from "crypto";

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

export async function createOrGetUser(email: string) {
  const sql = getDb();
  const normalized = normalizeEmail(email);

  let user = await sql`SELECT id, email, created_at FROM users WHERE email = ${normalized}`;
  if (user.length > 0) return user[0];

  await sql`INSERT INTO users(email) VALUES(${normalized})`;
  user = await sql`SELECT id, email, created_at FROM users WHERE email = ${normalized}`;
  return user[0];
}

export async function getUserByEmail(email: string) {
  const sql = getDb();
  const normalized = normalizeEmail(email);
  const user = await sql`SELECT id, email, username, password_hash, verified_at, created_at FROM users WHERE email = ${normalized}`;
  return user[0] || null;
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

export async function markUserVerified(email: string) {
  const sql = getDb();
  const normalized = normalizeEmail(email);
  await sql`UPDATE users SET verified_at = NOW() WHERE email = ${normalized}`;
}

export async function storeOtp(params: { email: string; code: string; ttlMinutes?: number }) {
  const sql = getDb();
  const normalized = normalizeEmail(params.email);
  const codeHash = hashOtp(params.code);
  const ttl = params.ttlMinutes ?? 10;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  await sql`INSERT INTO otp_codes(email, code_hash, expires_at) VALUES(${normalized}, ${codeHash}, ${expiresAt})`;
}

export async function verifyOtp(params: { email: string; code: string }) {
  const sql = getDb();
  const normalized = normalizeEmail(params.email);
  const codeHash = hashOtp(params.code);

  const rows = await sql`
    SELECT id, attempts, expires_at FROM otp_codes 
    WHERE email = ${normalized} AND code_hash = ${codeHash} AND used_at IS NULL 
    ORDER BY id DESC LIMIT 1
  `;

  if (rows.length === 0) {
    const latestRows = await sql`
      SELECT id, attempts, expires_at FROM otp_codes 
      WHERE email = ${normalized} AND used_at IS NULL 
      ORDER BY id DESC LIMIT 1
    `;
    if (latestRows.length > 0) {
      await sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${latestRows[0].id}`;
    }
    return { ok: false, error: "Invalid code" } as const;
  }

  const row = rows[0];
  const now = new Date();
  if (now > row.expires_at) return { ok: false, error: "Code expired" } as const;
  if ((row.attempts ?? 0) >= 8) return { ok: false, error: "Too many attempts" } as const;

  await sql`UPDATE otp_codes SET used_at = NOW() WHERE id = ${row.id}`;
  return { ok: true } as const;
}

export async function createSession(email: string) {
  const sql = getDb();
  const user = await createOrGetUser(email);

  const token = randomToken(32);
  const tokenHash = sha256Hex(token);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO sessions(user_id, token_hash, expires_at) VALUES(${user.id}, ${tokenHash}, ${expiresAt})`;

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

  const sql = getDb();
  const tokenHash = sha256Hex(token);
  const now = new Date();

  const rows = await sql`
    SELECT u.id, u.email FROM sessions s 
    JOIN users u ON u.id = s.user_id 
    WHERE s.token_hash = ${tokenHash} AND NOW() < s.expires_at 
    ORDER BY s.id DESC LIMIT 1
  `;

  return rows[0] || null;
}
