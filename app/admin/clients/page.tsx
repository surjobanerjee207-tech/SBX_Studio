"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Client, Invoice } from "@/lib/types/invoice";
import { formatMoney } from "@/lib/invoice-calc";
import { AdminAlert, AlertType } from "@/components/admin/AdminAlert";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: AlertType } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, iRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/invoices"),
      ]);
      const cData = await cRes.json();
      const iData = await iRes.json();
      if (cData.clients) setClients(cData.clients);
      if (iData.invoices) setInvoices(iData.invoices);
    } catch (err: any) {
      console.error("Failed to load clients data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string, type: AlertType = "success") => {
    setNotification({ message: msg, type });
  };

  const openNewModal = () => {
    setEditId(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCountry("India");
    setNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditId(c.id || null);
    setName(c.name);
    setCompany(c.company || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setCountry(c.country || "India");
    setNotes(c.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Client name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Client> = {
        id: editId || undefined,
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        country: country.trim(),
        notes: notes.trim(),
      };

      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      showToast(editId ? "Client updated!" : "New client added!", "success");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast("Error saving client: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Client) => {
    if (!confirm(`Are you sure you want to delete client "${c.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/clients?id=${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Client "${c.name}" removed.`, "success");
      fetchData();
    } catch (err: any) {
      showToast("Error deleting client: " + err.message, "error");
    }
  };

  // Helper to calculate total invoiced & outstanding for a client
  const getClientMetrics = (client: Client) => {
    const clientInvoices = invoices.filter(
      (inv) =>
        inv.clientId === client.id ||
        inv.clientName.toLowerCase() === client.name.toLowerCase()
    );
    const totalInvoiced = clientInvoices.reduce((a, c) => a + c.grandTotal, 0);
    const totalOutstanding = clientInvoices.reduce((a, c) => a + c.balanceDue, 0);
    return {
      count: clientInvoices.length,
      totalInvoiced,
      totalOutstanding,
      invoices: clientInvoices,
    };
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Clients CRM
          </h1>
          <p className="text-secondary text-xs mt-1">
            Store client companies, track historical project invoices, and see outstanding balances.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="bg-red hover:bg-cherry text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-red/25 hover:shadow-red/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Add New Client</span>
        </button>
      </div>

      <AnimatePresence>
        {notification && (
          <AdminAlert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, company, or email..."
            className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-4 py-2.5 pl-9 text-xs text-white placeholder-mute/40 focus:outline-none"
          />
          <svg className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-secondary">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-2xl p-12 text-center shadow-xl">
          <h3 className="font-display font-bold text-white text-lg">No clients found</h3>
          <p className="text-secondary text-xs mt-1">
            {search ? "No clients match your search query." : "Add your first client to start issuing invoices."}
          </p>
          <button
            onClick={openNewModal}
            className="mt-4 bg-red hover:bg-cherry text-white text-xs px-5 py-2.5 rounded-xl font-medium"
          >
            + Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const metrics = getClientMetrics(client);
            return (
              <div
                key={client.id}
                className="bg-card border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-display font-bold text-white text-base group-hover:text-red transition-colors">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-xs text-secondary font-medium">{client.company}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-mute px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {metrics.count} invoice{metrics.count === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="text-xs text-secondary space-y-1 mb-4">
                    {client.email && <p>✉ {client.email}</p>}
                    {client.phone && <p>📞 {client.phone}</p>}
                    {client.address && <p>📍 {client.address}, {client.country}</p>}
                    {client.notes && (
                      <p className="text-[11px] text-mute italic mt-2 border-t border-white/5 pt-1.5">
                        &quot;{client.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  {/* Financial Stats */}
                  <div className="flex justify-between items-center text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-mute block uppercase">Total Invoiced</span>
                      <span className="font-mono font-bold text-white">
                        {formatMoney(metrics.totalInvoiced, "INR")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-mute block uppercase">Outstanding</span>
                      <span
                        className={`font-mono font-bold ${
                          metrics.totalOutstanding > 0 ? "text-gold" : "text-emerald-400"
                        }`}
                      >
                        {formatMoney(metrics.totalOutstanding, "INR")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <Link
                      href={`/admin/invoices?query=${encodeURIComponent(client.name)}`}
                      className="text-xs text-secondary hover:text-white underline underline-offset-4"
                    >
                      View Past Invoices →
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(client)}
                        className="text-xs text-secondary hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="text-xs text-red hover:text-cherry px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-white/15 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h2 className="font-display font-bold text-white text-lg">
                {editId ? "Edit Client" : "Add New Client"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Client / Contact Name <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Company / Agency
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Apex Media Group"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India / USA"
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Address / City
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Mumbai, Maharashtra"
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Private Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred deliverable specs, payment habits, etc."
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-secondary hover:text-white border border-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red hover:bg-cherry text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editId ? "Update Client" : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
