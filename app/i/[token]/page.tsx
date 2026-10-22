"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Invoice, StudioSettings, CURRENCY_SYMBOLS } from "@/lib/types/invoice";
import { LiveInvoicePreview } from "@/components/admin/LiveInvoicePreview";
import { formatMoney } from "@/lib/invoice-calc";

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params?.token as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [studio, setStudio] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    async function loadPublicInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invoice not found");
        setInvoice(data.invoice);
        setStudio(data.studio);
      } catch (err: any) {
        setError(err.message || "Invoice not found or link has expired");
      } finally {
        setLoading(false);
      }
    }
    if (token) loadPublicInvoice();
  }, [token]);

  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const copyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-secondary font-mono tracking-wider">
            Loading official invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !studio) {
    return (
      <div className="min-h-screen bg-canvas text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-card border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red/20 text-red flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Invoice Unavailable</h1>
          <p className="text-secondary text-xs mb-6 leading-relaxed">
            {error || "This invoice link is either invalid, revoked, or has expired."}
          </p>
          <a
            href="/"
            className="inline-block bg-white/10 hover:bg-white/20 text-white text-xs px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            ← Visit SBX Studio
          </a>
        </div>
      </div>
    );
  }

  const currency = invoice.currency || "INR";

  return (
    <div className="min-h-screen bg-canvas text-bone py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Banner with Quick Actions */}
      <div className="max-w-4xl mx-auto mb-8 bg-card border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide">
              Official Invoice from {studio.studioName || "SBX Studio"}
            </h1>
          </div>
          <p className="text-secondary text-xs mt-0.5">
            Invoice #{invoice.number} • Due on {invoice.dueDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy link */}
          <button
            onClick={copyLink}
            className="border border-white/20 hover:border-white text-white text-xs px-3.5 py-2 rounded-xl transition-colors font-medium flex items-center gap-1.5"
          >
            <span>{copied ? "✓ Copied Link" : "🔗 Copy Link"}</span>
          </button>

          {/* Download Official PDF */}
          <a
            href={`/api/invoices/${token}/pdf`}
            download
            className="bg-red hover:bg-cherry text-white text-xs px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-red/25 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Payment Helper Card if balance is due */}
      {invoice.balanceDue > 0 && invoice.status !== "Paid" && (
        <div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-red/10 via-card to-card border border-red/30 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono text-red uppercase tracking-wider font-semibold">
              Payment Pending
            </span>
            <p className="font-display text-2xl font-bold text-white mt-0.5">
              Balance Due: {formatMoney(invoice.balanceDue, currency)}
            </p>
            <p className="text-secondary text-xs mt-1">
              Please transfer to the UPI ID or Bank account details listed below.
            </p>
          </div>

          {studio.upiId && (
            <div className="flex items-center gap-3 bg-black/40 border border-white/15 px-4 py-3 rounded-xl">
              <div>
                <span className="text-[10px] text-mute uppercase block">Quick UPI</span>
                <span className="text-xs font-mono font-bold text-white">{studio.upiId}</span>
              </div>
              <button
                onClick={() => copyUpi(studio.upiId!)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ml-2"
              >
                {copiedUpi ? "✓ Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Render the Clean Live Invoice Document */}
      <div className="max-w-4xl mx-auto">
        <LiveInvoicePreview invoice={invoice} settings={studio} />
      </div>

      {/* Footer Branding */}
      <div className="max-w-4xl mx-auto mt-8 text-center text-xs text-mute space-y-1">
        <p>Secured by SBX Studio Invoicing Suite.</p>
        <p>© {new Date().getFullYear()} {studio.studioName}. All rights reserved.</p>
      </div>
    </div>
  );
}
