import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import { Invoice, StudioSettings, CURRENCY_SYMBOLS } from "../types/invoice";
import { formatMoney } from "../invoice-calc";
import { generateInvoiceQrDataUrl } from "../upi-qr";

const RED = "#E50914";
const DARK = "#111111";
const MUTED = "#555555";
const LIGHT_BG = "#FAFAFA";
const BORDER = "#E5E5E5";

const styles = StyleSheet.create({
  page: {
    size: "A4",
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    lineHeight: 1.4,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: RED,
  },
  studioTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    letterSpacing: 0.5,
  },
  studioSubtitle: {
    fontSize: 8,
    color: RED,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 2,
    textTransform: "uppercase",
  },
  studioDetails: {
    fontSize: 8,
    color: MUTED,
    marginTop: 4,
    lineHeight: 1.3,
  },
  invoiceMetaRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: RED,
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 11,
    fontWeight: "bold",
    color: DARK,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 3,
    fontSize: 8,
  },
  metaLabel: {
    color: MUTED,
    fontWeight: "bold",
  },
  metaValue: {
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
  // Bottom breakdown
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 5,
  },
  paymentBox: {
    flex: 1.1,
    padding: 10,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 7.5,
  },
  paymentLabel: {
    width: 80,
    color: MUTED,
    fontWeight: "bold",
  },
  paymentVal: {
    flex: 1,
    color: DARK,
    fontWeight: "bold",
  },
  paymentBoxContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  paymentDetailsLeft: {
    flex: 1,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 86,
  },
  qrBox: {
    width: 84,
    height: 84,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  qrCaption: {
    fontSize: 6.5,
    color: MUTED,
    marginTop: 3,
    textAlign: "center",
    fontWeight: "bold",
  },
  totalsBox: {
    flex: 0.9,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    fontSize: 8,
  },
  summaryRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: DARK,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  footerMessage: {
    marginTop: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    textAlign: "center",
    fontSize: 7.5,
    color: MUTED,
    fontStyle: "italic",
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
}

export function InvoicePdfDocument({ invoice, settings, qrDataUrl }: InvoicePdfProps) {
  const currency = invoice.currency || "INR";
  const sym = CURRENCY_SYMBOLS[currency] || "₹";

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
          <View>
            <Text style={styles.studioTitle}>{settings.studioName || "SBX Studio"}</Text>
            <Text style={styles.studioSubtitle}>Video Editing & Visual Storytelling</Text>
            <View style={styles.studioDetails}>
              {settings.address ? (
                <Text>
                  {settings.address}
                  {settings.country && !settings.address.toLowerCase().includes(settings.country.toLowerCase())
                    ? ", " + settings.country
                    : ""}
                </Text>
              ) : null}
              {settings.email ? <Text>Email: {settings.email}</Text> : null}
              {settings.phone ? <Text>Phone: {settings.phone}</Text> : null}
            </View>
          </View>

          <View style={styles.invoiceMetaRight}>
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

        {/* Bottom Section: Payment Instructions + Summary */}
        <View style={styles.bottomSection}>
          {/* Payment Instructions */}
          <View style={styles.paymentBox}>
            <View style={styles.paymentBoxContent}>
              <View style={styles.paymentDetailsLeft}>
                <Text style={styles.sectionHeading}>Payment Details</Text>
                {settings.upiId ? (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>UPI ID:</Text>
                    <Text style={styles.paymentVal}>{settings.upiId}</Text>
                  </View>
                ) : null}
                {settings.bankName ? (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Bank Name:</Text>
                    <Text style={styles.paymentVal}>{settings.bankName}</Text>
                  </View>
                ) : null}
                {settings.bankAccountName ? (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>A/C Name:</Text>
                    <Text style={styles.paymentVal}>{settings.bankAccountName}</Text>
                  </View>
                ) : null}
                {settings.bankAccountNumber ? (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>A/C Number:</Text>
                    <Text style={styles.paymentVal}>{settings.bankAccountNumber}</Text>
                  </View>
                ) : null}
                {settings.bankIfsc ? (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>IFSC Code:</Text>
                    <Text style={styles.paymentVal}>{settings.bankIfsc}</Text>
                  </View>
                ) : null}
                {settings.bankSwift ? (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>SWIFT Code:</Text>
                    <Text style={styles.paymentVal}>{settings.bankSwift}</Text>
                  </View>
                ) : null}
              </View>

              {qrDataUrl ? (
                <View style={styles.qrContainer}>
                  <View style={styles.qrBox}>
                    <Image src={qrDataUrl} style={styles.qrImage} />
                  </View>
                  <Text style={styles.qrCaption}>{settings.qrCaption || "Scan to pay with any UPI app"}</Text>
                </View>
              ) : null}
            </View>

            {invoice.paymentInstructions ? (
              <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 4 }}>
                <Text style={[styles.sectionHeading, { fontSize: 7 }]}>Notes & Terms:</Text>
                <Text style={{ fontSize: 7, color: MUTED }}>{invoice.paymentInstructions}</Text>
              </View>
            ) : null}
          </View>

          {/* Totals Summary */}
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

            <View style={styles.summaryRowGrand}>
              <Text>Grand Total</Text>
              <Text>{formatMoney(invoice.grandTotal, currency)}</Text>
            </View>

            {invoice.advancePaid > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={{ color: MUTED }}>Advance Paid</Text>
                <Text style={{ color: "#059669", fontWeight: "bold" }}>
                  -{formatMoney(invoice.advancePaid, currency)}
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryRowBalance}>
              <Text>Balance Due</Text>
              <Text>{formatMoney(invoice.balanceDue, currency)}</Text>
            </View>
          </View>
        </View>

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
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await generateInvoiceQrDataUrl(invoice, settings);
  } catch (err) {
    console.error("generateInvoicePdfBuffer: Failed to generate invoice QR data URL:", err);
  }
  const element = <InvoicePdfDocument invoice={invoice} settings={settings} qrDataUrl={qrDataUrl} />;
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
