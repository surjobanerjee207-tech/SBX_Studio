import QRCode from "qrcode";
import { Invoice, StudioSettings } from "./types/invoice";

export interface QrItemDecision {
  shouldShow: boolean;
  reason?: string;
  caption: string;
}

export interface DualQrDecision {
  masterEnabled: boolean;
  main: QrItemDecision & { upiUrl?: string };
  backup: QrItemDecision & { imageUrl?: string };
  shouldShowAny: boolean;
}

export interface QrDecision {
  shouldShow: boolean;
  reason?: string;
  main: QrItemDecision & { upiUrl?: string };
  backup: QrItemDecision & { imageUrl?: string };
  details: {
    settingsToggle: boolean;
    invoiceToggle: boolean;
    showMain: boolean;
    showBackup: boolean;
    upiId: string;
    currency: string;
    balanceDue: number;
    status: string;
    backupQrUrl: string;
    mainCaption: string;
    backupCaption: string;
  };
}

/**
 * Builds standard UPI intent link with encoded parameters.
 * format: upi://pay?pa=<UPI_ID>&pn=<StudioName>&am=<BalanceDue>&cu=INR&tn=<InvoiceNumber>
 * Amount has 2 decimals and no commas or currency symbol.
 */
export function buildUpiPaymentUrl(
  invoice: Partial<Invoice>,
  settings: StudioSettings
): string | null {
  if (!settings.upiId || !settings.upiId.trim()) return null;

  const pa = encodeURIComponent(settings.upiId.trim());
  const pn = encodeURIComponent(settings.studioName || "SBX Studio");
  const balanceDue = Math.max(0, Number(invoice.balanceDue) || 0);
  const am = balanceDue.toFixed(2);
  const cu = "INR";
  const tn = encodeURIComponent(invoice.number || "Invoice Payment");

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
}

/**
 * Formats the balance due caption: "Scan to pay Rs. <Balance Due>"
 */
export function formatMainQrCaption(balanceDue: number): string {
  const safe = Math.max(0, Number(balanceDue) || 0);
  const display = Number.isInteger(safe) ? safe.toLocaleString("en-IN") : safe.toFixed(2);
  return `Scan to pay Rs. ${display}`;
}

/**
 * Evaluates dual payment QR decisions (Main UPI QR and Backup QR)
 * according to master and per-invoice settings, currency, balance due, and status rules.
 */
export function getQrDecision(
  invoice: Partial<Invoice>,
  settings?: StudioSettings | null
): QrDecision {
  // Master toggles: null/undefined treated as true (ON)
  const masterSettingsToggle = settings?.showPaymentQr !== false;
  const masterInvoiceToggle = invoice?.showPaymentQr !== false;
  const masterEnabled = masterSettingsToggle && masterInvoiceToggle;

  const upiId = settings?.upiId?.trim() || "";
  const currency = invoice?.currency || "INR";
  const balanceDue = Number(invoice?.balanceDue) || 0;
  const status = invoice?.status || "Draft";

  // Per-invoice toggles: default to studio settings values; treat null as main=true, backup=false
  const settingsMain = settings?.showMainQr !== false;
  const invoiceMain = invoice?.showMainQr !== undefined && invoice?.showMainQr !== null
    ? Boolean(invoice.showMainQr)
    : settingsMain;

  const settingsBackup = Boolean(settings?.showBackupQr);
  const invoiceBackup = invoice?.showBackupQr !== undefined && invoice?.showBackupQr !== null
    ? Boolean(invoice.showBackupQr)
    : settingsBackup;

  const backupQrUrl = (settings?.backupQrUrl || settings?.customQrUrl || "/payment-qr.jpg").trim();
  const mainCaption = formatMainQrCaption(balanceDue);
  const backupCaption = (settings?.backupQrCaption && settings.backupQrCaption.trim()) ||
    "Backup QR: enter the amount manually";

  const details = {
    settingsToggle: masterSettingsToggle,
    invoiceToggle: masterInvoiceToggle,
    showMain: invoiceMain,
    showBackup: invoiceBackup,
    upiId,
    currency,
    balanceDue,
    status,
    backupQrUrl,
    mainCaption,
    backupCaption,
  };

  if (!settings) {
    const notReady = { shouldShow: false, reason: "Studio settings not loaded yet" };
    return {
      shouldShow: false,
      reason: "Studio settings not loaded yet",
      main: { ...notReady, caption: mainCaption },
      backup: { ...notReady, caption: backupCaption },
      details,
    };
  }

  // Evaluate Main QR
  let mainDecision: QrItemDecision & { upiUrl?: string };
  if (!masterEnabled) {
    mainDecision = {
      shouldShow: false,
      reason: !masterSettingsToggle
        ? "Payment QR is turned off in Studio Settings"
        : "Payment QR is turned off for this invoice",
      caption: mainCaption,
    };
  } else if (!invoiceMain) {
    mainDecision = {
      shouldShow: false,
      reason: "Main UPI QR is disabled for this invoice",
      caption: mainCaption,
    };
  } else if (status === "Paid" || status === "Cancelled") {
    mainDecision = {
      shouldShow: false,
      reason: `Invoice is marked as ${status}`,
      caption: mainCaption,
    };
  } else if (balanceDue <= 0) {
    mainDecision = {
      shouldShow: false,
      reason: "Balance Due is 0 (no payment needed)",
      caption: mainCaption,
    };
  } else if (currency !== "INR") {
    mainDecision = {
      shouldShow: false,
      reason: `Auto UPI QR only supports INR (current: ${currency})`,
      caption: mainCaption,
    };
  } else if (!upiId) {
    mainDecision = {
      shouldShow: false,
      reason: "No UPI ID configured in Studio Settings",
      caption: mainCaption,
    };
  } else {
    const upiUrl = buildUpiPaymentUrl(invoice, settings);
    mainDecision = {
      shouldShow: Boolean(upiUrl),
      reason: upiUrl ? undefined : "Could not construct UPI payment URL",
      caption: mainCaption,
      upiUrl: upiUrl || undefined,
    };
  }

  // Evaluate Backup QR
  let backupDecision: QrItemDecision & { imageUrl?: string };
  if (!masterEnabled) {
    backupDecision = {
      shouldShow: false,
      reason: !masterSettingsToggle
        ? "Payment QR is turned off in Studio Settings"
        : "Payment QR is turned off for this invoice",
      caption: backupCaption,
    };
  } else if (status === "Paid" || status === "Cancelled") {
    backupDecision = {
      shouldShow: false,
      reason: `Invoice is marked as ${status}`,
      caption: backupCaption,
    };
  } else if (!backupQrUrl) {
    backupDecision = {
      shouldShow: false,
      reason: "No backup QR image uploaded",
      caption: backupCaption,
    };
  } else if (currency !== "INR") {
    // Non-INR: only shown if explicitly enabled for that invoice
    if (invoice?.showBackupQr === true) {
      backupDecision = {
        shouldShow: true,
        caption: backupCaption,
        imageUrl: backupQrUrl,
      };
    } else {
      backupDecision = {
        shouldShow: false,
        reason: "Backup QR for non-INR currency is not enabled for this invoice",
        caption: backupCaption,
      };
    }
  } else {
    // INR: follows invoiceBackup (defaulting to settingsBackup)
    if (invoiceBackup) {
      backupDecision = {
        shouldShow: true,
        caption: backupCaption,
        imageUrl: backupQrUrl,
      };
    } else {
      backupDecision = {
        shouldShow: false,
        reason: "Backup QR is disabled",
        caption: backupCaption,
      };
    }
  }

  const shouldShow = mainDecision.shouldShow || backupDecision.shouldShow;
  const reason = !shouldShow
    ? mainDecision.reason || backupDecision.reason || "Payment QR disabled"
    : undefined;

  return {
    shouldShow,
    reason,
    main: mainDecision,
    backup: backupDecision,
    details,
  };
}

