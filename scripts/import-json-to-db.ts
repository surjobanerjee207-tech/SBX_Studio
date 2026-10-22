/**
 * scripts/import-json-to-db.ts
 *
 * One-time idempotent import script to migrate data from data/invoicing-store.json
 * into the PostgreSQL database via Prisma.
 * Safe to run multiple times without duplicating records.
 *
 * Usage:
 *   npx ts-node -r dotenv/config scripts/import-json-to-db.ts
 *   or: node scripts/import-json-to-db.js
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SBX STUDIO: JSON TO DATABASE IMPORT SCRIPT ===");

  const jsonPath = path.join(process.cwd(), "data", "invoicing-store.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Store file not found at ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  console.log("Reading data from data/invoicing-store.json...");

  await prisma.$transaction(async (tx) => {
    // 1. Studio Settings
    if (data.settings) {
      console.log("Importing Studio Settings...");
      await tx.studioSettings.upsert({
        where: { id: "default" },
        update: {
          studioName: data.settings.studioName || "SBX Studio",
          logoUrl: data.settings.logoUrl || null,
          email: data.settings.email || null,
          phone: data.settings.phone || null,
          address: data.settings.address || null,
          country: data.settings.country || "India",
          upiId: data.settings.upiId || null,
          bankName: data.settings.bankName || null,
          bankAccountName: data.settings.bankAccountName || null,
          bankAccountNumber: data.settings.bankAccountNumber || null,
          bankIfsc: data.settings.bankIfsc || null,
          bankSwift: data.settings.bankSwift || null,
          footerMessage: data.settings.footerMessage || null,
          defaultCurrency: data.settings.defaultCurrency || "INR",
          defaultTaxRate: Number(data.settings.defaultTaxRate) || 0,
          defaultTaxEnabled: Boolean(data.settings.defaultTaxEnabled),
          defaultPaymentTerms: data.settings.defaultPaymentTerms || null,
          showPaymentQr: data.settings.showPaymentQr ?? true,
          qrMode: data.settings.qrMode || "auto",
          customQrUrl: data.settings.customQrUrl || null,
          qrCaption: data.settings.qrCaption || "Scan to pay",
          adminPasswordHash: data.settings.adminPasswordHash || null,
          adminPasswordSalt: data.settings.adminPasswordSalt || null,
        },
        create: {
          id: "default",
          studioName: data.settings.studioName || "SBX Studio",
          logoUrl: data.settings.logoUrl || null,
          email: data.settings.email || null,
          phone: data.settings.phone || null,
          address: data.settings.address || null,
          country: data.settings.country || "India",
          upiId: data.settings.upiId || null,
          bankName: data.settings.bankName || null,
          bankAccountName: data.settings.bankAccountName || null,
          bankAccountNumber: data.settings.bankAccountNumber || null,
          bankIfsc: data.settings.bankIfsc || null,
          bankSwift: data.settings.bankSwift || null,
          footerMessage: data.settings.footerMessage || null,
          defaultCurrency: data.settings.defaultCurrency || "INR",
          defaultTaxRate: Number(data.settings.defaultTaxRate) || 0,
          defaultTaxEnabled: Boolean(data.settings.defaultTaxEnabled),
          defaultPaymentTerms: data.settings.defaultPaymentTerms || null,
          showPaymentQr: data.settings.showPaymentQr ?? true,
          qrMode: data.settings.qrMode || "auto",
          customQrUrl: data.settings.customQrUrl || null,
          qrCaption: data.settings.qrCaption || "Scan to pay",
          adminPasswordHash: data.settings.adminPasswordHash || null,
          adminPasswordSalt: data.settings.adminPasswordSalt || null,
        },
      });
      console.log("✓ Studio Settings imported successfully.");
    }

    // 2. Clients
    if (Array.isArray(data.clients) && data.clients.length > 0) {
      console.log(`Importing ${data.clients.length} Clients...`);
      for (const c of data.clients) {
        if (!c.name) continue;
        const clientId = c.id || `cli_${Date.now()}`;
        await tx.client.upsert({
          where: { id: clientId },
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
            id: clientId,
            name: c.name,
            company: c.company || null,
            email: c.email || null,
            phone: c.phone || null,
            address: c.address || null,
            country: c.country || "India",
            notes: c.notes || null,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          },
        });
      }
      console.log("✓ Clients imported successfully.");
    }

    // 3. Service Presets
    if (Array.isArray(data.services) && data.services.length > 0) {
      console.log(`Importing ${data.services.length} Service Presets...`);
      for (const s of data.services) {
        if (!s.name) continue;
        const srvId = s.id || `srv_${Date.now()}`;
        await tx.servicePreset.upsert({
          where: { id: srvId },
          update: {
            name: s.name,
            description: s.description || null,
            defaultUnit: s.defaultUnit || "video",
            defaultPrice: Math.round(Number(s.defaultPrice) || 0),
            currency: s.currency || "INR",
            order: Number(s.order) || 0,
          },
          create: {
            id: srvId,
            name: s.name,
            description: s.description || null,
            defaultUnit: s.defaultUnit || "video",
            defaultPrice: Math.round(Number(s.defaultPrice) || 0),
            currency: s.currency || "INR",
            order: Number(s.order) || 0,
          },
        });
      }
      console.log("✓ Service Presets imported successfully.");
    }

    // 4. Invoices & Line Items
    if (Array.isArray(data.invoices) && data.invoices.length > 0) {
      console.log(`Importing ${data.invoices.length} Invoices...`);
      const yearlyMaxSequences: Record<number, number> = {};

      for (const inv of data.invoices) {
        if (!inv.number) continue;

        // Parse sequence for counter initialization
        const match = inv.number.match(/SBX-(\d{4})-(\d+)/i);
        if (match) {
          const invYear = parseInt(match[1], 10);
          const invSeq = parseInt(match[2], 10);
          if (!yearlyMaxSequences[invYear] || invSeq > yearlyMaxSequences[invYear]) {
            yearlyMaxSequences[invYear] = invSeq;
          }
        }

        const invoiceId = inv.id || `inv_${Date.now()}`;
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });

        const createdInvoice = await tx.invoice.upsert({
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
            publicToken: inv.publicToken || undefined,
            publicLinkEnabled: inv.publicLinkEnabled ?? true,
            showPaymentQr: inv.showPaymentQr ?? true,
            sentAt: inv.sentAt ? new Date(inv.sentAt) : null,
          },
          create: {
            id: invoiceId,
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
            publicToken: inv.publicToken || undefined,
            publicLinkEnabled: inv.publicLinkEnabled ?? true,
            showPaymentQr: inv.showPaymentQr ?? true,
            sentAt: inv.sentAt ? new Date(inv.sentAt) : null,
            createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
          },
        });

        if (Array.isArray(inv.items)) {
          await tx.invoiceItem.createMany({
            data: inv.items.map((it: any, idx: number) => ({
              id: it.id || undefined,
              invoiceId: createdInvoice.id,
              name: it.name || "Service Item",
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

      // 5. Update Invoice Counters for each year
      for (const [yearStr, maxSeq] of Object.entries(yearlyMaxSequences)) {
        const year = parseInt(yearStr, 10);
        await tx.invoiceCounter.upsert({
          where: { year },
          update: {
            lastCount: maxSeq,
          },
          create: {
            year,
            lastCount: maxSeq,
          },
        });
        console.log(`✓ Initialized InvoiceCounter for ${year} at sequence ${maxSeq}`);
      }
      console.log("✓ Invoices and Line Items imported successfully.");
    }
  });

  console.log("\n=== DATA IMPORT COMPLETED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
