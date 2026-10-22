export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  createInvoice,
  getInvoices,
  getNextInvoiceNumber,
} from "@/lib/invoice-storage";
import { InvoiceSchema } from "@/lib/types/invoice";

export async function GET(req: Request) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || undefined;

    const invoices = await getInvoices({ query, status, sort });
    const nextNumber = await getNextInvoiceNumber();

    return NextResponse.json({
      ok: true,
      data: { invoices, nextNumber },
      invoices,
      nextNumber,
    });
  } catch (err: any) {
    console.error("GET /api/admin/invoices error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch invoices." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const invoice = await createInvoice(parsed.data);
    return NextResponse.json({ ok: true, data: invoice, invoice });
  } catch (err: any) {
    console.error("POST /api/admin/invoices error:", err);
    const isConflict =
      err.message?.includes("already exists") ||
      err.message?.includes("already in use") ||
      err.code === "P2002";
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Could not save the invoice. Please try again.",
      },
      { status: isConflict ? 409 : 500 }
    );
  }
}
