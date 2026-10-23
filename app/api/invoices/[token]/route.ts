export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getInvoiceByPublicToken,
  getStudioSettings,
} from "@/lib/invoice-storage";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invoice = await getInvoiceByPublicToken(params.token);
    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found or link has expired/been disabled" },
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
      showPaymentQr: settings.showPaymentQr,
      qrMode: settings.qrMode,
      customQrUrl: settings.customQrUrl,
      qrCaption: settings.qrCaption,
      showMainQr: settings.showMainQr,
      showBackupQr: settings.showBackupQr,
      backupQrUrl: settings.backupQrUrl,
      backupQrCaption: settings.backupQrCaption,
    };

    return NextResponse.json({
      ok: true,
      invoice,
      studio: safeSettings,
    });
  } catch (err: any) {
    console.error(`GET /api/invoices/${params.token} error:`, err);
    return NextResponse.json(
      { ok: false, error: "Failed to load invoice." },
      { status: 500 }
    );
  }
}
