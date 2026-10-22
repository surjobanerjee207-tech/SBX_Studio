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
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const invoice = await getInvoiceById(params.id);
    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: invoice, invoice });
  } catch (err: any) {
    console.error(`GET /api/admin/invoices/${params.id} error:`, err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch invoice." },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parsed = InvoiceSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Invalid invoice data.";
      return NextResponse.json(
        { ok: false, error: errorMessage, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await updateInvoice(params.id, parsed.data);
    return NextResponse.json({ ok: true, data: updated, invoice: updated });
  } catch (err: any) {
    console.error(`PUT /api/admin/invoices/${params.id} error:`, err);
    const isConflict =
      err.message?.includes("already exists") ||
      err.message?.includes("already in use") ||
      err.code === "P2002";
    const isNotFound = err.message?.includes("not found");
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Could not save the invoice. Please try again.",
      },
      { status: isNotFound ? 404 : isConflict ? 409 : 500 }
    );
  }
}

export async function DELETE(
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

    await deleteInvoice(params.id);
    return NextResponse.json({ ok: true, data: { id: params.id } });
  } catch (err: any) {
    console.error(`DELETE /api/admin/invoices/${params.id} error:`, err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete invoice." },
      { status: 500 }
    );
  }
}
