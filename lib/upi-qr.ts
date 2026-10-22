import QRCode from "qrcode";
import { Invoice, StudioSettings } from "./types/invoice";

export interface QrDecision {
  shouldShow: boolean;
  reason?: string;
  details: {
    settingsToggle: boolean;
    invoiceToggle: boolean;
    upiId: string;
    currency: string;
    balanceDue: number;
    status: string;
    qrMode: "auto" | "custom";
    rawQrMode: string;
    customQrUrl: string;
  };
}

/**
 * Evaluates whether the payment QR code should be rendered,
 * and provides structured reasons and details for debug & hints.
 *
 * Rules:
 * - Treats null/undefined toggle as true (ON).
 * - Treats null/undefined/empty qrMode as "auto".
 * - Treats "upload" as "custom".
 * - If "custom" mode has no uploaded image, gracefully falls back to "auto" UPI QR if INR.
 * - Hides if balanceDue <= 0 or status is Paid/Cancelled.
 * - Auto UPI QR is INR-only and requires a valid UPI ID.
 */
export function getQrDecision(
  invoice: Partial<Invoice>,
  settings?: StudioSettings | null
): QrDecision {
  // Treat null/undefined as true (ON)
  const settingsToggle = settings?.showPaymentQr !== false;
  const invoiceToggle = invoice?.showPaymentQr !== false;

  const upiId = settings?.upiId?.trim() || "";
  const currency = invoice?.currency || "INR";
  const balanceDue = Number(invoice?.balanceDue) || 0;
  const status = invoice?.status || "Draft";
  const rawQrMode = String(settings?.qrMode || "custom").trim().toLowerCase();
  const customQrUrl = (settings?.customQrUrl || "/payment-qr.jpg").trim();

  // Treat 'upload' or 'custom' as custom mode; if customQrUrl exists, prefer custom mode
  const isCustomConfigured = rawQrMode === "custom" || rawQrMode === "upload" || Boolean(customQrUrl);
  const qrMode: "auto" | "custom" = isCustomConfigured ? "custom" : "auto";

  const details = {
    settingsToggle,
    invoiceToggle,
    upiId,
    currency,
    balanceDue,
    status,
    qrMode,
    rawQrMode,
    customQrUrl,
  };

  if (!settings) {
    return { shouldShow: false, reason: "Studio settings not loaded yet", details };
  }

  if (!settingsToggle) {
    return { shouldShow: false, reason: "Payment QR is turned off in Studio Settings", details };
  }

  if (!invoiceToggle) {
    return { shouldShow: false, reason: "Payment QR is turned off for this invoice", details };
  }

  if (balanceDue <= 0) {
    return { shouldShow: false, reason: "Balance Due is 0 (no payment needed)", details };
  }

  if (status === "Paid" || status === "Cancelled") {
    return { shouldShow: false, reason: `Invoice is marked as ${status}`, details };
  }

  // Custom QR mode
  if (qrMode === "custom") {
    if (customQrUrl) {
      return { shouldShow: true, details };
    }
    // If custom mode is selected but no image uploaded yet:
    // Graceful fallback to auto UPI QR if INR and UPI ID exists
    if (currency === "INR" && upiId) {
      return { shouldShow: true, details };
    }
    return {
      shouldShow: false,
      reason: "Custom QR mode selected but no QR image uploaded",
      details,
    };
  }

  // Auto UPI QR mode
  if (currency !== "INR") {
    if (customQrUrl) {
      return { shouldShow: true, details };
    }
    return {
      shouldShow: false,
      reason: `Auto UPI QR only supports INR (current: ${currency})`,
      details,
    };
  }

  if (!upiId) {
    return {
      shouldShow: false,
      reason: "No UPI ID configured in Studio Settings",
      details,
    };
  }

  return { shouldShow: true, details };
}

/**
 * Determines whether the payment QR should be rendered.
 */
export function shouldShowQr(
  invoice: Partial<Invoice>,
  settings?: StudioSettings | null
): boolean {
  return getQrDecision(invoice, settings).shouldShow;
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
  const decision = getQrDecision(invoice, settings);
  if (!decision.shouldShow) {
    return null;
  }

  const { details } = decision;

  // Custom QR image branch (explicit custom with image, or non-INR with custom image)
  const shouldUseCustomImage =
    (details.qrMode === "custom" && Boolean(details.customQrUrl)) ||
    (details.currency !== "INR" && Boolean(details.customQrUrl));

  if (shouldUseCustomImage) {
    if (typeof window === "undefined" && details.customQrUrl.startsWith("/")) {
      try {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(process.cwd(), "public", details.customQrUrl.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          const mime = details.customQrUrl.endsWith(".png") ? "image/png" : "image/jpeg";
          return `data:${mime};base64,${buf.toString("base64")}`;
        }
      } catch (err) {
        console.warn("Could not read local custom QR image file:", err);
      }
    }
    return details.customQrUrl;
  }

  // Auto UPI QR branch
  const upiUrl = buildUpiPaymentUrl(invoice, settings);
  if (!upiUrl) {
    console.warn("generateInvoiceQrDataUrl: Could not build UPI payment URL", {
      upiId: settings.upiId,
      balanceDue: invoice.balanceDue,
    });
    return null;
  }

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
    console.error("Failed to generate UPI QR code with qrcode library:", err);
    throw err;
  }
}
