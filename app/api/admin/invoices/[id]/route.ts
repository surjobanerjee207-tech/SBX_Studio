import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  deleteInvoice,
  getInvoiceById,
  updateInvoice,
} from "@/lib/invoice-storage";
import { InvoiceSchema } from "@/lib/types/invoice";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await getInvoiceById(params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = InvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid invoice data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const updated = await updateInvoice(params.id, parsed.data);
    return NextResponse.json({ ok: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update invoice" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteInvoice(params.id);
  return NextResponse.json({ ok: true });
}
