"use client";

import { useEffect, useState } from "react";
import { StudioSettings, Currency } from "@/lib/types/invoice";

export default function StudioSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Backup file state
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      } catch (err: any) {
        setError(err.message || "Failed to load studio settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotification(null);

    try {
      const payload: any = {
        ...settings,
      };
      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setSettings(data.settings);
      setNewPassword("");
      setConfirmPassword("");
      showToast("Studio Settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSettings((prev) => (prev ? { ...prev, logoUrl: data.url } : prev));
      showToast("Logo uploaded successfully!");
    } catch (err: any) {
      alert("Error uploading logo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCustomQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      alert("Please upload a PNG or JPG image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSettings((prev) => (prev ? { ...prev, customQrUrl: result } : prev));
      showToast("Custom QR code image uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupFile) return;

    if (!confirm("Importing this backup will overwrite existing clients, services, and invoices. Do you want to proceed?")) {
      return;
    }

    setImporting(true);
    try {
      const text = await backupFile.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      showToast("Backup imported successfully!");
      setBackupFile(null);
      // Reload settings
      const sRes = await fetch("/api/admin/settings");
      const sData = await sRes.json();
      if (sData.settings) setSettings(sData.settings);
    } catch (err: any) {
      alert("Error importing backup: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Studio Settings
        </h1>
        <p className="text-secondary text-xs mt-1">
          Configure your studio branding, bank/UPI payout details, defaults, and security credentials. Nothing is hardcoded.
        </p>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <span>✓ {notification}</span>
          <button onClick={() => setNotification(null)} className="text-secondary hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red/15 border border-red/40 text-white text-xs flex items-center justify-between animate-fade-in">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-secondary hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Studio Branding */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-display font-semibold text-white text-base pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">1</span>
            <span>Studio Identity & Contact</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Studio Name <span className="text-red">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.studioName}
                onChange={(e) => setSettings({ ...settings, studioName: e.target.value })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={settings.country || "India"}
                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Studio Address
              </label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="City, State, Pin Code"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Logo Upload */}
            <div className="sm:col-span-2 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                Studio Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain bg-white/5 border border-white/15 rounded-xl p-1"
                  />
                )}
                <label className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-white/15 font-medium">
                  {uploadingLogo ? "Uploading..." : "Upload New Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, logoUrl: "" })}
                    className="text-xs text-secondary hover:text-red transition-colors"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Payment Details (UPI & Bank) */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-display font-semibold text-white text-base pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">2</span>
            <span>Payout Details (UPI & Bank Accounts)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                UPI ID (India)
              </label>
              <input
                type="text"
                value={settings.upiId || ""}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                placeholder="e.g. yourname@okhdfcbank"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={settings.bankName || ""}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                value={settings.bankAccountName || ""}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                placeholder="e.g. SBX Studio"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={settings.bankAccountNumber || ""}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                placeholder="e.g. 50200012345678"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                value={settings.bankIfsc || ""}
                onChange={(e) => setSettings({ ...settings, bankIfsc: e.target.value })}
                placeholder="e.g. HDFC0001234"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                SWIFT / BIC Code (for International Wire Transfers)
              </label>
              <input
                type="text"
                value={settings.bankSwift || ""}
                onChange={(e) => setSettings({ ...settings, bankSwift: e.target.value })}
                placeholder="e.g. HDFCINBBXXX"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>

            {/* Payment QR Code Section */}
            <div className="sm:col-span-2 pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-white">
                    Payment QR Code
                  </label>
                  <p className="text-xs text-secondary mt-0.5">
                    Include a payment QR code directly inside invoice previews and downloaded PDFs.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showPaymentQr ?? true}
                    onChange={(e) => setSettings({ ...settings, showPaymentQr: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red"></div>
                </label>
              </div>

              {(settings.showPaymentQr ?? true) && (
                <div className="space-y-4 bg-ink/50 p-4 rounded-xl border border-white/10">
                  {/* Mode Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                      QR Code Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, qrMode: "auto" })}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          (settings.qrMode || "auto") === "auto"
                            ? "bg-red/10 border-red text-white"
                            : "bg-ink border-white/10 text-secondary hover:text-white hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <span className={`w-3.5 h-3.5 rounded-full border grid place-items-center ${
                            (settings.qrMode || "auto") === "auto" ? "border-red bg-red" : "border-white/30"
                          }`}>
                            {(settings.qrMode || "auto") === "auto" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          Auto-generate UPI QR
                        </div>
                        <p className="text-xs text-secondary mt-1 pl-5">
                          Built from your UPI ID, studio name, and invoice balance due (INR only).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, qrMode: "custom" })}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          settings.qrMode === "custom"
                            ? "bg-red/10 border-red text-white"
                            : "bg-ink border-white/10 text-secondary hover:text-white hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <span className={`w-3.5 h-3.5 rounded-full border grid place-items-center ${
                            settings.qrMode === "custom" ? "border-red bg-red" : "border-white/30"
                          }`}>
                            {settings.qrMode === "custom" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          Upload my own QR image
                        </div>
                        <p className="text-xs text-secondary mt-1 pl-5">
                          Upload a PNG or JPG QR image from your bank or payment app (max 2 MB).
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Upload QR image if custom mode */}
                  {settings.qrMode === "custom" && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                        Custom QR Code Image
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        {settings.customQrUrl ? (
                          <div className="relative group">
                            <img
                              src={settings.customQrUrl}
                              alt="Custom QR Preview"
                              className="w-24 h-24 object-contain bg-white rounded-xl p-1.5 border border-white/20"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl border border-dashed border-white/20 grid place-items-center text-secondary text-xs text-center p-2">
                            No QR image uploaded
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-white/15 font-medium inline-block">
                            {settings.customQrUrl ? "Replace QR Image" : "Upload QR Image"}
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg"
                              onChange={handleCustomQrUpload}
                              className="hidden"
                            />
                          </label>
                          {settings.customQrUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setSettings({ ...settings, customQrUrl: "" })}
                                className="text-xs text-secondary hover:text-red transition-colors block"
                              >
                                Remove QR Image
                              </button>
                            </div>
                          )}
                          <p className="text-[11px] text-mute">
                            PNG or JPG, maximum 2 MB. Saved in persistent storage.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Caption */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                      QR Code Caption
                    </label>
                    <input
                      type="text"
                      value={settings.qrCaption || ""}
                      onChange={(e) => setSettings({ ...settings, qrCaption: e.target.value })}
                      placeholder="e.g. Scan to pay"
                      className="w-full sm:w-1/2 bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                    />
                    <p className="text-[11px] text-mute mt-1">
                      Short text displayed directly beneath the QR code (default: &quot;Scan to pay&quot;).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Default Invoicing Rules */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-display font-semibold text-white text-base pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">3</span>
            <span>Defaults & Policies</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value as Currency })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.defaultTaxRate}
                onChange={(e) => setSettings({ ...settings, defaultTaxRate: Number(e.target.value) })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={settings.defaultTaxEnabled}
                  onChange={(e) => setSettings({ ...settings, defaultTaxEnabled: e.target.checked })}
                  className="rounded accent-red"
                />
                <span>Enable Tax by Default</span>
              </label>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Default Payment Terms & Notes
              </label>
              <textarea
                rows={2}
                value={settings.defaultPaymentTerms || ""}
                onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Invoice Footer Message
              </label>
              <input
                type="text"
                value={settings.footerMessage || ""}
                onChange={(e) => setSettings({ ...settings, footerMessage: e.target.value })}
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Change Password */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-display font-semibold text-white text-base pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">4</span>
            <span>Admin Password (Security)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                New Admin Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-red hover:bg-cherry text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red/25 hover:shadow-red/40 disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Studio Settings"}
          </button>
        </div>
      </form>

      {/* Card 5: Backup Export & Import (Phase 3) */}
      <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="font-display font-semibold text-white text-base pb-3 border-b border-white/10 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-red/20 text-red text-xs grid place-items-center font-mono">5</span>
          <span>Data Backup & Restore (JSON)</span>
        </h2>
        <p className="text-secondary text-xs">
          Export an offline JSON backup of all your invoices, clients, services, and studio settings. You can re-import this file anytime.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <a
            href="/api/admin/backup"
            download
            className="border border-white/20 hover:border-white text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
          >
            <span>⬇ Export Backup JSON</span>
          </a>

          {/* Import Form */}
          <form onSubmit={handleImportBackup} className="flex items-center gap-3">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
              className="text-xs text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
            />
            <button
              type="submit"
              disabled={!backupFile || importing}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-40"
            >
              {importing ? "Importing..." : "Restore"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
