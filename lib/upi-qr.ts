import QRCode from "qrcode";
import { Invoice, StudioSettings } from "./types/invoice";

/**
 * Determines whether the payment QR should be rendered.
 * Hides if disabled, if balanceDue <= 0, or if invoice is Paid/Cancelled.
 * For non-INR invoices, hides auto QR (shows custom QR if uploaded).
 */
export function shouldShowQr(
  invoice: Partial<Invoice>,
  settings?: StudioSettings | null
): boolean {
  if (!settings) return false;

  // Invoice-level or settings-level toggle
  const enabled = invoice.showPaymentQr ?? settings.showPaymentQr ?? true;
  if (!enabled) return false;

  // Do not show if balance due is 0 or invoice is Paid or Cancelled
  const balanceDue = Number(invoice.balanceDue) || 0;
  if (balanceDue <= 0) return false;
  if (invoice.status === "Paid" || invoice.status === "Cancelled") return false;

  // If custom QR mode with an uploaded image
  if (settings.qrMode === "custom" && settings.customQrUrl) {
    return true;
  }

  // Auto UPI QR requires INR currency
  if (invoice.currency && invoice.currency !== "INR") {
    // For foreign currencies, only show if a custom QR is uploaded
    return Boolean(settings.customQrUrl);
  }

  // Auto mode requires a valid UPI ID
  return Boolean(settings.upiId && settings.upiId.trim());
}

/**
 * Builds standard UPI intent link with encoded parameters.
 * format: upi://pay?pa=<UPI_ID>&pn=<StudioName>&am=<BalanceDue>&cu=INR&tn=<InvoiceNumber>
 */
export function buildUpiPaymentUrl(
  invoice: Partial<Invoice>,
  settings: StudioSettings
): string | null {
  if (!settings.upiId || !settings.upiId.trim()) return null;

  const pa = encodeURIComponent(settings.upiId.trim());
  const pn = encodeURIComponent(settings.studioName || "SBX Studio");
  const balanceDue = Number(invoice.balanceDue) || 0;
  const am = balanceDue.toFixed(2);
  const cu = "INR";
  const tn = encodeURIComponent(invoice.number || "Invoice Payment");

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
}

/**
 * Generates high-resolution PNG data URI for the invoice QR.
 */
export async function generateInvoiceQrDataUrl(
  invoice: Partial<Invoice>,
  settings: StudioSettings
): Promise<string | null> {
  if (!shouldShowQr(invoice, settings)) {
    return null;
  }

  // If custom QR mode or non-INR with custom QR
  if (
    (settings.qrMode === "custom" && settings.customQrUrl) ||
    (invoice.currency !== "INR" && settings.customQrUrl)
  ) {
    return settings.customQrUrl;
  }

  // Auto-generate dynamic UPI payment QR
  const upiUrl = buildUpiPaymentUrl(invoice, settings);
  if (!upiUrl) return null;

  try {
    const dataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: "M",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate UPI QR code:", err);
    return null;
  }
}
