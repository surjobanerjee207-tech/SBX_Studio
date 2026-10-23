import React from "react";
import path from "path";
import fs from "fs";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { Invoice, StudioSettings, CURRENCY_SYMBOLS } from "../types/invoice";
import { formatMoney } from "../invoice-calc";
import { generateInvoiceQrDataUrl, generateInvoiceQrDataUrls, DualQrDataUrls } from "../upi-qr";

let fontsRegistered = false;
export function registerCustomFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;

  try {
    Font.registerHyphenationCallback((word) => {
      // Break long words without spaces (like long UPI IDs, URLs, IBANs) so they never overflow
      if (word.length > 20) {
        if (word.includes("@")) {
          const atIdx = word.indexOf("@");
          const before = word.slice(0, atIdx);
          const after = word.slice(atIdx);
          if (before.length > 18) {
            const parts: string[] = [];
            for (let i = 0; i < before.length; i += 14) {
              parts.push(before.slice(i, i + 14));
            }
            return [...parts, after];
          }
          return [before, after];
        }
        const parts: string[] = [];
        for (let i = 0; i < word.length; i += 14) {
          parts.push(word.slice(i, i + 14));
        }
        return parts;
      }
      return [word];
    });
  } catch (err) {
    console.warn("Could not register hyphenation callback:", err);
  }

  try {
    const fontsDir = path.join(process.cwd(), "assets", "fonts");
    const regularPath = path.join(fontsDir, "Inter-Regular.ttf");
    const italicPath = path.join(fontsDir, "Inter-Italic.ttf");
    const mediumPath = path.join(fontsDir, "Inter-Medium.ttf");
    const semiBoldPath = path.join(fontsDir, "Inter-SemiBold.ttf");
    const boldPath = path.join(fontsDir, "Inter-Bold.ttf");

    const hasRegular = fs.existsSync(regularPath);
    const hasBold = fs.existsSync(boldPath);
    const hasItalic = fs.existsSync(italicPath);
    const hasMedium = fs.existsSync(mediumPath);
    const hasSemiBold = fs.existsSync(semiBoldPath);

    if (hasRegular && hasBold) {
      Font.register({
        family: "Inter",
        fonts: [
          { src: regularPath, fontWeight: "normal" as const },
          { src: regularPath, fontWeight: 400 },
          {
            src: hasItalic ? italicPath : regularPath,
            fontWeight: "normal" as const,
            fontStyle: "italic" as const,
          },
          {
            src: hasItalic ? italicPath : regularPath,
            fontWeight: 400,
            fontStyle: "italic" as const,
          },
          { src: hasMedium ? mediumPath : regularPath, fontWeight: 500 },
          { src: hasSemiBold ? semiBoldPath : boldPath, fontWeight: 600 },
          { src: boldPath, fontWeight: "bold" as const },
          { src: boldPath, fontWeight: 700 },
        ],
      });
    } else {
      console.warn("Custom Inter font files not found at assets/fonts, falling back to standard Helvetica.");
      Font.register({
        family: "Inter",
        fonts: [
          { src: "Helvetica", fontWeight: "normal" as const },
          { src: "Helvetica-Bold", fontWeight: "bold" as const },
        ],
      });
    }
  } catch (err) {
    console.error("Failed to register custom PDF fonts:", err);
    try {
      Font.register({
        family: "Inter",
        fonts: [
          { src: "Helvetica", fontWeight: "normal" as const },
          { src: "Helvetica-Bold", fontWeight: "bold" as const },
        ],
      });
    } catch (_) {}
  }
}

// Initial registration
registerCustomFonts();

const RED = "#E50914";
const DARK = "#111111";
const MUTED = "#555555";
const LIGHT_BG = "#FAFAFA";
const BORDER = "#E5E5E5";