/**
 * Determines whether any payment QR should be rendered.
 */
export function shouldShowQr(
  invoice: Partial<Invoice>,
  settings?: StudioSettings | null
): boolean {
  return getQrDecision(invoice, settings).shouldShow;
}

export interface DualQrDataUrls {
  mainQrDataUrl: string | null;
  backupQrDataUrl: string | null;
  mainCaption: string;
  backupCaption: string;
}

/**
 * Safely loads or fetches an image into a base64 Data URL (server or client).
 * Catches network errors so PDF generation never fails.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  if (typeof window === "undefined") {
    // Server-side
    if (url.startsWith("/")) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          const mime = url.endsWith(".png") ? "image/png" : "image/jpeg";
          return `data:${mime};base64,${buf.toString("base64")}`;
        }
      } catch (err) {
        console.warn("Could not read local image file:", url, err);
      }
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          const contentType = res.headers.get("content-type") || "image/jpeg";
          return `data:${contentType};base64,${buf.toString("base64")}`;
        }
        console.warn(`Fetch returned status ${res.status} for backup QR image:`, url);
      } catch (err) {
        console.error("Failed to fetch remote backup QR image into buffer:", url, err);
      }
    }
  }

  // Client-side fallback or direct URL
  return url;
}

/**
 * Generates both main and backup QR Data URLs.
 */
export async function generateInvoiceQrDataUrls(
  invoice: Partial<Invoice>,
  settings: StudioSettings
): Promise<DualQrDataUrls> {
  const decision = getQrDecision(invoice, settings);

  let mainQrDataUrl: string | null = null;
  if (decision.main.shouldShow && decision.main.upiUrl) {
    try {
      mainQrDataUrl = await QRCode.toDataURL(decision.main.upiUrl, {
        errorCorrectionLevel: "M",
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (err) {
      console.error("Failed to generate main UPI QR code with qrcode library:", err);
      mainQrDataUrl = null;
    }
  }

  let backupQrDataUrl: string | null = null;
  if (decision.backup.shouldShow && decision.backup.imageUrl) {
    try {
      backupQrDataUrl = await fetchImageAsDataUrl(decision.backup.imageUrl);
    } catch (err) {
      console.error("Failed to load backup QR image:", err);
      backupQrDataUrl = null;
    }
  }

  return {
    mainQrDataUrl,
    backupQrDataUrl,
    mainCaption: decision.main.caption,
    backupCaption: decision.backup.caption,
  };
}

/**
 * Backwards compatibility helper: returns a single data URL if only one exists,
 * preferring main over backup.
 */
export async function generateInvoiceQrDataUrl(
  invoice: Partial<Invoice>,
  settings: StudioSettings
): Promise<string | null> {
  const result = await generateInvoiceQrDataUrls(invoice, settings);
  return result.mainQrDataUrl || result.backupQrDataUrl || null;
}
