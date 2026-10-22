export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  getInvoiceById,
  getStudioSettings,
} from "@/lib/invoice-storage";
import {
  generateInvoicePdfBuffer,
  getInvoicePdfFilename,
} from "@/lib/pdf/invoice-pdf";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const invoice = await getInvoiceById(params.id);
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });
    }

    const settings = await getStudioSettings();
    const buffer = await generateInvoicePdfBuffer(invoice, settings);
    const filename = getInvoicePdfFilename(invoice);

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Length", buffer.length.toString());

    return new NextResponse(buffer, { status: 200, headers });
  } catch (err: any) {
    console.error(`Error generating PDF for invoice ${params?.id}:`, err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate invoice PDF. Please try again.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
