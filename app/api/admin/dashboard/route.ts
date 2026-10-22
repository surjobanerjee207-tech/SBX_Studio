import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { getDashboardStats } from "@/lib/invoice-storage";

export async function GET(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getDashboardStats();
  return NextResponse.json({ stats });
}
