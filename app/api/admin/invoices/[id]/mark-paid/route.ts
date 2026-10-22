import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { markInvoicePaid } from "@/lib/invoice-storage";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const paid = await markInvoicePaid(params.id);
    return NextResponse.json({ ok: true, data: paid, invoice: paid });
  } catch (err: any) {
    console.error(`mark-paid error for ${params.id}:`, err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to mark invoice as paid." },
      { status: 400 }
    );
  }
}
