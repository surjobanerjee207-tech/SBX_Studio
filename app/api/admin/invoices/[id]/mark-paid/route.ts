import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { markInvoicePaid } from "@/lib/invoice-storage";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const paid = await markInvoicePaid(params.id);
    return NextResponse.json({ ok: true, invoice: paid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark invoice as paid" }, { status: 400 });
  }
}
