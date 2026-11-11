import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "author_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getAdminPassword(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "changeme";
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminPassword();
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function createSessionToken(secret: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

function verifySessionToken(token: string | undefined, secret: string) {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload, secret))) return false;
  const [role, expRaw] = payload.split(".");
  const exp = Number(expRaw);
  return role === "admin" && Number.isFinite(exp) && exp > Date.now() / 1000;
}

export async function isAdminAuthenticated() {
  const secret = getSessionSecret();
  if (!secret) return false;
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value, secret);
}

/** Gọi ở đầu mọi Server Action / trang admin: Server Action là endpoint POST public. */
export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

/** Làm chậm dò mật khẩu; serverless không giữ bộ đếm theo IP nên dùng độ trễ cố định. */
const FAILED_LOGIN_DELAY_MS = 1500;

export async function loginAdmin(password: string) {
  const expected = getAdminPassword();
  const secret = getSessionSecret();
  if (!expected || !secret || !safeEqual(sign(password, secret), sign(expected, secret))) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
