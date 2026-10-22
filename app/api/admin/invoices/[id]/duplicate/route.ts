import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { duplicateInvoice } from "@/lib/invoice-storage";

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

    const duplicated = await duplicateInvoice(params.id);
    return NextResponse.json({ ok: true, data: duplicated, invoice: duplicated });
  } catch (err: any) {
    console.error(`duplicate error for ${params.id}:`, err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to duplicate invoice." },
      { status: 400 }
    );
  }
}
