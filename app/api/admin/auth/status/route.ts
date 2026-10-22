import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const authenticated = isAuthenticatedRequest(req);
  return NextResponse.json({ authenticated });
}
