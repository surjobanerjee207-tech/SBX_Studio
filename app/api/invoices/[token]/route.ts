import { NextResponse } from "next/server";
import {
  getInvoiceByPublicToken,
  getStudioSettings,
} from "@/lib/invoice-storage";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const invoice = await getInvoiceByPublicToken(params.token);
  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found or link has expired/been disabled" },
      { status: 404 }
    );
  }

  const settings = await getStudioSettings();
  const safeSettings = {
    studioName: settings.studioName,
    logoUrl: settings.logoUrl,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    country: settings.country,
    upiId: settings.upiId,
    bankName: settings.bankName,
    bankAccountName: settings.bankAccountName,
    bankAccountNumber: settings.bankAccountNumber,
    bankIfsc: settings.bankIfsc,
    bankSwift: settings.bankSwift,
    footerMessage: settings.footerMessage,
  };

  return NextResponse.json({
    invoice,
    studio: safeSettings,
  });
}
