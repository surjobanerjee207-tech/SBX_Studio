"use client";

import { useEffect, useState } from "react";
import { ServicePreset, Currency } from "@/lib/types/invoice";
import { formatMoney } from "@/lib/invoice-calc";

export default function ServicesPricingPage() {
  const [services, setServices] = useState<ServicePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("video");
  const [defaultPrice, setDefaultPrice] = useState(2000);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (err: any) {
      console.error("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const openNewModal = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setDefaultUnit("video");
    setDefaultPrice(2000);
    setCurrency("INR");
    setIsModalOpen(true);
  };

  const openEditModal = (s: ServicePreset) => {
    setEditId(s.id || null);
    setName(s.name);
    setDescription(s.description || "");
    setDefaultUnit(s.defaultUnit);
    setDefaultPrice(s.defaultPrice);
    setCurrency(s.currency);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Service name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<ServicePreset> = {
        id: editId || undefined,
        name: name.trim(),
        description: description.trim(),
        defaultUnit: defaultUnit.trim(),
        defaultPrice: Math.max(0, Math.round(Number(defaultPrice) || 0)),
        currency,
        order: editId
          ? services.find((s) => s.id === editId)?.order || 0
          : services.length,
      };

      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      showToast(editId ? "Preset updated!" : "New service preset added!");
      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert("Error saving service: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: ServicePreset) => {
    if (!confirm(`Are you sure you want to delete preset "${s.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services?id=${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Preset "${s.name}" deleted.`);
      fetchServices();
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Services & Pricing Presets
          </h1>
          <p className="text-secondary text-xs mt-1">
            Configure preset service line items for 1-click insertion into any invoice. You can always override prices on specific invoices.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="bg-red hover:bg-cherry text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-red/25 hover:shadow-red/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Add Service Preset</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-red/15 border border-red/40 text-white text-xs flex items-center justify-between animate-fade-in">
          <span>✓ {notification}</span>
          <button onClick={() => setNotification(null)} className="text-secondary hover:text-white">✕</button>
        </div>
      )}

      {/* Services List Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-secondary">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-2xl p-12 text-center shadow-xl">
          <h3 className="font-display font-bold text-white text-lg">No service presets</h3>
          <p className="text-secondary text-xs mt-1">Create presets to speed up invoicing.</p>
          <button
            onClick={openNewModal}
            className="mt-4 bg-red hover:bg-cherry text-white text-xs px-5 py-2.5 rounded-xl font-medium"
          >
            + Add Preset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv, idx) => (
            <div
              key={srv.id}
              className="bg-card border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-mute px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      #{idx + 1}
                    </span>
                    <h3 className="font-display font-bold text-white text-base group-hover:text-red transition-colors">
                      {srv.name}
                    </h3>
                  </div>
                  <span className="text-sm font-mono font-bold text-white">
                    {formatMoney(srv.defaultPrice, srv.currency)}
                  </span>
                </div>

                <p className="text-xs text-secondary mt-1 min-h-[32px]">
                  {srv.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 text-[11px] text-mute">
                  <span>Unit: <strong className="text-secondary">{srv.defaultUnit}</strong></span>
                  <span>•</span>
                  <span>Currency: <strong className="text-secondary">{srv.currency}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/10">
                <button
                  onClick={() => openEditModal(srv)}
                  className="text-xs text-secondary hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Edit Preset
                </button>
                <button
                  onClick={() => handleDelete(srv)}
                  className="text-xs text-red hover:text-cherry px-2.5 py-1.5"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-white/15 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h2 className="font-display font-bold text-white text-lg">
                {editId ? "Edit Service Preset" : "Add Service Preset"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Service Name <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. YouTube Video Editing"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Full edit, B-roll selection, sound design, and color pass"
                  className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Default Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    placeholder="video / hour / reel"
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Default Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value))}
                    placeholder="2000"
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
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
                  {saving ? "Saving..." : editId ? "Update Preset" : "Save Preset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