const styles = StyleSheet.create({
  page: {
    size: "A4",
    padding: 36,
    fontFamily: "Inter",
    fontSize: 9,
    color: DARK,
    lineHeight: 1.4,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: RED,
  },
  headerLeft: {
    width: "58%",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  studioTitle: {
    fontSize: 18,
    lineHeight: 1.2,
    fontWeight: "bold",
    color: DARK,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  studioSubtitle: {
    fontSize: 8,
    lineHeight: 1.3,
    color: RED,
    fontWeight: "bold",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  studioDetails: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 2,
  },
  studioText: {
    fontSize: 8,
    lineHeight: 1.35,
    color: MUTED,
    marginTop: 1.5,
  },
  headerRight: {
    width: "38%",
    flexShrink: 0,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    lineHeight: 1.2,
    fontWeight: "bold",
    color: RED,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 11,
    lineHeight: 1.3,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 5,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 8,
    lineHeight: 1.3,
    color: MUTED,
    fontWeight: "bold",
  },
  metaValue: {
    fontSize: 8,
    lineHeight: 1.3,
    color: DARK,
    fontWeight: "bold",
  },
  statusBadge: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusPaid: {
    backgroundColor: "#ECFDF5",
    color: "#065F46",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statusOverdue: {
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  statusDraft: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusSent: {
    backgroundColor: "#EFF6FF",
    color: "#1E40AF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  twoColSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 20,
  },
  billToBox: {
    flex: 1,
    padding: 10,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: RED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 2,
  },
  clientText: {
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.3,
  },
  // Table
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK,
    color: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: "bold",
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: LIGHT_BG,
  },
  colDesc: {
    flex: 4,
    paddingRight: 6,
  },
  colQty: {
    flex: 1,
    textAlign: "center",
  },
  colUnit: {
    flex: 1,
    textAlign: "center",
  },
  colPrice: {
    flex: 1.5,
    textAlign: "right",
  },
  colTotal: {
    flex: 1.5,
    textAlign: "right",
    fontWeight: "bold",
  },
  itemName: {
    fontSize: 9,
    fontWeight: "bold",
    color: DARK,
  },
  itemDesc: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 1,
  },
  // Totals breakdown
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    marginBottom: 10,
  },
  totalsBox: {
    width: "45%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    fontSize: 8,
  },
  summaryRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#FEE2E2",
    borderBottomWidth: 1,
    borderBottomColor: RED,
    fontSize: 9,
    fontWeight: "bold",
    color: RED,
  },
  summaryRowBalance: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: DARK,
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "bold",
  },

  // Payment Information Section
  paymentSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  paymentSectionHeader: {
    marginBottom: 6,
  },
  paymentSectionHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: RED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  paymentSectionRedLine: {
    borderBottomWidth: 1,
    borderBottomColor: RED,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  card: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 8,
  },
  cardFull: {
    width: "100%",
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 8,
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  bankTable: {
    flexDirection: "column",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  bankRowLast: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 3,
  },
  bankLabel: {
    width: "35%",
    fontSize: 7,
    color: MUTED,
    fontWeight: "bold",
    lineHeight: 1.25,
  },
  bankVal: {
    width: "65%",
    fontSize: 7.5,
    color: DARK,
    fontWeight: "bold",
    lineHeight: 1.25,
  },
  bankValMono: {
    width: "65%",
    fontSize: 7.5,
    color: DARK,
    fontWeight: "bold",
    lineHeight: 1.25,
  },
  upiInfoBlock: {
    marginBottom: 4,
  },
  upiLabel: {
    fontSize: 6.5,
    color: MUTED,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  upiVal: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: DARK,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  qrRowCenter: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 10,
    marginTop: "auto",
    paddingTop: 4,
  },
  qrBlockMain: {
    alignItems: "center",
    width: 80,
  },
  qrBoxMain: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImageMain: {
    width: 75,
    height: 75,
    objectFit: "contain",
  },
  qrCaptionMain: {
    fontSize: 6,
    color: DARK,
    marginTop: 4,
    lineHeight: 1.3,
    textAlign: "center",
    fontWeight: "bold",
    width: 80,
  },
  qrBlockBackup: {
    alignItems: "center",
    width: 58,
  },
  qrBoxBackup: {
    width: 58,
    height: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImageBackup: {
    width: 53,
    height: 53,
    objectFit: "contain",
  },
  qrCaptionBackup: {
    fontSize: 5.5,
    color: MUTED,
    marginTop: 4,
    lineHeight: 1.3,
    textAlign: "center",
    width: 58,
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  notesHeading: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: RED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 7,
    color: MUTED,
    lineHeight: 1.3,
  },
  footerMessage: {
    marginTop: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    textAlign: "center",
    fontSize: 7.5,
    color: MUTED,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 15,
    right: 36,
    color: MUTED,
  },
});

export interface InvoicePdfProps {
  invoice: Invoice;
  settings: StudioSettings;
  qrDataUrl?: string | null;
  mainQrDataUrl?: string | null;
  backupQrDataUrl?: string | null;
  mainCaption?: string;
  backupCaption?: string;
}

export function InvoicePdfDocument({
  invoice,
  settings,
  qrDataUrl,
  mainQrDataUrl,
  backupQrDataUrl,
  mainCaption,
  backupCaption,
}: InvoicePdfProps) {
  const currency = invoice.currency || "INR";
  const sym = CURRENCY_SYMBOLS[currency] || "₹";

  const effectiveMainQr = mainQrDataUrl !== undefined ? mainQrDataUrl : qrDataUrl;
  const effectiveBackupQr = backupQrDataUrl || null;
  const balanceDue = Number(invoice.balanceDue) || 0;
  const effectiveMainCaption =
    mainCaption ||
    `Scan to pay Rs. ${Number.isInteger(balanceDue) ? balanceDue.toLocaleString("en-IN") : balanceDue.toFixed(2)}`;
  const effectiveBackupCaption =
    backupCaption || settings.backupQrCaption || "Backup QR: enter the amount manually";

  const hasBankDetails = Boolean(
    settings.bankAccountName ||
    settings.bankName ||
    settings.bankAccountNumber ||
    settings.bankIfsc ||
    settings.bankSwift
  );
  const hasUpiId = Boolean(settings.upiId && settings.upiId.trim());
  const hasMainQr = Boolean(effectiveMainQr);
  const hasBackupQr = Boolean(effectiveBackupQr);
  const hasAnyQr = hasMainQr || hasBackupQr;
  const hasUpiCard = hasUpiId || hasAnyQr;
  const showPaymentSection = hasBankDetails || hasUpiCard;

  const statusStyle =
    invoice.status === "Paid"
      ? styles.statusPaid
      : invoice.status === "Overdue"
      ? styles.statusOverdue
      : invoice.status === "Sent"
      ? styles.statusSent
      : styles.statusDraft;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.studioTitle}>{settings.studioName || "SBX Studio"}</Text>
            <Text style={styles.studioSubtitle}>Video Editing & Visual Storytelling</Text>
            <View style={styles.studioDetails}>
              {settings.address ? (
                <Text style={styles.studioText}>
                  {settings.address}
                  {settings.country && !settings.address.toLowerCase().includes(settings.country.toLowerCase())
                    ? ", " + settings.country
                    : ""}
                </Text>
              ) : null}
              {settings.email ? <Text style={styles.studioText}>Email: {settings.email}</Text> : null}
              {settings.phone ? <Text style={styles.studioText}>Phone: {settings.phone}</Text> : null}
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{invoice.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={styles.metaValue}>{invoice.dueDate}</Text>
            </View>
            <Text style={[styles.statusBadge, statusStyle]}>{invoice.status}</Text>
          </View>
        </View>

        {/* Billed To Section */}
        <View style={styles.twoColSection}>
          <View style={styles.billToBox}>
            <Text style={styles.sectionHeading}>Billed To</Text>
            <Text style={styles.clientName}>{invoice.clientName}</Text>
            {invoice.clientCompany ? <Text style={styles.clientText}>{invoice.clientCompany}</Text> : null}
            {invoice.clientAddress ? <Text style={styles.clientText}>{invoice.clientAddress}</Text> : null}
            {invoice.clientCountry ? <Text style={styles.clientText}>{invoice.clientCountry}</Text> : null}
            {invoice.clientEmail ? <Text style={styles.clientText}>Email: {invoice.clientEmail}</Text> : null}
            {invoice.clientPhone ? <Text style={styles.clientText}>Phone: {invoice.clientPhone}</Text> : null}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Service / Item Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {invoice.items.map((item, idx) => (
            <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <View style={styles.colDesc}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{formatMoney(item.unitPrice, currency)}</Text>
              <Text style={styles.colTotal}>{formatMoney(item.total, currency)}</Text>
            </View>
          ))}
        </View>

        {/* 1. TOTALS: right-aligned block, about 45% of page width, directly under items table */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={{ color: MUTED }}>Subtotal</Text>
              <Text style={{ fontWeight: "bold" }}>{formatMoney(invoice.subtotal, currency)}</Text>
            </View>

            {invoice.discountAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={{ color: MUTED }}>
                  Discount {invoice.discountType === "percent" ? `(${invoice.discountValue}%)` : ""}
                </Text>
                <Text style={{ color: RED, fontWeight: "bold" }}>
                  -{formatMoney(invoice.discountAmount, currency)}
                </Text>
              </View>
            ) : null}

            {invoice.taxEnabled && invoice.taxAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={{ color: MUTED }}>Tax ({invoice.taxRate}%)</Text>
                <Text style={{ fontWeight: "bold" }}>+{formatMoney(invoice.taxAmount, currency)}</Text>
              </View>
            ) : null}

            {invoice.extraCharges > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={{ color: MUTED }}>{invoice.extraChargesLabel || "Extra Fee"}</Text>
                <Text style={{ fontWeight: "bold" }}>+{formatMoney(invoice.extraCharges, currency)}</Text>
              </View>
            ) : null}

            {invoice.advancePaid > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={{ color: MUTED }}>Advance Paid</Text>
                <Text style={{ color: "#059669", fontWeight: "bold" }}>
                  -{formatMoney(invoice.advancePaid, currency)}
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryRowGrand}>
              <Text>Grand Total</Text>
              <Text>{formatMoney(invoice.grandTotal, currency)}</Text>
            </View>

            <View style={styles.summaryRowBalance}>
              <Text>Balance Due</Text>
              <Text>{formatMoney(invoice.balanceDue, currency)}</Text>
            </View>
          </View>
        </View>

        {/* 2. PAYMENT INFORMATION: full-width section with red heading and line */}
        {showPaymentSection ? (
          <View style={styles.paymentSection} wrap={false}>
            <View style={styles.paymentSectionHeader}>
              <Text style={styles.paymentSectionHeading}>PAYMENT INFORMATION</Text>
              <View style={styles.paymentSectionRedLine} />
            </View>

            <View style={styles.cardsRow}>
              {/* LEFT CARD: Bank Transfer */}
              {hasBankDetails ? (
                <View style={hasUpiCard ? styles.card : styles.cardFull} wrap={false}>
                  <Text style={styles.cardTitle}>Bank Transfer</Text>
                  <View style={styles.bankTable}>
                    {settings.bankAccountName ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Name</Text>
                        <Text style={styles.bankVal}>{settings.bankAccountName}</Text>
                      </View>
                    ) : null}
                    {settings.bankName ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Bank</Text>
                        <Text style={styles.bankVal}>{settings.bankName}</Text>
                      </View>
                    ) : null}
                    {settings.bankAccountNumber ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Number</Text>
                        <Text style={styles.bankValMono}>{settings.bankAccountNumber}</Text>
                      </View>
                    ) : null}
                    {settings.bankIfsc ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>IFSC Code</Text>
                        <Text style={styles.bankValMono}>{settings.bankIfsc}</Text>
                      </View>
                    ) : null}
                    {settings.bankSwift ? (
                      <View style={styles.bankRowLast}>
                        <Text style={styles.bankLabel}>SWIFT Code</Text>
                        <Text style={styles.bankValMono}>{settings.bankSwift}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* RIGHT CARD: Pay via UPI */}
              {hasUpiCard ? (
                <View style={hasBankDetails ? styles.card : styles.cardFull} wrap={false}>
                  <Text style={styles.cardTitle}>Pay via UPI</Text>

                  {hasUpiId ? (
                    <View style={styles.upiInfoBlock}>
                      <Text style={styles.upiLabel}>UPI ID</Text>
                      <Text style={styles.upiVal}>{settings.upiId}</Text>
                    </View>
                  ) : null}

                  {hasAnyQr ? (
                    <View style={styles.qrRowCenter}>
                      {hasMainQr ? (
                        <View style={styles.qrBlockMain}>
                          <View style={styles.qrBoxMain}>
                            <Image src={effectiveMainQr!} style={styles.qrImageMain} />
                          </View>
                          <Text style={styles.qrCaptionMain}>{effectiveMainCaption}</Text>
                        </View>
                      ) : null}

                      {hasBackupQr ? (
                        <View style={styles.qrBlockBackup}>
                          <View style={styles.qrBoxBackup}>
                            <Image src={effectiveBackupQr!} style={styles.qrImageBackup} />
                          </View>
                          <Text style={styles.qrCaptionBackup}>{effectiveBackupCaption}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 3. NOTES & TERMS: full-width below Payment Information */}
        {invoice.paymentInstructions ? (
          <View style={styles.notesSection} wrap={false}>
            <Text style={styles.notesHeading}>NOTES & TERMS</Text>
            <Text style={styles.notesContent}>{invoice.paymentInstructions}</Text>
          </View>
        ) : null}

        {/* Footer message */}
        <Text style={styles.footerMessage}>
          {settings.footerMessage || "Thank you for your business. Every frame tells a story."}
        </Text>

        {/* Page numbering */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

/**
 * Server-side generation of PDF buffer.
 */
export async function generateInvoicePdfBuffer(
  invoice: Invoice,
  settings: StudioSettings
): Promise<Buffer> {
  registerCustomFonts();

  let qrData: DualQrDataUrls = {
    mainQrDataUrl: null,
    backupQrDataUrl: null,
    mainCaption: "",
    backupCaption: "",
  };

  try {
    qrData = await generateInvoiceQrDataUrls(invoice, settings);
  } catch (err) {
    console.error("generateInvoicePdfBuffer: Failed to generate invoice QR data URLs:", err);
  }

  const element = (
    <InvoicePdfDocument
      invoice={invoice}
      settings={settings}
      mainQrDataUrl={qrData.mainQrDataUrl}
      backupQrDataUrl={qrData.backupQrDataUrl}
      mainCaption={qrData.mainCaption}
      backupCaption={qrData.backupCaption}
      qrDataUrl={qrData.mainQrDataUrl || qrData.backupQrDataUrl}
    />
  );
  return await renderToBuffer(element);
}

/**
 * Generates the clean filename: SBX_Invoice_ClientName_InvoiceNumber.pdf
 */
export function getInvoicePdfFilename(invoice: Invoice): string {
  const cleanClient = (invoice.clientName || "Client")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);
  const cleanNumber = (invoice.number || "Invoice").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `SBX_Invoice_${cleanClient}_${cleanNumber}.pdf`;
}
