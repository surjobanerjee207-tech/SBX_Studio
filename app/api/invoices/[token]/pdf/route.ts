import { NextResponse } from "next/server";
import {
  getInvoiceByPublicToken,
  getStudioSettings,
} from "@/lib/invoice-storage";
import {
  generateInvoicePdfBuffer,
  getInvoicePdfFilename,
} from "@/lib/pdf/invoice-pdf";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const invoice = await getInvoiceByPublicToken(params.token);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found or link has expired" }, { status: 404 });
  }

  const settings = await getStudioSettings();
  const buffer = await generateInvoicePdfBuffer(invoice, settings);
  const filename = getInvoicePdfFilename(invoice);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Content-Length", buffer.length.toString());

  return new NextResponse(buffer, { status: 200, headers });
}
