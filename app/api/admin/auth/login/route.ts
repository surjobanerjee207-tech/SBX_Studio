import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkLoginRateLimit,
  createSessionToken,
  getClientIp,
  recordLoginFailure,
  resetLoginRateLimit,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { verifyAdminPassword } from "@/lib/invoice-storage";

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Check rate limit
  const rateLimit = checkLoginRateLimit(ip);
  if (rateLimit.limited) {
    return NextResponse.json(
      {
        error: `Too many failed login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        retryAfter: rateLimit.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  // 2. Parse & validate body
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  // 3. Verify password
  const isValid = await verifyAdminPassword(parsed.data.password);
  if (!isValid) {
    recordLoginFailure(ip);
    return NextResponse.json(
      { error: "Incorrect admin password" },
      { status: 401 }
    );
  }

  // 4. Success: reset rate limit & set session cookie
  resetLoginRateLimit(ip);
  const token = createSessionToken();

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
