import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  createInvoice,
  getInvoices,
  getNextInvoiceNumber,
} from "@/lib/invoice-storage";
import { InvoiceSchema } from "@/lib/types/invoice";

export async function GET(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || undefined;
  const status = searchParams.get("status") || undefined;
  const sort = searchParams.get("sort") || undefined;

  const invoices = await getInvoices({ query, status, sort });
  const nextNumber = await getNextInvoiceNumber();

  return NextResponse.json({ invoices, nextNumber });
}

export async function POST(req: Request) {
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

  const invoice = await createInvoice(parsed.data);
  return NextResponse.json({ ok: true, invoice });
}
