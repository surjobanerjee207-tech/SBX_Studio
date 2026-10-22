import { z } from "zod";

export type Currency = "INR" | "USD" | "EUR" | "GBP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "Draft",
  "Sent",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
];

// Zod schema for invoice line item
export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Item name is required"),
  description: z.string().trim().optional().default(""),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
  unit: z.string().trim().min(1, "Unit is required").default("video"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative").default(0),
  total: z.coerce.number().default(0),
  order: z.coerce.number().default(0),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

// Zod schema for Invoice
export const InvoiceSchema = z.object({
  id: z.string().optional(),
  number: z.string().trim().min(1, "Invoice number is required"),
  clientId: z.string().optional().nullable(),
  clientName: z.string().trim().min(1, "Client name is required"),
  clientCompany: z.string().trim().optional().default(""),
  clientEmail: z.string().trim().email("Invalid client email").or(z.literal("")).optional().default(""),
  clientPhone: z.string().trim().optional().default(""),
  clientAddress: z.string().trim().optional().default(""),
  clientCountry: z.string().trim().optional().default("India"),
  date: z.string().min(1, "Invoice date is required"), // YYYY-MM-DD
  dueDate: z.string().min(1, "Due date is required"),  // YYYY-MM-DD
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  status: z.enum(["Draft", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"]).default("Draft"),
  paymentInstructions: z.string().optional().default(""),
  footerNotes: z.string().optional().default(""),
  subtotal: z.coerce.number().default(0),
  discountType: z.enum(["percent", "fixed"]).default("percent"),
  discountValue: z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().default(0),
  taxEnabled: z.boolean().default(false),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxAmount: z.coerce.number().default(0),
  extraCharges: z.coerce.number().min(0).default(0),
  extraChargesLabel: z.string().optional().default("Rush / Extra Fee"),
  grandTotal: z.coerce.number().default(0),
  advancePaid: z.coerce.number().min(0).default(0),
  balanceDue: z.coerce.number().default(0),
  publicToken: z.string().optional(),
  publicLinkEnabled: z.boolean().default(true),
  sentAt: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, "At least one line item is required"),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// Studio Settings Schema
export const StudioSettingsSchema = z.object({
  id: z.string().default("default"),
  studioName: z.string().trim().min(1, "Studio name is required").default("SBX Studio"),
  logoUrl: z.string().optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default("India"),
  upiId: z.string().trim().optional().default(""),
  bankName: z.string().trim().optional().default(""),
  bankAccountName: z.string().trim().optional().default(""),
  bankAccountNumber: z.string().trim().optional().default(""),
  bankIfsc: z.string().trim().optional().default(""),
  bankSwift: z.string().trim().optional().default(""),
  footerMessage: z.string().optional().default("Thank you for your business. Every frame tells a story."),
  defaultCurrency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(0),
  defaultTaxEnabled: z.boolean().default(false),
  defaultPaymentTerms: z.string().optional().default("Payment due within 7 days of invoice date. 50% advance for raw project files."),
  adminPasswordHash: z.string().optional(),
  adminPasswordSalt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type StudioSettings = z.infer<typeof StudioSettingsSchema>;

// Client Schema
export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Client name is required"),
  company: z.string().trim().optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default("India"),
  notes: z.string().trim().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Client = z.infer<typeof ClientSchema>;

// Service Preset Schema
export const ServicePresetSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Service name is required"),
  description: z.string().trim().optional().default(""),
  defaultUnit: z.string().trim().min(1).default("video"),
  defaultPrice: z.coerce.number().min(0).default(0),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  order: z.coerce.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ServicePreset = z.infer<typeof ServicePresetSchema>;
