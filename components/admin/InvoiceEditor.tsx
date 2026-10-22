"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Invoice,
  InvoiceItem,
  StudioSettings,
  Client,
  ServicePreset,
  Currency,
  CURRENCY_SYMBOLS,
  INVOICE_STATUSES,
} from "@/lib/types/invoice";
import { calculateInvoiceTotals, formatMoney } from "@/lib/invoice-calc";
import { LiveInvoicePreview } from "./LiveInvoicePreview";

const CURRENCY_OPTIONS: { value: Currency; short: string; full: string }[] = [
  { value: "INR", short: "₹ INR", full: "INR (₹ - Indian Rupee)" },
  { value: "USD", short: "$ USD", full: "USD ($ - US Dollar)" },
  { value: "EUR", short: "€ EUR", full: "EUR (€ - Euro)" },
  { value: "GBP", short: "£ GBP", full: "GBP (£ - British Pound)" },
];

interface InvoiceEditorProps {
  initialInvoice?: Invoice;
  isNew?: boolean;
}

export function InvoiceEditor({ initialInvoice, isNew = false }: InvoiceEditorProps) {
  const router = useRouter();

  // Settings & Presets
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServicePreset[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [number, setNumber] = useState(initialInvoice?.number || "");
  const [clientId, setClientId] = useState<string | null>(initialInvoice?.clientId || null);
  const [clientName, setClientName] = useState(initialInvoice?.clientName || "");
  const [clientCompany, setClientCompany] = useState(initialInvoice?.clientCompany || "");
  const [clientEmail, setClientEmail] = useState(initialInvoice?.clientEmail || "");
  const [clientPhone, setClientPhone] = useState(initialInvoice?.clientPhone || "");
  const [clientAddress, setClientAddress] = useState(initialInvoice?.clientAddress || "");
  const [clientCountry, setClientCountry] = useState(initialInvoice?.clientCountry || "India");

  const todayStr = new Date().toISOString().split("T")[0];
  const inSevenDaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const [date, setDate] = useState(initialInvoice?.date || todayStr);
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || inSevenDaysStr);
  const [currency, setCurrency] = useState<Currency>(initialInvoice?.currency || "INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [status, setStatus] = useState(initialInvoice?.status || "Draft");

  // Items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            id: "item_1",
            name: "Video Editing",
            description: "Cinematic cut, pacing, storytelling & assembly",
            quantity: 1,
            unit: "video",
            unitPrice: 2000,
            total: 2000,
            order: 0,
          },
        ]
  );

  // Adjustments
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    initialInvoice?.discountType || "percent"
  );
  const [discountValue, setDiscountValue] = useState(initialInvoice?.discountValue || 0);
  const [taxEnabled, setTaxEnabled] = useState(initialInvoice?.taxEnabled || false);
  const [taxRate, setTaxRate] = useState(initialInvoice?.taxRate || 18);
  const [extraCharges, setExtraCharges] = useState(initialInvoice?.extraCharges || 0);
  const [extraChargesLabel, setExtraChargesLabel] = useState(
    initialInvoice?.extraChargesLabel || "Rush Turnaround Fee"
  );
  const [advancePaid, setAdvancePaid] = useState(initialInvoice?.advancePaid || 0);
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialInvoice?.paymentInstructions || ""
  );
  const [showPaymentQr, setShowPaymentQr] = useState<boolean>(
    initialInvoice?.showPaymentQr !== undefined ? initialInvoice.showPaymentQr : true
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // Locked Rule Confirmation modal
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const wasSentOrPaid =
    !isNew &&
    (initialInvoice?.status === "Sent" ||
      initialInvoice?.status === "Partially Paid" ||
      initialInvoice?.status === "Paid");

  // Fetch Studio Settings & Presets
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [settingsRes, clientsRes, servicesRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/admin/clients"),
          fetch("/api/admin/services"),
        ]);

        if (settingsRes.status === 401 || clientsRes.status === 401 || servicesRes.status === 401) {
          router.push("/admin/login");
          return;
        }

        const parseJsonSafe = async (res: Response) => {
          try {
            const txt = await res.text();
            return txt ? JSON.parse(txt) : {};
          } catch {
            return {};
          }
        };

        const [settingsData, clientsData, servicesData] = await Promise.all([
          parseJsonSafe(settingsRes),
          parseJsonSafe(clientsRes),
          parseJsonSafe(servicesRes),
        ]);

        if (settingsData?.settings) {
          setSettings(settingsData.settings);
          if (isNew) {
            setCurrency(settingsData.settings.defaultCurrency || "INR");
            setTaxRate(settingsData.settings.defaultTaxRate || 18);
            setTaxEnabled(settingsData.settings.defaultTaxEnabled || false);
            if (settingsData.settings.showPaymentQr !== undefined && initialInvoice?.showPaymentQr === undefined) {
              setShowPaymentQr(settingsData.settings.showPaymentQr);
            }
            if (!paymentInstructions) {
              setPaymentInstructions(settingsData.settings.defaultPaymentTerms || "");
            }
          }
        }

        if (clientsData?.clients) setClients(clientsData.clients);
        if (servicesData?.services) setServices(servicesData.services);

        // If new, get next invoice number
        if (isNew && !number) {
          const invRes = await fetch("/api/admin/invoices");
          if (invRes.status === 401) {
            router.push("/admin/login");
            return;
          }
          const invData = await parseJsonSafe(invRes);
          if (invData?.nextNumber) setNumber(invData.nextNumber);
        }
      } catch (err: any) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [isNew]);

  // Handle client selection from existing client dropdown
  const handleClientSelect = (cid: string) => {
    if (!cid) return;
    const found = clients.find((c) => c.id === cid);
    if (found) {
      setClientId(found.id || null);
      setClientName(found.name);
      setClientCompany(found.company || "");
      setClientEmail(found.email || "");
      setClientPhone(found.phone || "");
      setClientAddress(found.address || "");
      setClientCountry(found.country || "India");
    }
  };

  // Add Service Preset item
  const handleAddPreset = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;

    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: srv.name,
      description: srv.description || "",
      quantity: 1,
      unit: srv.defaultUnit || "video",
      unitPrice: srv.defaultPrice || 0,
      total: srv.defaultPrice || 0,
      order: items.length,
    };
    setItems([...items, newItem]);
  };

  // Add Custom Item
  const handleAddCustomItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: "Custom Video Service",
      description: "",
      quantity: 1,
      unit: "video",
      unitPrice: 1000,
      total: 1000,
      order: items.length,
    };
    setItems([...items, newItem]);
  };

  // Update item field
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === "quantity") {
      const q = Math.max(1, Math.round(Number(value) || 1));
      current.quantity = q;
      current.total = q * current.unitPrice;
    } else if (field === "unitPrice") {
      const p = Math.max(0, Math.round(Number(value) || 0));
      current.unitPrice = p;
      current.total = current.quantity * p;
    } else {
      (current as any)[field] = value;
    }

    updated[index] = current;
    setItems(updated);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length <= 1) {
      alert("An invoice must contain at least one line item.");
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Reorder items
  const moveItem = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setItems(updated.map((item, idx) => ({ ...item, order: idx })));
  };

  // Live calculation object for current form state
  const computedTotals = calculateInvoiceTotals({
    items,
    discountType,
    discountValue,
    taxEnabled,
    taxRate,
    extraCharges,
    advancePaid,
  });

  const previewInvoice: Invoice = {
    id: initialInvoice?.id || "preview_id",
    number: number || "SBX-2026-001",
    clientId,
    clientName: clientName || "Client Name",
    clientCompany,
    clientEmail,
    clientPhone,
    clientAddress,
    clientCountry,
    date,
    dueDate,
    currency,
    status,
    paymentInstructions,
    footerNotes: "",
    subtotal: computedTotals.subtotal,
    discountType,
    discountValue,
    discountAmount: computedTotals.discountAmount,
    taxEnabled,
    taxRate,
    taxAmount: computedTotals.taxAmount,
    extraCharges: computedTotals.extraCharges,
    extraChargesLabel,
    grandTotal: computedTotals.grandTotal,
    advancePaid: computedTotals.advancePaid,
    balanceDue: computedTotals.balanceDue,
    publicToken: initialInvoice?.publicToken || "preview-token",
    publicLinkEnabled: true,
    showPaymentQr,
    createdAt: initialInvoice?.createdAt || todayStr,
    updatedAt: todayStr,
    items: computedTotals.items,
  };

  // Save handler
  const handleSave = async (overrideStatus?: string) => {
    // Check locked rule: if editing a Sent/Paid invoice and haven't confirmed unlock
    if (wasSentOrPaid && !isUnlocked) {
      setShowLockedModal(true);
      return;
    }

    setError(null);
    setSuccessMsg(null);

    // Validation checks
    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!number.trim()) {
      setError("Invoice number is required.");
      return;
    }

    if (!items || items.length === 0) {
      setError("At least one line item is required.");
      return;
    }

    setSaving(true);

    const targetStatus = overrideStatus || status;
    const payload = {
      ...previewInvoice,
      status: targetStatus,
    };

    try {
      let res: Response;
      if (isNew) {
        res = await fetch("/api/admin/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/invoices/${initialInvoice?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // If unauthorized, redirect to login
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      // Safely read response text before parsing JSON
      const text = await res.text();
      let data: any = null;
      if (text && text.trim().length > 0) {
        try {
          data = JSON.parse(text);
        } catch {
          // Response body was not valid JSON
        }
      }

      if (!res.ok) {
        const errorMsg =
          data?.error || data?.message || "Could not save the invoice. Please try again.";
        throw new Error(errorMsg);
      }

      setSuccessMsg(
        isNew
          ? "Invoice created successfully!"
          : "Invoice updated successfully!"
      );

      setTimeout(() => {
        router.push("/admin/invoices");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save invoice:", err);
      setError(err.message || "Could not save the invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/invoices"
              className="text-secondary hover:text-white transition-colors text-sm"
            >
              ← Invoices
            </Link>
            <span className="text-mute">/</span>
            <h1 className="font-display text-2xl sm:text-3xl text-white font-bold">
              {isNew ? "Create New Invoice" : `Edit ${number}`}
            </h1>
          </div>
          <p className="text-secondary text-xs mt-1">
            Fill in the details on the left. The live visual invoice preview updates instantly on the right.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex bg-card border border-white/15 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "editor" ? "bg-red text-white" : "text-secondary hover:text-white"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "preview" ? "bg-red text-white" : "text-secondary hover:text-white"
              }`}
            >
              Live Preview
            </button>
          </div>

          <button
            onClick={() => handleSave("Draft")}
            disabled={saving}
            className="border border-white/20 hover:border-white text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            onClick={() => handleSave("Sent")}
            disabled={saving}
            className="bg-red hover:bg-cherry text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-red/25 hover:shadow-red/40 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save & Mark as Sent</span>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red/15 border border-red/40 text-white text-xs flex items-center justify-between animate-fade-in">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-secondary hover:text-white">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <span className="text-base">✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Editor Form */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            activeTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Card 1: Client Information */}
          <div className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">1</span>
                <span>Client Information</span>
              </h2>

              {/* Quick Pick Existing Client */}
              {clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-mute hidden sm:inline">Autofill:</span>
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    defaultValue=""
                    className="bg-ink border border-white/15 text-xs text-secondary hover:text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-red"
                  >
                    <option value="" disabled>Select Existing Client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Client Name <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma / Apex Media"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-mute/40 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Company / Brand
                </label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g. Red Bull India"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-mute/40 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-mute/40 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-mute/40 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={clientCountry}
                  onChange={(e) => setClientCountry(e.target.value)}
                  placeholder="India / United States"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-mute/40 focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Street, City, Postal Code"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white placeholder-mute/40 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Invoice Metadata */}
          <div className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <h2 className="font-display font-semibold text-white text-base mb-4 pb-3 border-b border-white/10 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">2</span>
              <span>Invoice Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="SBX-2026-001"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-mute/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Currency
                </label>
                <div className="relative">
                  <select
                    value={currency}
                    onFocus={() => setCurrencyOpen(true)}
                    onBlur={() => setCurrencyOpen(false)}
                    onMouseDown={() => setCurrencyOpen(true)}
                    onChange={(e) => {
                      setCurrency(e.target.value as Currency);
                      setCurrencyOpen(false);
                    }}
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value} className="bg-zinc-900 text-white">
                        {!currencyOpen && currency === c.value ? c.short : c.full}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Line Items (Services) */}
          <div className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">3</span>
                <span>Line Items ({items.length})</span>
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {/* Preset Dropdown */}
                {services.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddPreset(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="bg-ink border border-white/20 text-xs text-white rounded-lg px-3 py-1.5 focus:border-red focus:outline-none"
                  >
                    <option value="" disabled>+ Add Service Preset...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatMoney(s.defaultPrice, currency)})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Custom Item
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl bg-ink/70 border border-white/10 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-mute">Item #{idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, "up")}
                        disabled={idx === 0}
                        className="px-1.5 py-0.5 text-xs text-secondary hover:text-white disabled:opacity-20"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, "down")}
                        disabled={idx === items.length - 1}
                        className="px-1.5 py-0.5 text-xs text-secondary hover:text-white disabled:opacity-20"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs text-red hover:text-cherry px-2 py-0.5 rounded ml-2"
                        title="Delete Item"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        placeholder="Service / Item Name"
                        className="w-full bg-card border border-white/15 focus:border-red rounded-lg px-3 py-2 text-sm text-white placeholder-mute/40 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-5 flex items-center gap-2">
                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-full bg-card border border-white/15 focus:border-red rounded-lg px-2.5 py-2 text-sm text-center text-white focus:outline-none"
                          title="Quantity"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, "unit", e.target.value)}
                          placeholder="Unit"
                          className="w-full bg-card border border-white/15 focus:border-red rounded-lg px-2 py-2 text-sm text-center text-white focus:outline-none"
                          title="Unit (e.g. video, hour, reel)"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          placeholder="Price"
                          className="w-full bg-card border border-white/15 focus:border-red rounded-lg px-2.5 py-2 text-sm text-right text-white focus:outline-none"
                          title="Unit Price"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-12">
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Optional description (e.g. 4K ProRes 422 deliverable, 2 revision rounds)"
                        className="w-full bg-card/60 border border-white/10 focus:border-white/25 rounded-lg px-3 py-1.5 text-xs text-secondary placeholder-mute/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1 text-xs">
                    <span className="text-secondary mr-2">Line Total:</span>
                    <span className="font-bold text-white font-mono">
                      {formatMoney(item.total, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Financial Adjustments */}
          <div className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h2 className="font-display font-semibold text-white text-base pb-3 border-b border-white/10 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">4</span>
              <span>Discounts, Tax & Advance</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Discount */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Discount
                </label>
                <div className="flex rounded-xl overflow-hidden border border-white/15 bg-ink">
                  <div className="flex border-r border-white/15">
                    <button
                      type="button"
                      onClick={() => setDiscountType("percent")}
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${
                        discountType === "percent" ? "bg-red text-white" : "text-secondary hover:text-white"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("fixed")}
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${
                        discountType === "fixed" ? "bg-red text-white" : "text-secondary hover:text-white"
                      }`}
                    >
                      {CURRENCY_SYMBOLS[currency]}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              {/* Tax Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Tax / GST
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="rounded accent-red"
                    />
                    <span>Enable Tax</span>
                  </label>
                </div>
                <div className={`flex rounded-xl border border-white/15 bg-ink ${!taxEnabled ? "opacity-40" : ""}`}>
                  <span className="px-3 py-2 text-xs text-secondary border-r border-white/15">Rate %</span>
                  <input
                    type="number"
                    disabled={!taxEnabled}
                    min={0}
                    max={100}
                    value={taxRate || ""}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    placeholder="18"
                    className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              {/* Extra Charges */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Extra / Rush Fee
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraChargesLabel}
                    onChange={(e) => setExtraChargesLabel(e.target.value)}
                    placeholder="Rush Fee / Overnight Edit"
                    className="flex-1 bg-ink border border-white/15 focus:border-red rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    value={extraCharges || ""}
                    onChange={(e) => setExtraCharges(Number(e.target.value))}
                    placeholder="0"
                    className="w-28 bg-ink border border-white/15 focus:border-red rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              {/* Advance Paid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Advance / Deposit Paid
                </label>
                <div className="flex rounded-xl border border-white/15 bg-ink">
                  <span className="px-3 py-2 text-xs text-secondary border-r border-white/15">
                    {CURRENCY_SYMBOLS[currency]}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={advancePaid || ""}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none text-right font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Instructions & Terms */}
            <div className="pt-3 border-t border-white/10">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Payment Instructions & Terms (Editable)
              </label>
              <textarea
                rows={2}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="UPI ID, Bank transfer details, payment deadlines, etc."
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Payment QR Code Toggle */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                  Payment QR Code
                </label>
                <p className="text-[11px] text-mute">
                  Show payment QR code on this invoice and PDF
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPaymentQr}
                  onChange={(e) => setShowPaymentQr(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red"></div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Invoice Preview */}
        <div
          className={`lg:col-span-6 sticky top-8 space-y-4 ${
            activeTab === "editor" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-secondary px-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
              <span>Live Visual Preview (Matches PDF Exactly)</span>
            </span>
            <span className="text-[11px] text-mute">A4 Document Ratio</span>
          </div>

          {/* Render the Live Preview Component */}
          <LiveInvoicePreview invoice={previewInvoice} settings={settings} />

          {/* Action Bar beneath preview */}
          <div className="p-4 bg-card border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="text-xs">
              <span className="text-secondary">Balance Due:</span>{" "}
              <span className="font-bold text-white text-sm font-mono">
                {formatMoney(computedTotals.balanceDue, currency)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isNew && initialInvoice?.id && (
                <a
                  href={`/api/admin/invoices/${initialInvoice.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-2 rounded-xl transition-colors font-medium flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PDF</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-red hover:bg-cherry text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-red/25 hover:shadow-red/40 disabled:opacity-50"
              >
                {saving ? "Saving..." : isNew ? "Create Invoice" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LOCKED RULE Confirmation Modal */}
      {showLockedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-red/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-red/20 text-red flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="font-display font-bold text-white text-xl">
              Confirmation Required: Invoice Already Sent
            </h3>
            <p className="text-secondary text-xs mt-2 leading-relaxed">
              This invoice (<strong className="text-white">{number}</strong>) is currently marked as{" "}
              <span className="text-red font-semibold">{initialInvoice?.status}</span>. Modifying prices, services, or totals may create discrepancies with the version the client has already received.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLockedModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-secondary hover:text-white border border-white/15 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUnlocked(true);
                  setShowLockedModal(false);
                  handleSave();
                }}
                className="bg-red hover:bg-cherry text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-red/25"
              >
                Unlock & Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
