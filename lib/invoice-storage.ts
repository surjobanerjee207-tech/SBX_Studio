import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
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

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "invoicing-store.json");

interface InvoicingStoreData {
  settings: StudioSettings;
  clients: Client[];
  services: ServicePreset[];
  invoices: Invoice[];
}

const DEFAULT_SETTINGS: StudioSettings = {
  id: "default",
  studioName: "SBX Studio",
  logoUrl: "/icon.svg",
  email: "contact@sbxstudio.com",
  phone: "+91 7004844003",
  address: "Jamshedpur, Jharkhand",
  country: "India",
  upiId: "sbxstudio@upi",
  bankName: "HDFC Bank",
  bankAccountName: "SBX Studio",
  bankAccountNumber: "50200098765432",
  bankIfsc: "HDFC0001234",
  bankSwift: "HDFCINBBXXX",
  footerMessage: "Thank you for collaborating with SBX Studio. Every frame tells a story.",
  defaultCurrency: "INR",
  defaultTaxRate: 18,
  defaultTaxEnabled: false,
  defaultPaymentTerms:
    "50% advance to initiate edit. Remaining balance upon final video delivery. UPI / IMPS / Bank transfer accepted.",
  adminPasswordHash: "",
  adminPasswordSalt: "",
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SERVICES: ServicePreset[] = [
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
    description: "DaVinci Resolve cinematic look dev, balancing, and shot matching",
    defaultUnit: "video",
    defaultPrice: 2500,
    currency: "INR",
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_6",
    name: "VFX",
    description: "Chroma keying, screen replacement, rotoscoping, and cleanup",
    defaultUnit: "shot",
    defaultPrice: 4000,
    currency: "INR",
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_7",
    name: "Thumbnail Design",
    description: "High-CTR custom YouTube / Social thumbnail artwork",
    defaultUnit: "thumbnail",
    defaultPrice: 800,
    currency: "INR",
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_8",
    name: "Social Reel Editing",
    description: "Fast-paced vertical reel / TikTok / Shorts edit with subtitles",
    defaultUnit: "reel",
    defaultPrice: 1500,
    currency: "INR",
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_9",
    name: "YouTube Editing",
    description: "Full YouTube longform video editing with B-roll, zoom cuts, music",
    defaultUnit: "video",
    defaultPrice: 3000,
    currency: "INR",
    order: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv_10",
    name: "Custom Service",
    description: "Bespoke creative post-production work",
    defaultUnit: "service",
    defaultPrice: 1000,
    currency: "INR",
    order: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CLIENTS: Client[] = [
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

// Helper to check if PostgreSQL via Prisma is available
async function getPrismaClient() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    // Test connectivity
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (err) {
    return null;
  }
}

/**
 * Reads local JSON store with fallback initialization.
 */
async function readStore(): Promise<InvoicingStoreData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(STORE_PATH, "utf-8");
    const data = JSON.parse(content) as InvoicingStoreData;
    return {
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      clients: Array.isArray(data.clients) ? data.clients : DEFAULT_CLIENTS,
      services: Array.isArray(data.services) && data.services.length > 0 ? data.services : DEFAULT_SERVICES,
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
    };
  } catch {
    // If missing or invalid, initialize with defaults
    const initial: InvoicingStoreData = {
      settings: { ...DEFAULT_SETTINGS },
      clients: [...DEFAULT_CLIENTS],
      services: [...DEFAULT_SERVICES],
      invoices: [],
    };
    await writeStore(initial);
    return initial;
  }
}

/**
 * Writes to local JSON store atomically.
 */
