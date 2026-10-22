import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { duplicateInvoice } from "@/lib/invoice-storage";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const duplicated = await duplicateInvoice(params.id);
    return NextResponse.json({ ok: true, invoice: duplicated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to duplicate invoice" }, { status: 400 });
  }
}
