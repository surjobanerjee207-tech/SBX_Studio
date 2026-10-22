import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "sbx_admin_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Server session secret: uses ADMIN_SESSION_SECRET or a stable generated fallback for this environment
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.RESEND_API_KEY ||
  "sbx-studio-super-secure-invoicing-secret-2026-key";

// In-memory rate limiting map: ip -> { count: number, firstAttempt: number, blockedUntil?: number }
interface RateLimitRecord {
  attempts: number[];
  blockedUntil?: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks if an IP is rate limited for admin login.
 */
export function checkLoginRateLimit(ip: string): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { limited: false };

  // Check if actively blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { limited: true, retryAfterSeconds: retryAfter };
  }

  // Filter attempts in window
  record.attempts = record.attempts.filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
  if (record.attempts.length >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { limited: true, retryAfterSeconds: retryAfter };
  }

  return { limited: false };
}

/**
 * Record a failed login attempt.
 */
export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: [] };
  record.attempts.push(now);
  if (record.attempts.length >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
  loginAttempts.set(ip, record);
}

/**
 * Reset rate limit counter on successful login.
 */
export function resetLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Hash a password using PBKDF2 with SHA-512 and 100,000 iterations.
 */
export function hashPassword(
  password: string,
  providedSalt?: string
): { hash: string; salt: string } {
  const salt = providedSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

/**
 * Constant-time password verification.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Signs a session payload with HMAC-SHA256.
 */
export function createSessionToken(): string {
  const payload = {
    sub: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a session token.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return false; // Expired
    }
    return payload.sub === "admin";
  } catch {
    return false;
  }
}

/**
 * Returns whether the incoming API request is from an authenticated admin.
 */
export function isAuthenticatedRequest(req: NextRequest | Request): boolean {
  // Check cookie in NextRequest or standard Request
  let token: string | undefined;
  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    token = (req as any).cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    token = match ? match[1] : undefined;
  }

  return verifySessionToken(token);
}

/**
 * Server Component / Server Action cookie checker.
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Helper to get client IP from request.
 */
export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