async function writeStore(data: InvoicingStoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp.${Date.now()}`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tempPath, STORE_PATH);
}

// ----------------------------------------------------
// Studio Settings & Admin Password Management
// ----------------------------------------------------

export async function getStudioSettings(): Promise<StudioSettings> {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      const record = await prisma.studioSettings.findUnique({ where: { id: "default" } });
      if (record) {
        return {
          id: record.id,
          studioName: record.studioName,
          logoUrl: record.logoUrl || "",
          email: record.email || "",
          phone: record.phone || "",
          address: record.address || "",
          country: record.country || "India",
          upiId: record.upiId || "",
          bankName: record.bankName || "",
          bankAccountName: record.bankAccountName || "",
          bankAccountNumber: record.bankAccountNumber || "",
          bankIfsc: record.bankIfsc || "",
          bankSwift: record.bankSwift || "",
          footerMessage: record.footerMessage || "",
          defaultCurrency: (record.defaultCurrency as any) || "INR",
          defaultTaxRate: record.defaultTaxRate,
          defaultTaxEnabled: record.defaultTaxEnabled,
          defaultPaymentTerms: record.defaultPaymentTerms || "",
          adminPasswordHash: record.adminPasswordHash || undefined,
          adminPasswordSalt: record.adminPasswordSalt || undefined,
          updatedAt: record.updatedAt.toISOString(),
        };
      }
    } catch {
      // fallback to store
    }
  }

  const store = await readStore();
  return store.settings;
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

  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      await prisma.studioSettings.upsert({
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
          adminPasswordHash: merged.adminPasswordHash,
          adminPasswordSalt: merged.adminPasswordSalt,
        },
      });
    } catch {
      // continue to file sync
    }
  }

  const store = await readStore();
  store.settings = merged;
  await writeStore(store);
  return merged;
}

/**
 * Verify admin password: checks settings first, then env variable ADMIN_PASSWORD,
 * then default initial password "sbx2026".
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const settings = await getStudioSettings();

  // 1. If password set in settings DB
  if (settings.adminPasswordHash && settings.adminPasswordSalt) {
    return verifyPassword(password, settings.adminPasswordHash, settings.adminPasswordSalt);
  }

  // 2. If environment variable ADMIN_PASSWORD is set
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword) {
    return password === envPassword;
  }

  // 3. Initial default password for immediate first-time editor login
  return password === "sbx2026" || password === "admin";
}

/**
 * Set a new admin password in StudioSettings.
 */
export async function setAdminPassword(newPassword: string): Promise<void> {
  const { hash, salt } = hashPassword(newPassword);
  await updateStudioSettings({
    adminPasswordHash: hash,
    adminPasswordSalt: salt,
  });
}

// ----------------------------------------------------
// Clients Management
// ----------------------------------------------------

export async function getClients(): Promise<Client[]> {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      const records = await prisma.client.findMany({ orderBy: { name: "asc" } });
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
    } catch {}
  }

  const store = await readStore();
  return store.clients.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) || null;
}

export async function saveClient(clientData: Partial<Client>): Promise<Client> {
  const now = new Date().toISOString();
  const id = clientData.id || `cli_${crypto.randomBytes(6).toString("hex")}`;
  const client: Client = {
    id,
    name: (clientData.name || "").trim(),
    company: (clientData.company || "").trim(),
    email: (clientData.email || "").trim(),
    phone: (clientData.phone || "").trim(),
    address: (clientData.address || "").trim(),
    country: (clientData.country || "India").trim(),
    notes: (clientData.notes || "").trim(),
    createdAt: clientData.createdAt || now,
    updatedAt: now,
  };

  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      await prisma.client.upsert({
        where: { id },
        update: {
          name: client.name,
          company: client.company,
          email: client.email,
          phone: client.phone,
          address: client.address,
          country: client.country,
          notes: client.notes,
        },
        create: {
          id: client.id,
          name: client.name,
          company: client.company,
          email: client.email,
          phone: client.phone,
          address: client.address,
          country: client.country,
          notes: client.notes,
        },
      });
    } catch {}
  }

  const store = await readStore();
  const existingIdx = store.clients.findIndex((c) => c.id === id);
  if (existingIdx >= 0) {
    store.clients[existingIdx] = client;
  } else {
    store.clients.push(client);
  }
  await writeStore(store);
  return client;
}

export async function deleteClient(id: string): Promise<void> {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      await prisma.client.delete({ where: { id } });
    } catch {}
  }
  const store = await readStore();
  store.clients = store.clients.filter((c) => c.id !== id);
  await writeStore(store);
}

// ----------------------------------------------------
// Service Presets Management
// ----------------------------------------------------

export async function getServices(): Promise<ServicePreset[]> {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      const records = await prisma.servicePreset.findMany({ orderBy: { order: "asc" } });
      if (records.length > 0) {
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
      }
    } catch {}
  }

  const store = await readStore();
  return store.services.sort((a, b) => a.order - b.order);
}

export async function saveService(serviceData: Partial<ServicePreset>): Promise<ServicePreset> {
  const now = new Date().toISOString();
  const id = serviceData.id || `srv_${crypto.randomBytes(6).toString("hex")}`;
  const srv: ServicePreset = {
    id,
    name: (serviceData.name || "").trim(),
    description: (serviceData.description || "").trim(),
    defaultUnit: (serviceData.defaultUnit || "video").trim(),
    defaultPrice: Math.max(0, Math.round(Number(serviceData.defaultPrice) || 0)),
    currency: serviceData.currency || "INR",
    order: Number(serviceData.order) || 0,
    createdAt: serviceData.createdAt || now,
    updatedAt: now,
  };

  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      await prisma.servicePreset.upsert({
        where: { id },
        update: {
          name: srv.name,
          description: srv.description,
          defaultUnit: srv.defaultUnit,
          defaultPrice: srv.defaultPrice,
          currency: srv.currency,
          order: srv.order,
        },
        create: {
          id: srv.id,
          name: srv.name,
          description: srv.description,
          defaultUnit: srv.defaultUnit,
          defaultPrice: srv.defaultPrice,
          currency: srv.currency,
          order: srv.order,
        },
      });
    } catch {}
  }

  const store = await readStore();
  const existingIdx = store.services.findIndex((s) => s.id === id);
  if (existingIdx >= 0) {
    store.services[existingIdx] = srv;
  } else {
    store.services.push(srv);
  }
  await writeStore(store);
  return srv;
}

export async function deleteService(id: string): Promise<void> {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      await prisma.servicePreset.delete({ where: { id } });
    } catch {}
  }
  const store = await readStore();
  store.services = store.services.filter((s) => s.id !== id);
  await writeStore(store);
}

// ----------------------------------------------------
// Invoices Management
// ----------------------------------------------------

/**
 * Auto-generate next invoice number: SBX-YYYY-001 (resets yearly)
 */
export async function getNextInvoiceNumber(targetYear?: number): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  const invoices = await getInvoices();

  let maxSeq = 0;
  for (const inv of invoices) {
    const parsed = parseInvoiceNumber(inv.number);
    if (parsed && parsed.year === year) {
      if (parsed.sequence > maxSeq) {
        maxSeq = parsed.sequence;
      }
    }
  }

  return formatInvoiceNumber(year, maxSeq + 1);
}

export async function getInvoices(filters?: {
  query?: string;
  status?: string;
  sort?: string;
}): Promise<Invoice[]> {
  const store = await readStore();
  let list = [...store.invoices];

  // Refresh computed overdue status on read
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

  // Sort
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
  const invoices = await getInvoices();
  const found = invoices.find((inv) => inv.id === id);
  if (!found) return null;
  return found;
}

export async function getInvoiceByNumber(number: string): Promise<Invoice | null> {
  const invoices = await getInvoices();
  return invoices.find((inv) => inv.number.toLowerCase() === number.toLowerCase()) || null;
}

export async function getInvoiceByPublicToken(token: string): Promise<Invoice | null> {
  const invoices = await getInvoices();
  const found = invoices.find((inv) => inv.publicToken === token);
  if (!found || !found.publicLinkEnabled) return null;
  return found;
}

export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  const now = new Date().toISOString();
  const id = `inv_${crypto.randomBytes(8).toString("hex")}`;
  const publicToken = crypto.randomBytes(16).toString("hex");

  const number = data.number || (await getNextInvoiceNumber());
  const totals = calculateInvoiceTotals(data);

  // Compute status
  let status = data.status || "Draft";
  status = getComputedStatus(status, data.dueDate || now);

  const invoice: Invoice = {
    id,
    number,
    clientId: data.clientId || null,
    clientName: (data.clientName || "").trim(),
    clientCompany: (data.clientCompany || "").trim(),
    clientEmail: (data.clientEmail || "").trim(),
    clientPhone: (data.clientPhone || "").trim(),
    clientAddress: (data.clientAddress || "").trim(),
    clientCountry: (data.clientCountry || "India").trim(),
    date: data.date || now.split("T")[0],
    dueDate: data.dueDate || now.split("T")[0],
    currency: data.currency || "INR",
    status,
    paymentInstructions: data.paymentInstructions || "",
    footerNotes: data.footerNotes || "",
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
    sentAt: data.status === "Sent" ? now : null,
    createdAt: now,
    updatedAt: now,
    items: totals.items,
  };

  const store = await readStore();
  store.invoices.unshift(invoice);
  await writeStore(store);

  // Also auto-save client if client name provided and not in client list
  if (invoice.clientName) {
    const existingClient = store.clients.find(
      (c) => c.name.toLowerCase() === invoice.clientName.toLowerCase()
    );
    if (!existingClient) {
      await saveClient({
        name: invoice.clientName,
        company: invoice.clientCompany,
        email: invoice.clientEmail,
        phone: invoice.clientPhone,
        address: invoice.clientAddress,
        country: invoice.clientCountry,
      });
    }
  }

  return invoice;
}

export async function updateInvoice(
  id: string,
  data: Partial<Invoice>
): Promise<Invoice> {
  const existing = await getInvoiceById(id);
  if (!existing) {
    throw new Error(`Invoice with id ${id} not found`);
  }

  const now = new Date().toISOString();
  const mergedData = { ...existing, ...data };
  const totals = calculateInvoiceTotals(mergedData);

  let status = data.status || existing.status;
  status = getComputedStatus(status, mergedData.dueDate);

  const updated: Invoice = {
    ...existing,
    ...data,
    id: existing.id,
    number: (data.number || existing.number).trim(),
    clientName: (data.clientName ?? existing.clientName).trim(),
    clientCompany: (data.clientCompany ?? existing.clientCompany).trim(),
    clientEmail: (data.clientEmail ?? existing.clientEmail).trim(),
    clientPhone: (data.clientPhone ?? existing.clientPhone).trim(),
    clientAddress: (data.clientAddress ?? existing.clientAddress).trim(),
    clientCountry: (data.clientCountry ?? existing.clientCountry).trim(),
    date: data.date || existing.date,
    dueDate: data.dueDate || existing.dueDate,
    currency: data.currency || existing.currency,
    status,
    paymentInstructions: data.paymentInstructions ?? existing.paymentInstructions,
    footerNotes: data.footerNotes ?? existing.footerNotes,
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
    publicToken: existing.publicToken || crypto.randomBytes(16).toString("hex"),
    publicLinkEnabled: data.publicLinkEnabled ?? existing.publicLinkEnabled,
    sentAt: status === "Sent" && !existing.sentAt ? now : existing.sentAt,
    updatedAt: now,
    items: totals.items,
  };

  const store = await readStore();
  const idx = store.invoices.findIndex((inv) => inv.id === id);
  if (idx >= 0) {
    store.invoices[idx] = updated;
  } else {
    store.invoices.unshift(updated);
  }
  await writeStore(store);

  return updated;
}

export async function deleteInvoice(id: string): Promise<void> {
  const store = await readStore();
  store.invoices = store.invoices.filter((inv) => inv.id !== id);
  await writeStore(store);
}

export async function duplicateInvoice(id: string): Promise<Invoice> {
  const original = await getInvoiceById(id);
  if (!original) throw new Error("Original invoice not found");

  const nextNumber = await getNextInvoiceNumber();
  const today = new Date();
  const due = new Date();
  due.setDate(today.getDate() + 7);

  const duplicated = await createInvoice({
    ...original,
    id: undefined,
    number: nextNumber,
    date: today.toISOString().split("T")[0],
    dueDate: due.toISOString().split("T")[0],
    status: "Draft",
    advancePaid: 0,
    items: original.items.map((it) => ({ ...it, id: undefined })),
  });

  return duplicated;
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  const inv = await getInvoiceById(id);
  if (!inv) throw new Error("Invoice not found");

  return updateInvoice(id, {
    status: "Paid",
    advancePaid: inv.grandTotal,
    balanceDue: 0,
  });
}

// ----------------------------------------------------
// Dashboard Metrics (Phase 2)
// ----------------------------------------------------

export interface DashboardStats {
  totalInvoices: number;
  totalInvoiced: number;
  totalReceived: number;
  totalOutstanding: number;
  totalOverdue: number;
  countOverdue: number;
  currency: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const invoices = await getInvoices();
  const settings = await getStudioSettings();

  let totalInvoiced = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let countOverdue = 0;

  for (const inv of invoices) {
    if (inv.status === "Cancelled") continue;

    totalInvoiced += inv.grandTotal;
    totalReceived += inv.advancePaid;
    totalOutstanding += inv.balanceDue;

    if (inv.status === "Overdue") {
      countOverdue += 1;
      totalOverdue += inv.balanceDue;
    }
  }

  return {
    totalInvoices: invoices.length,
    totalInvoiced,
    totalReceived,
    totalOutstanding,
    totalOverdue,
    countOverdue,
    currency: settings.defaultCurrency,
  };
}

// ----------------------------------------------------
// Backup Export & Import (Phase 3)
// ----------------------------------------------------

export async function exportAllData() {
  const store = await readStore();
  // Strip sensitive password hash from backup
  const safeSettings = { ...store.settings };
  delete safeSettings.adminPasswordHash;
  delete safeSettings.adminPasswordSalt;

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    settings: safeSettings,
    clients: store.clients,
    services: store.services,
    invoices: store.invoices,
  };
}

export async function importAllData(data: any): Promise<void> {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup data format");
  }

  const current = await readStore();
  const newStore: InvoicingStoreData = {
    settings: {
      ...current.settings,
      ...(data.settings || {}),
      // Preserve current admin credentials
      adminPasswordHash: current.settings.adminPasswordHash,
      adminPasswordSalt: current.settings.adminPasswordSalt,
    },
    clients: Array.isArray(data.clients) ? data.clients : current.clients,
    services: Array.isArray(data.services) ? data.services : current.services,
    invoices: Array.isArray(data.invoices) ? data.invoices : current.invoices,
  };

  await writeStore(newStore);
}
