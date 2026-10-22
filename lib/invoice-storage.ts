import crypto from "crypto";
import { prisma } from "./prisma";
import {
  Client,
  Invoice,
  InvoiceItem,
  ServicePreset,
  StudioSettings,
} from "./types/invoice";
import {
  calculateInvoiceTotals,
  formatInvoiceNumber,
  getComputedStatus,
  parseInvoiceNumber,
} from "./invoice-calc";
import { hashPassword, verifyPassword } from "./auth";

export const DEFAULT_SETTINGS: StudioSettings = {
  id: "default",
  studioName: "SBX Studio",
  logoUrl: "/icon.svg",
  email: "surjobanerjee207@gmail.com",
  phone: "+91 7004844003",
  address: "Jamshedpur, Jharkhand",
  country: "India",
  upiId: "surjobanerjee702@oksbi",
  bankName: "HDFC Bank",
  bankAccountName: "SBX Studio",
  bankAccountNumber: "50200098765432",
  bankIfsc: "HDFC0001234",
  bankSwift: "HDFCINBBXXX",
  footerMessage: "Thank you for collaborating with SBX Studio. Every frame tells a story.",
  defaultCurrency: "INR",
  defaultTaxRate: 18,
  defaultTaxEnabled: false,
  showPaymentQr: true,
  qrMode: "auto",
  customQrUrl: "",
  qrCaption: "Scan to pay",
  defaultPaymentTerms:
    "50% advance to initiate edit. Remaining balance upon final video delivery. UPI / IMPS / Bank transfer accepted.",
  adminPasswordHash: "",
  adminPasswordSalt: "",
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_SERVICES: ServicePreset[] = [
  {
    id: "srv_1",
    name: "Video Editing",
    description: "Multi-cam editing, pacing, cuts, and cinematic assembly",
    defaultUnit: "video",
    defaultPrice: 2000,
    currency: "INR",
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_2",
    name: "Sound Design",
    description: "SFX, dialogue cleanup, ambient foley, and audio mixing",
    defaultUnit: "video",
    defaultPrice: 2000,
    currency: "INR",
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_3",
    name: "Motion Graphics",
    description: "Animated titles, lower thirds, callouts, and kinetic typography",
    defaultUnit: "project",
    defaultPrice: 3500,
    currency: "INR",
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_4",
    name: "3D Animation",
    description: "3D scene composition, camera tracking, and render passes",
    defaultUnit: "project",
    defaultPrice: 5000,
    currency: "INR",
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_5",
    name: "Color Grading",
    description: "Look development, shot matching, film emulation, and HDR mastering",
    defaultUnit: "video",
    defaultPrice: 2500,
    currency: "INR",
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_6",
    name: "YouTube Optimization",
    description: "Thumbnail design, retention hooks, pacing cutdowns, and sound leveling",
    defaultUnit: "video",
    defaultPrice: 1500,
    currency: "INR",
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_7",
    name: "Short-Form Reel / TikTok",
    description: "Dynamic captions, kinetic sound design, fast cuts, and mobile framing",
    defaultUnit: "reel",
    defaultPrice: 1000,
    currency: "INR",
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_8",
    name: "Commercial Brand Film",
    description: "Full end-to-end post production: editorial, sound, VFX, and finish",
    defaultUnit: "project",
    defaultPrice: 10000,
    currency: "INR",
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: "cli_1",
    name: "Apex Creative Media",
    company: "Apex Media Group",
    email: "contact@apexmedia.co",
    phone: "+91 98300 11223",
    address: "Andheri West, Mumbai",
    country: "India",
    notes: "Regular client for commercial product reels",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_2",
    name: "Vanguard Studios",
    company: "Vanguard Digital Inc",
    email: "billing@vanguard.io",
    phone: "+1 (555) 234-5678",
    address: "Brooklyn, New York",
    country: "United States",
    notes: "YouTube longform edits and documentary trailers",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function mapPrismaInvoice(rec: any): Invoice {
  const dateStr = rec.date instanceof Date ? rec.date.toISOString().split("T")[0] : String(rec.date).split("T")[0];
  const dueDateStr = rec.dueDate instanceof Date ? rec.dueDate.toISOString().split("T")[0] : String(rec.dueDate).split("T")[0];
  const computedStatus = getComputedStatus(rec.status, dueDateStr);

  return {
    id: rec.id,
    number: rec.number,
    clientId: rec.clientId || null,
    clientName: rec.clientName || "",
    clientCompany: rec.clientCompany || "",
    clientEmail: rec.clientEmail || "",
    clientPhone: rec.clientPhone || "",
    clientAddress: rec.clientAddress || "",
    clientCountry: rec.clientCountry || "India",
    date: dateStr,
    dueDate: dueDateStr,
    currency: (rec.currency as any) || "INR",
    status: computedStatus,
    paymentInstructions: rec.paymentInstructions || "",
    footerNotes: rec.footerNotes || "",
    subtotal: rec.subtotal,
    discountType: (rec.discountType as any) || "percent",
    discountValue: rec.discountValue,
    discountAmount: rec.discountAmount,
    taxEnabled: rec.taxEnabled,
    taxRate: rec.taxRate,
    taxAmount: rec.taxAmount,
    extraCharges: rec.extraCharges,
    extraChargesLabel: rec.extraChargesLabel || "Rush Turnaround Fee",
    grandTotal: rec.grandTotal,
    advancePaid: rec.advancePaid,
    balanceDue: rec.balanceDue,
    publicToken: rec.publicToken,
    publicLinkEnabled: rec.publicLinkEnabled ?? true,
    showPaymentQr: rec.showPaymentQr ?? true,
    sentAt: rec.sentAt ? (rec.sentAt instanceof Date ? rec.sentAt.toISOString() : String(rec.sentAt)) : null,
    createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
    updatedAt: rec.updatedAt instanceof Date ? rec.updatedAt.toISOString() : String(rec.updatedAt),
    items: Array.isArray(rec.items)
      ? rec.items.map((it: any) => ({
          id: it.id,
          name: it.name,
          description: it.description || "",
          quantity: it.quantity,
          unit: it.unit || "video",
          unitPrice: it.unitPrice,
          total: it.total,
          order: it.order,
        }))
      : [],
  };
}

// ----------------------------------------------------
// Studio Settings & Admin Password Management
// ----------------------------------------------------

export async function getStudioSettings(): Promise<StudioSettings> {
  try {
    const record = await prisma.studioSettings.findUnique({ where: { id: "default" } });
    if (record) {
      return {
        id: record.id,
        studioName: record.studioName,
        logoUrl: record.logoUrl || DEFAULT_SETTINGS.logoUrl,
        email: record.email || DEFAULT_SETTINGS.email,
        phone: record.phone || DEFAULT_SETTINGS.phone,
        address: record.address || DEFAULT_SETTINGS.address,
        country: record.country || DEFAULT_SETTINGS.country,
        upiId: record.upiId || DEFAULT_SETTINGS.upiId,
        bankName: record.bankName || DEFAULT_SETTINGS.bankName,
        bankAccountName: record.bankAccountName || DEFAULT_SETTINGS.bankAccountName,
        bankAccountNumber: record.bankAccountNumber || DEFAULT_SETTINGS.bankAccountNumber,
        bankIfsc: record.bankIfsc || DEFAULT_SETTINGS.bankIfsc,
        bankSwift: record.bankSwift || DEFAULT_SETTINGS.bankSwift,
        footerMessage: record.footerMessage || DEFAULT_SETTINGS.footerMessage,
        defaultCurrency: (record.defaultCurrency as any) || DEFAULT_SETTINGS.defaultCurrency,
        defaultTaxRate: record.defaultTaxRate,
        defaultTaxEnabled: record.defaultTaxEnabled,
        defaultPaymentTerms: record.defaultPaymentTerms || DEFAULT_SETTINGS.defaultPaymentTerms,
        showPaymentQr: record.showPaymentQr ?? true,
        qrMode: (record.qrMode as any) || "auto",
        customQrUrl: record.customQrUrl || "",
        qrCaption: record.qrCaption || "Scan to pay",
        adminPasswordHash: record.adminPasswordHash || undefined,
        adminPasswordSalt: record.adminPasswordSalt || undefined,
        updatedAt: record.updatedAt.toISOString(),
      };
    }

    // Initialize default row in database
    const created = await prisma.studioSettings.create({
      data: {
        id: "default",
        studioName: DEFAULT_SETTINGS.studioName,
        logoUrl: DEFAULT_SETTINGS.logoUrl,
        email: DEFAULT_SETTINGS.email,
        phone: DEFAULT_SETTINGS.phone,
        address: DEFAULT_SETTINGS.address,
        country: DEFAULT_SETTINGS.country,
        upiId: DEFAULT_SETTINGS.upiId,
        bankName: DEFAULT_SETTINGS.bankName,
        bankAccountName: DEFAULT_SETTINGS.bankAccountName,
        bankAccountNumber: DEFAULT_SETTINGS.bankAccountNumber,
        bankIfsc: DEFAULT_SETTINGS.bankIfsc,
        bankSwift: DEFAULT_SETTINGS.bankSwift,
        footerMessage: DEFAULT_SETTINGS.footerMessage,
        defaultCurrency: DEFAULT_SETTINGS.defaultCurrency,
        defaultTaxRate: DEFAULT_SETTINGS.defaultTaxRate,
        defaultTaxEnabled: DEFAULT_SETTINGS.defaultTaxEnabled,
        defaultPaymentTerms: DEFAULT_SETTINGS.defaultPaymentTerms,
        showPaymentQr: DEFAULT_SETTINGS.showPaymentQr,
        qrMode: DEFAULT_SETTINGS.qrMode,
        customQrUrl: DEFAULT_SETTINGS.customQrUrl,
        qrCaption: DEFAULT_SETTINGS.qrCaption,
      },
    });

    return {
      ...DEFAULT_SETTINGS,
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (err) {
    console.warn("Prisma getStudioSettings fallback:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateStudioSettings(
  updates: Partial<StudioSettings>
): Promise<StudioSettings> {
  const current = await getStudioSettings();
  const merged: StudioSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const record = await prisma.studioSettings.upsert({
    where: { id: "default" },
    update: {
      studioName: merged.studioName,
      logoUrl: merged.logoUrl,
      email: merged.email,
      phone: merged.phone,
      address: merged.address,
      country: merged.country,
      upiId: merged.upiId,
      bankName: merged.bankName,
      bankAccountName: merged.bankAccountName,
      bankAccountNumber: merged.bankAccountNumber,
      bankIfsc: merged.bankIfsc,
      bankSwift: merged.bankSwift,
      footerMessage: merged.footerMessage,
      defaultCurrency: merged.defaultCurrency,
      defaultTaxRate: merged.defaultTaxRate,
      defaultTaxEnabled: merged.defaultTaxEnabled,
      defaultPaymentTerms: merged.defaultPaymentTerms,
      showPaymentQr: merged.showPaymentQr,
      qrMode: merged.qrMode,
      customQrUrl: merged.customQrUrl,
      qrCaption: merged.qrCaption,
      adminPasswordHash: merged.adminPasswordHash,
      adminPasswordSalt: merged.adminPasswordSalt,
    },
    create: {
      id: "default",
      studioName: merged.studioName,
      logoUrl: merged.logoUrl,
      email: merged.email,
      phone: merged.phone,
      address: merged.address,
      country: merged.country,
      upiId: merged.upiId,
      bankName: merged.bankName,
      bankAccountName: merged.bankAccountName,
      bankAccountNumber: merged.bankAccountNumber,
      bankIfsc: merged.bankIfsc,
      bankSwift: merged.bankSwift,
      footerMessage: merged.footerMessage,
      defaultCurrency: merged.defaultCurrency,
      defaultTaxRate: merged.defaultTaxRate,
      defaultTaxEnabled: merged.defaultTaxEnabled,
      defaultPaymentTerms: merged.defaultPaymentTerms,
      showPaymentQr: merged.showPaymentQr,
      qrMode: merged.qrMode,
      customQrUrl: merged.customQrUrl,
      qrCaption: merged.qrCaption,
      adminPasswordHash: merged.adminPasswordHash,
      adminPasswordSalt: merged.adminPasswordSalt,
    },
  });

  return {
    ...merged,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const { hash, salt } = hashPassword(newPassword);
  await prisma.studioSettings.upsert({
    where: { id: "default" },
    update: {
      adminPasswordHash: hash,
      adminPasswordSalt: salt,
    },
    create: {
      id: "default",
      adminPasswordHash: hash,
      adminPasswordSalt: salt,
      studioName: DEFAULT_SETTINGS.studioName,
    },
  });
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const settings = await prisma.studioSettings.findUnique({
      where: { id: "default" },
      select: { adminPasswordHash: true, adminPasswordSalt: true },
    });

    if (settings?.adminPasswordHash && settings?.adminPasswordSalt) {
      return verifyPassword(password, settings.adminPasswordHash, settings.adminPasswordSalt);
    }
  } catch (err) {
    console.warn("verifyAdminPassword database check failed, checking env", err);
  }

  // Fallback to environment variable ADMIN_PASSWORD
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && envPassword.trim().length > 0) {
    return password === envPassword.trim();
  }

  // Development default if no password set anywhere
  return password === "admin123";
}

export async function hasAdminPasswordSet(): Promise<boolean> {
  try {
    const settings = await prisma.studioSettings.findUnique({
      where: { id: "default" },
      select: { adminPasswordHash: true },
    });
    if (settings?.adminPasswordHash) return true;
  } catch {}

  const envPassword = process.env.ADMIN_PASSWORD;
  return Boolean(envPassword && envPassword.trim().length > 0);
}

// ----------------------------------------------------
// Clients Management
// ----------------------------------------------------

export async function getClients(query?: string): Promise<Client[]> {
  try {
    const where: any = {};
    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const records = await prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
    });

    if (records.length === 0 && !query) {
      // Seed default clients
      await Promise.all(
        DEFAULT_CLIENTS.map((c) =>
          prisma.client.upsert({
            where: { id: c.id },
            update: {},
            create: {
              id: c.id,
              name: c.name,
              company: c.company || null,
              email: c.email || null,
              phone: c.phone || null,
              address: c.address || null,
              country: c.country || "India",
              notes: c.notes || null,
            },
          })
        )
      );
      const seeded = await prisma.client.findMany({ orderBy: { name: "asc" } });
      return seeded.map((r) => ({
        id: r.id,
        name: r.name,
        company: r.company || "",
        email: r.email || "",
        phone: r.phone || "",
        address: r.address || "",
        country: r.country || "India",
        notes: r.notes || "",
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }

    return records.map((r) => ({
      id: r.id,
      name: r.name,
      company: r.company || "",
      email: r.email || "",
      phone: r.phone || "",
      address: r.address || "",
      country: r.country || "India",
      notes: r.notes || "",
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.warn("Prisma getClients failed:", err);
    return DEFAULT_CLIENTS;
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  try {
    const rec = await prisma.client.findUnique({ where: { id } });
    if (!rec) return null;
    return {
      id: rec.id,
      name: rec.name,
      company: rec.company || "",
      email: rec.email || "",
      phone: rec.phone || "",
      address: rec.address || "",
      country: rec.country || "India",
      notes: rec.notes || "",
      createdAt: rec.createdAt.toISOString(),
      updatedAt: rec.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveClient(data: Partial<Client>): Promise<Client> {
  const name = (data.name || "").trim();
  if (!name) throw new Error("Client name is required");

  if (data.id) {
    const updated = await prisma.client.update({
      where: { id: data.id },
      data: {
        name,
        company: (data.company || "").trim() || null,
        email: (data.email || "").trim() || null,
        phone: (data.phone || "").trim() || null,
        address: (data.address || "").trim() || null,
        country: (data.country || "India").trim(),
        notes: (data.notes || "").trim() || null,
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      company: updated.company || "",
      email: updated.email || "",
      phone: updated.phone || "",
      address: updated.address || "",
      country: updated.country || "India",
      notes: updated.notes || "",
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // Create new client
  const created = await prisma.client.create({
    data: {
      name,
      company: (data.company || "").trim() || null,
      email: (data.email || "").trim() || null,
      phone: (data.phone || "").trim() || null,
      address: (data.address || "").trim() || null,
      country: (data.country || "India").trim(),
      notes: (data.notes || "").trim() || null,
    },
  });

  return {
    id: created.id,
    name: created.name,
    company: created.company || "",
    email: created.email || "",
    phone: created.phone || "",
    address: created.address || "",
    country: created.country || "India",
    notes: created.notes || "",
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function deleteClient(id: string): Promise<void> {
  await prisma.client.delete({ where: { id } });
}

// ----------------------------------------------------
// Service Presets Management
// ----------------------------------------------------

export async function getServices(): Promise<ServicePreset[]> {
  try {
    const records = await prisma.servicePreset.findMany({ orderBy: { order: "asc" } });
    if (records.length === 0) {
      // Seed default service presets
      await Promise.all(
        DEFAULT_SERVICES.map((s) =>
          prisma.servicePreset.upsert({
            where: { id: s.id },
            update: {},
            create: {
              id: s.id,
              name: s.name,
              description: s.description || null,
              defaultUnit: s.defaultUnit,
              defaultPrice: s.defaultPrice,
              currency: s.currency,
              order: s.order,
            },
          })
        )
      );
      const seeded = await prisma.servicePreset.findMany({ orderBy: { order: "asc" } });
      return seeded.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || "",
        defaultUnit: r.defaultUnit,
        defaultPrice: r.defaultPrice,
        currency: (r.currency as any) || "INR",
        order: r.order,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }

    return records.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      defaultUnit: r.defaultUnit,
      defaultPrice: r.defaultPrice,
      currency: (r.currency as any) || "INR",
      order: r.order,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.warn("Prisma getServices failed:", err);
    return DEFAULT_SERVICES;
  }
}

export async function getServicePresets(): Promise<ServicePreset[]> {
  return getServices();
}

export async function saveService(data: Partial<ServicePreset>): Promise<ServicePreset> {
  const name = (data.name || "").trim();
  if (!name) throw new Error("Service name is required");

  if (data.id) {
    const updated = await prisma.servicePreset.update({
      where: { id: data.id },
      data: {
        name,
        description: (data.description || "").trim() || null,
        defaultUnit: (data.defaultUnit || "video").trim(),
        defaultPrice: Math.round(Number(data.defaultPrice) || 0),
        currency: data.currency || "INR",
        order: Number(data.order) || 0,
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || "",
      defaultUnit: updated.defaultUnit,
      defaultPrice: updated.defaultPrice,
      currency: (updated.currency as any) || "INR",
      order: updated.order,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const created = await prisma.servicePreset.create({
    data: {
      name,
      description: (data.description || "").trim() || null,
      defaultUnit: (data.defaultUnit || "video").trim(),
      defaultPrice: Math.round(Number(data.defaultPrice) || 0),
      currency: data.currency || "INR",
      order: Number(data.order) || 0,
    },
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description || "",
    defaultUnit: created.defaultUnit,
    defaultPrice: created.defaultPrice,
    currency: (created.currency as any) || "INR",
    order: created.order,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function saveServicePreset(data: Partial<ServicePreset>): Promise<ServicePreset> {
  return saveService(data);
}

export async function deleteService(id: string): Promise<void> {
  await prisma.servicePreset.delete({ where: { id } });
}

export async function deleteServicePreset(id: string): Promise<void> {
  return deleteService(id);
}

// ----------------------------------------------------
// Invoices Management
// ----------------------------------------------------

/**
 * Preview next invoice number without incrementing sequence: SBX-YYYY-001
 */
export async function getNextInvoiceNumber(targetYear?: number): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  try {
    const counter = await prisma.invoiceCounter.findUnique({
      where: { year },
    });

    const invoices = await prisma.invoice.findMany({
      where: { number: { startsWith: `SBX-${year}-` } },
      select: { number: true },
    });

    let maxSeq = counter?.lastCount || 0;
    for (const inv of invoices) {
      const parsed = parseInvoiceNumber(inv.number);
      if (parsed && parsed.year === year && parsed.sequence > maxSeq) {
        maxSeq = parsed.sequence;
      }
    }

    return formatInvoiceNumber(year, maxSeq + 1);
  } catch (err) {
    console.warn("getNextInvoiceNumber error, returning fallback:", err);
    return formatInvoiceNumber(year, 1);
  }
}

export async function getInvoices(filters?: {
  query?: string;
  status?: string;
  sort?: string;
}): Promise<Invoice[]> {
  const records = await prisma.invoice.findMany({
    include: { items: { orderBy: { order: "asc" } } },
    orderBy: { date: "desc" },
  });

  let list = records.map(mapPrismaInvoice);

  // Compute status against due date
  list = list.map((inv) => {
    const computed = getComputedStatus(inv.status, inv.dueDate);
    return computed !== inv.status ? { ...inv, status: computed } : inv;
  });

  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    list = list.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.clientCompany && inv.clientCompany.toLowerCase().includes(q)) ||
        (inv.clientEmail && inv.clientEmail.toLowerCase().includes(q))
    );
  }

  if (filters?.status && filters.status !== "All") {
    list = list.filter((inv) => inv.status === filters.status);
  }

  const sort = filters?.sort || "date-desc";
  list.sort((a, b) => {
    if (sort === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sort === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sort === "due-asc") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (sort === "amount-desc") return b.grandTotal - a.grandTotal;
    if (sort === "amount-asc") return a.grandTotal - b.grandTotal;
    if (sort === "number-desc") return b.number.localeCompare(a.number);
    if (sort === "number-asc") return a.number.localeCompare(b.number);
    return 0;
  });

  return list;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const rec = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!rec) return null;
  return mapPrismaInvoice(rec);
}

export async function getInvoiceByNumber(number: string): Promise<Invoice | null> {
  const rec = await prisma.invoice.findUnique({
    where: { number },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!rec) return null;
  return mapPrismaInvoice(rec);
}

export async function getInvoiceByPublicToken(token: string): Promise<Invoice | null> {
  const rec = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!rec || !rec.publicLinkEnabled) return null;
  return mapPrismaInvoice(rec);
}

/**
 * Creates an invoice inside an atomic database transaction.
 * Generates unique sequential number (SBX-YYYY-001) row-locked by InvoiceCounter.
 */
export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  const now = new Date();
  const nowIso = now.toISOString();
  const id = `inv_${crypto.randomBytes(8).toString("hex")}`;
  const publicToken = crypto.randomBytes(16).toString("hex");

  const invoiceDate = data.date ? new Date(data.date) : now;
  const year = isNaN(invoiceDate.getFullYear()) ? now.getFullYear() : invoiceDate.getFullYear();

  return await prisma.$transaction(async (tx) => {
    let invoiceNumber = (data.number || "").trim();

    if (!invoiceNumber) {
      // Row-lock and atomically increment counter for the given year
      const counter = await tx.invoiceCounter.upsert({
        where: { year },
        update: { lastCount: { increment: 1 } },
        create: { year, lastCount: 1 },
      });

      // Guard: Ensure sequence is higher than any pre-existing invoice with SBX-YYYY-XXX
      const existingInvoices = await tx.invoice.findMany({
        where: { number: { startsWith: `SBX-${year}-` } },
        select: { number: true },
      });

      let maxSeq = 0;
      for (const inv of existingInvoices) {
        const parsed = parseInvoiceNumber(inv.number);
        if (parsed && parsed.year === year && parsed.sequence > maxSeq) {
          maxSeq = parsed.sequence;
        }
      }

      let seq = counter.lastCount;
      if (seq <= maxSeq) {
        seq = maxSeq + 1;
        await tx.invoiceCounter.update({
          where: { year },
          data: { lastCount: seq },
        });
      }

      invoiceNumber = formatInvoiceNumber(year, seq);
    } else {
      // Custom number supplied: check uniqueness in transaction
      const existing = await tx.invoice.findUnique({
        where: { number: invoiceNumber },
      });
      if (existing) {
        throw new Error(`Invoice number "${invoiceNumber}" already exists. Please choose a unique invoice number.`);
      }

      // Synchronize counter if custom number has higher sequence
      const parsed = parseInvoiceNumber(invoiceNumber);
      if (parsed && parsed.year === year) {
        const counter = await tx.invoiceCounter.upsert({
          where: { year },
          update: {},
          create: { year, lastCount: parsed.sequence },
        });
        if (counter.lastCount < parsed.sequence) {
          await tx.invoiceCounter.update({
            where: { year },
            data: { lastCount: parsed.sequence },
          });
        }
      }
    }

    const totals = calculateInvoiceTotals(data);
    let status = data.status || "Draft";
    status = getComputedStatus(status, data.dueDate || nowIso);

    const created = await tx.invoice.create({
      data: {
        id,
        number: invoiceNumber,
        clientId: data.clientId || null,
        clientName: (data.clientName || "").trim(),
        clientCompany: (data.clientCompany || "").trim() || null,
        clientEmail: (data.clientEmail || "").trim() || null,
        clientPhone: (data.clientPhone || "").trim() || null,
        clientAddress: (data.clientAddress || "").trim() || null,
        clientCountry: (data.clientCountry || "India").trim() || "India",
        date: new Date(data.date || nowIso.split("T")[0]),
        dueDate: new Date(data.dueDate || nowIso.split("T")[0]),
        currency: data.currency || "INR",
        status,
        paymentInstructions: data.paymentInstructions || null,
        footerNotes: data.footerNotes || null,
        subtotal: totals.subtotal,
        discountType: data.discountType || "percent",
        discountValue: Math.round(Number(data.discountValue) || 0),
        discountAmount: totals.discountAmount,
        taxEnabled: Boolean(data.taxEnabled),
        taxRate: Math.round(Number(data.taxRate) || 0),
        taxAmount: totals.taxAmount,
        extraCharges: totals.extraCharges,
        extraChargesLabel: data.extraChargesLabel || "Extra / Rush Fee",
        grandTotal: totals.grandTotal,
        advancePaid: totals.advancePaid,
        balanceDue: totals.balanceDue,
        publicToken,
        publicLinkEnabled: data.publicLinkEnabled ?? true,
        showPaymentQr: data.showPaymentQr ?? true,
        sentAt: data.status === "Sent" ? now : null,
        items: {
          create: totals.items.map((it, idx) => ({
            name: it.name,
            description: it.description || null,
            quantity: it.quantity,
            unit: it.unit || "video",
            unitPrice: it.unitPrice,
            total: it.total,
            order: it.order ?? idx,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    // Auto-save client if new
    if (created.clientName) {
      const existingClient = await tx.client.findFirst({
        where: { name: { equals: created.clientName, mode: "insensitive" } },
      });
      if (!existingClient) {
        await tx.client.create({
          data: {
            name: created.clientName,
            company: created.clientCompany || null,
            email: created.clientEmail || null,
            phone: created.clientPhone || null,
            address: created.clientAddress || null,
            country: created.clientCountry || "India",
          },
        });
      }
    }

    return mapPrismaInvoice(created);
  });
}

/**
 * Updates an invoice and its items atomically inside a database transaction.
 */
export async function updateInvoice(
  id: string,
  data: Partial<Invoice>
): Promise<Invoice> {
  const existing = await getInvoiceById(id);
  if (!existing) {
    throw new Error(`Invoice with id ${id} not found`);
  }

  const targetNumber = (data.number ? data.number.trim() : existing.number);

  return await prisma.$transaction(async (tx) => {
    if (targetNumber.toLowerCase() !== existing.number.toLowerCase()) {
      const isDuplicate = await tx.invoice.findFirst({
        where: {
          id: { not: id },
          number: { equals: targetNumber, mode: "insensitive" },
        },
      });
      if (isDuplicate) {
        throw new Error(`Invoice number "${targetNumber}" already exists. Please choose a unique invoice number.`);
      }
    }

    const mergedData = { ...existing, ...data };
    const totals = calculateInvoiceTotals(mergedData);

    let status = data.status || existing.status;
    status = getComputedStatus(status, mergedData.dueDate);

    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const updated = await tx.invoice.update({
      where: { id },
      data: {
        number: targetNumber,
        clientId: data.clientId !== undefined ? data.clientId : existing.clientId,
        clientName: (data.clientName ?? existing.clientName).trim(),
        clientCompany: (data.clientCompany ?? existing.clientCompany).trim() || null,
        clientEmail: (data.clientEmail ?? existing.clientEmail).trim() || null,
        clientPhone: (data.clientPhone ?? existing.clientPhone).trim() || null,
        clientAddress: (data.clientAddress ?? existing.clientAddress).trim() || null,
        clientCountry: (data.clientCountry ?? existing.clientCountry).trim() || "India",
        date: new Date(data.date || existing.date),
        dueDate: new Date(data.dueDate || existing.dueDate),
        currency: data.currency || existing.currency,
        status,
        paymentInstructions: data.paymentInstructions !== undefined ? data.paymentInstructions : existing.paymentInstructions,
        footerNotes: data.footerNotes !== undefined ? data.footerNotes : existing.footerNotes,
        subtotal: totals.subtotal,
        discountType: data.discountType || existing.discountType,
        discountValue: Math.round(Number(data.discountValue ?? existing.discountValue)),
        discountAmount: totals.discountAmount,
        taxEnabled: Boolean(data.taxEnabled ?? existing.taxEnabled),
        taxRate: Math.round(Number(data.taxRate ?? existing.taxRate)),
        taxAmount: totals.taxAmount,
        extraCharges: totals.extraCharges,
        extraChargesLabel: data.extraChargesLabel ?? existing.extraChargesLabel,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advancePaid,
        balanceDue: totals.balanceDue,
        publicLinkEnabled: data.publicLinkEnabled ?? existing.publicLinkEnabled,
        showPaymentQr: data.showPaymentQr ?? existing.showPaymentQr ?? true,
        sentAt: status === "Sent" && !existing.sentAt ? new Date() : existing.sentAt ? new Date(existing.sentAt) : null,
        items: {
          create: totals.items.map((it, idx) => ({
            name: it.name,
            description: it.description || null,
            quantity: it.quantity,
            unit: it.unit || "video",
            unitPrice: it.unitPrice,
            total: it.total,
            order: it.order ?? idx,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return mapPrismaInvoice(updated);
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  await prisma.invoice.delete({ where: { id } });
}

export const markInvoicePaid = async (id: string) => markInvoiceAsPaid(id);

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  const existing = await getInvoiceById(id);
  if (!existing) {
    throw new Error(`Invoice with id ${id} not found`);
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: "Paid",
      advancePaid: existing.grandTotal,
      balanceDue: 0,
    },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return mapPrismaInvoice(updated);
}

export async function duplicateInvoice(id: string): Promise<Invoice> {
  const existing = await getInvoiceById(id);
  if (!existing) {
    throw new Error(`Invoice with id ${id} not found`);
  }

  const nextNumber = await getNextInvoiceNumber();
  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const duplicatedData: Partial<Invoice> = {
    ...existing,
    id: undefined,
    number: nextNumber,
    date: today,
    dueDate,
    status: "Draft",
    advancePaid: 0,
    sentAt: null,
    items: existing.items.map((it) => ({ ...it, id: undefined })),
  };

  return await createInvoice(duplicatedData);
}

// ----------------------------------------------------
// Analytics & Dashboard Stats
// ----------------------------------------------------

export type DashboardStats = {
  totalInvoiced: number;
  totalReceived: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  countOverdue: number;
  totalInvoices: number;
  currency: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  return getInvoicingStats();
}

export async function getInvoicingStats(): Promise<DashboardStats> {
  const settings = await getStudioSettings();
  const invoices = await getInvoices();

  let totalInvoiced = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let countOverdue = 0;

  for (const inv of invoices) {
    if (inv.status !== "Cancelled") {
      totalInvoiced += inv.grandTotal;
    }
    if (inv.status === "Paid") {
      totalReceived += inv.grandTotal;
    } else if (inv.status === "Partially Paid") {
      totalReceived += inv.advancePaid;
      totalOutstanding += inv.balanceDue;
    } else if (inv.status === "Overdue") {
      totalOutstanding += inv.balanceDue;
      totalOverdue += inv.balanceDue;
      countOverdue += 1;
    } else if (inv.status !== "Cancelled") {
      totalOutstanding += inv.balanceDue;
    }
  }

  return {
    totalInvoiced,
    totalReceived,
    totalRevenue: totalReceived,
    totalOutstanding,
    totalOverdue,
    countOverdue,
    totalInvoices: invoices.length,
    currency: settings.defaultCurrency,
  };
}

// ----------------------------------------------------
// Backup Export & Import (Pure Database)
// ----------------------------------------------------

export async function exportAllData() {
  const settings = await getStudioSettings();
  const safeSettings = { ...settings };
  delete safeSettings.adminPasswordHash;
  delete safeSettings.adminPasswordSalt;

  const clients = await getClients();
  const services = await getServices();
  const invoices = await getInvoices();

  return {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    settings: safeSettings,
    clients,
    services,
    invoices,
  };
}

export async function importAllData(data: any): Promise<void> {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup data format");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Settings
    if (data.settings) {
      await tx.studioSettings.upsert({
        where: { id: "default" },
        update: {
          studioName: data.settings.studioName,
          logoUrl: data.settings.logoUrl,
          email: data.settings.email,
          phone: data.settings.phone,
          address: data.settings.address,
          country: data.settings.country,
          upiId: data.settings.upiId,
          bankName: data.settings.bankName,
          bankAccountName: data.settings.bankAccountName,
          bankAccountNumber: data.settings.bankAccountNumber,
          bankIfsc: data.settings.bankIfsc,
          bankSwift: data.settings.bankSwift,
          footerMessage: data.settings.footerMessage,
          defaultCurrency: data.settings.defaultCurrency,
          defaultTaxRate: data.settings.defaultTaxRate,
          defaultTaxEnabled: data.settings.defaultTaxEnabled,
          defaultPaymentTerms: data.settings.defaultPaymentTerms,
          showPaymentQr: data.settings.showPaymentQr,
          qrMode: data.settings.qrMode,
          customQrUrl: data.settings.customQrUrl,
          qrCaption: data.settings.qrCaption,
        },
        create: {
          id: "default",
          studioName: data.settings.studioName || DEFAULT_SETTINGS.studioName,
          logoUrl: data.settings.logoUrl,
          email: data.settings.email,
          phone: data.settings.phone,
          address: data.settings.address,
          country: data.settings.country,
          upiId: data.settings.upiId,
          bankName: data.settings.bankName,
          bankAccountName: data.settings.bankAccountName,
          bankAccountNumber: data.settings.bankAccountNumber,
          bankIfsc: data.settings.bankIfsc,
          bankSwift: data.settings.bankSwift,
          footerMessage: data.settings.footerMessage,
          defaultCurrency: data.settings.defaultCurrency || "INR",
          defaultTaxRate: data.settings.defaultTaxRate || 0,
          defaultTaxEnabled: data.settings.defaultTaxEnabled || false,
          defaultPaymentTerms: data.settings.defaultPaymentTerms,
          showPaymentQr: data.settings.showPaymentQr ?? true,
          qrMode: data.settings.qrMode || "auto",
          customQrUrl: data.settings.customQrUrl,
          qrCaption: data.settings.qrCaption,
        },
      });
    }

    // 2. Clients
    if (Array.isArray(data.clients)) {
      for (const c of data.clients) {
        if (!c.name) continue;
        await tx.client.upsert({
          where: { id: c.id || `cli_${Date.now()}` },
          update: {
            name: c.name,
            company: c.company || null,
            email: c.email || null,
            phone: c.phone || null,
            address: c.address || null,
            country: c.country || "India",
            notes: c.notes || null,
          },
          create: {
            id: c.id || undefined,
            name: c.name,
            company: c.company || null,
            email: c.email || null,
            phone: c.phone || null,
            address: c.address || null,
            country: c.country || "India",
            notes: c.notes || null,
          },
        });
      }
    }

    // 3. Service Presets
    if (Array.isArray(data.services)) {
      for (const s of data.services) {
        if (!s.name) continue;
        await tx.servicePreset.upsert({
          where: { id: s.id || `srv_${Date.now()}` },
          update: {
            name: s.name,
            description: s.description || null,
            defaultUnit: s.defaultUnit || "video",
            defaultPrice: Math.round(Number(s.defaultPrice) || 0),
            currency: s.currency || "INR",
            order: Number(s.order) || 0,
          },
          create: {
            id: s.id || undefined,
            name: s.name,
            description: s.description || null,
            defaultUnit: s.defaultUnit || "video",
            defaultPrice: Math.round(Number(s.defaultPrice) || 0),
            currency: s.currency || "INR",
            order: Number(s.order) || 0,
          },
        });
      }
    }

    // 4. Invoices and Items
    if (Array.isArray(data.invoices)) {
      for (const inv of data.invoices) {
        if (!inv.number) continue;

        await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });

        const createdInv = await tx.invoice.upsert({
          where: { number: inv.number },
          update: {
            clientId: inv.clientId || null,
            clientName: inv.clientName || "",
            clientCompany: inv.clientCompany || null,
            clientEmail: inv.clientEmail || null,
            clientPhone: inv.clientPhone || null,
            clientAddress: inv.clientAddress || null,
            clientCountry: inv.clientCountry || "India",
            date: new Date(inv.date || new Date()),
            dueDate: new Date(inv.dueDate || new Date()),
            currency: inv.currency || "INR",
            status: inv.status || "Draft",
            paymentInstructions: inv.paymentInstructions || null,
            footerNotes: inv.footerNotes || null,
            subtotal: Math.round(Number(inv.subtotal) || 0),
            discountType: inv.discountType || "percent",
            discountValue: Math.round(Number(inv.discountValue) || 0),
            discountAmount: Math.round(Number(inv.discountAmount) || 0),
            taxEnabled: Boolean(inv.taxEnabled),
            taxRate: Math.round(Number(inv.taxRate) || 0),
            taxAmount: Math.round(Number(inv.taxAmount) || 0),
            extraCharges: Math.round(Number(inv.extraCharges) || 0),
            extraChargesLabel: inv.extraChargesLabel || null,
            grandTotal: Math.round(Number(inv.grandTotal) || 0),
            advancePaid: Math.round(Number(inv.advancePaid) || 0),
            balanceDue: Math.round(Number(inv.balanceDue) || 0),
            publicToken: inv.publicToken || crypto.randomBytes(16).toString("hex"),
            publicLinkEnabled: inv.publicLinkEnabled ?? true,
            showPaymentQr: inv.showPaymentQr ?? true,
            sentAt: inv.sentAt ? new Date(inv.sentAt) : null,
          },
          create: {
            id: inv.id || undefined,
            number: inv.number,
            clientId: inv.clientId || null,
            clientName: inv.clientName || "",
            clientCompany: inv.clientCompany || null,
            clientEmail: inv.clientEmail || null,
            clientPhone: inv.clientPhone || null,
            clientAddress: inv.clientAddress || null,
            clientCountry: inv.clientCountry || "India",
            date: new Date(inv.date || new Date()),
            dueDate: new Date(inv.dueDate || new Date()),
            currency: inv.currency || "INR",
            status: inv.status || "Draft",
            paymentInstructions: inv.paymentInstructions || null,
            footerNotes: inv.footerNotes || null,
            subtotal: Math.round(Number(inv.subtotal) || 0),
            discountType: inv.discountType || "percent",
            discountValue: Math.round(Number(inv.discountValue) || 0),
            discountAmount: Math.round(Number(inv.discountAmount) || 0),
            taxEnabled: Boolean(inv.taxEnabled),
            taxRate: Math.round(Number(inv.taxRate) || 0),
            taxAmount: Math.round(Number(inv.taxAmount) || 0),
            extraCharges: Math.round(Number(inv.extraCharges) || 0),
            extraChargesLabel: inv.extraChargesLabel || null,
            grandTotal: Math.round(Number(inv.grandTotal) || 0),
            advancePaid: Math.round(Number(inv.advancePaid) || 0),
            balanceDue: Math.round(Number(inv.balanceDue) || 0),
            publicToken: inv.publicToken || crypto.randomBytes(16).toString("hex"),
            publicLinkEnabled: inv.publicLinkEnabled ?? true,
            showPaymentQr: inv.showPaymentQr ?? true,
            sentAt: inv.sentAt ? new Date(inv.sentAt) : null,
          },
        });

        if (Array.isArray(inv.items)) {
          await tx.invoiceItem.createMany({
            data: inv.items.map((it: any, idx: number) => ({
              id: it.id || undefined,
              invoiceId: createdInv.id,
              name: it.name || "Item",
              description: it.description || null,
              quantity: Math.round(Number(it.quantity) || 1),
              unit: it.unit || "video",
              unitPrice: Math.round(Number(it.unitPrice) || 0),
              total: Math.round(Number(it.total) || 0),
              order: Number(it.order) ?? idx,
            })),
          });
        }
      }
    }
  });
}
