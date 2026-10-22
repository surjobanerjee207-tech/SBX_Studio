import {
  Currency,
  CURRENCY_SYMBOLS,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
} from "./types/invoice";

export interface CalculatedTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  extraCharges: number;
  grandTotal: number;
  advancePaid: number;
  balanceDue: number;
  items: InvoiceItem[];
}

/**
 * Calculates line item total and whole invoice financial breakdown.
 * Ensures all monetary values are stored and rounded as whole integers.
 */
export function calculateInvoiceTotals(
  invoice: Partial<Invoice> & { items?: Partial<InvoiceItem>[] }
): CalculatedTotals {
  // 1. Calculate each item total
  const items: InvoiceItem[] = (invoice.items || []).map((item, idx) => {
    const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
    const price = Math.max(0, Math.round(Number(item.unitPrice) || 0));
    const total = qty * price;
    return {
      id: item.id || `item_${idx + 1}`,
      name: (item.name || "").trim(),
      description: (item.description || "").trim(),
      quantity: qty,
      unit: (item.unit || "video").trim(),
      unitPrice: price,
      total,
      order: typeof item.order === "number" ? item.order : idx,
    };
  });

  // 2. Subtotal
  const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);

  // 3. Discount
  const discountType = invoice.discountType || "percent";
  const discountVal = Math.max(0, Number(invoice.discountValue) || 0);
  let discountAmount = 0;
  if (discountType === "percent") {
    // Round to nearest integer
    discountAmount = Math.round((subtotal * Math.min(100, discountVal)) / 100);
  } else {
    discountAmount = Math.min(subtotal, Math.round(discountVal));
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  // 4. Tax (ONLY applied if taxEnabled is explicitly true)
  const taxEnabled = Boolean(invoice.taxEnabled);
  const taxRate = Math.max(0, Number(invoice.taxRate) || 0);
  let taxAmount = 0;
  if (taxEnabled && taxRate > 0) {
    taxAmount = Math.round((afterDiscount * taxRate) / 100);
  }

  // 5. Extra charges
  const extraCharges = Math.max(0, Math.round(Number(invoice.extraCharges) || 0));

  // 6. Grand total
  const grandTotal = Math.max(0, afterDiscount + taxAmount + extraCharges);

  // 7. Advance paid
  const advancePaid = Math.max(0, Math.round(Number(invoice.advancePaid) || 0));

  // 8. Balance due
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    extraCharges,
    grandTotal,
    advancePaid,
    balanceDue,
    items,
  };
}

/**
 * Format monetary amount with currency symbol and comma separators (Indian / International).
 */
export function formatMoney(amount: number, currency: Currency = "INR"): string {
  const sym = CURRENCY_SYMBOLS[currency] || "₹";
  const safeNum = Math.round(Number(amount) || 0);

  if (currency === "INR") {
    // Indian formatting (en-IN)
    return `${sym}${safeNum.toLocaleString("en-IN")}`;
  }
  return `${sym}${safeNum.toLocaleString("en-US")}`;
}

/**
 * Automatically determine if an invoice is Overdue based on due date.
 * If status is not Paid or Cancelled, and due date has passed, it computes as Overdue.
 */
export function getComputedStatus(
  status: InvoiceStatus,
  dueDateString: string
): InvoiceStatus {
  if (status === "Paid" || status === "Cancelled") {
    return status;
  }
  if (!dueDateString) return status;

  const due = new Date(dueDateString);
  const now = new Date();
  // Set to midnight for clean day-level comparison
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due < now) {
    return "Overdue";
  }
  return status;
}

/**
 * Generates an invoice number in the format SBX-YYYY-001.
 */
export function formatInvoiceNumber(year: number, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(3, "0");
  return `SBX-${year}-${padded}`;
}

/**
 * Parses an invoice number like "SBX-2026-004" into { year: 2026, sequence: 4 }.
 */
export function parseInvoiceNumber(num: string): { year: number; sequence: number } | null {
  const match = num.trim().match(/^SBX-(\d{4})-(\d+)$/i);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}
