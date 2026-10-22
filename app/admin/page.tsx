"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Invoice } from "@/lib/types/invoice";
import { formatMoney } from "@/lib/invoice-calc";
import { DashboardStats } from "@/lib/invoice-storage";
import { PortfolioStudio } from "@/components/PortfolioStudio";

export default function AdminDashboardPage() {
  const [adminView, setAdminView] = useState<"invoices" | "portfolio">("invoices");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsRes, invRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/admin/invoices?sort=date-desc"),
        ]);
        const statsData = await statsRes.json();
        const invData = await invRes.json();

        if (statsData.stats) setStats(statsData.stats);
        if (invData.invoices) setRecentInvoices(invData.invoices.slice(0, 5));
      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-secondary">Loading admin suite...</p>
      </div>
    );
  }

  const currency = (stats.currency as any) || "INR";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Suite View Selector (Invoices vs Portfolio Videos) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-1.5 p-1 bg-card border border-white/15 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setAdminView("invoices")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              adminView === "invoices"
                ? "bg-red text-white shadow-md shadow-red/25"
                : "text-secondary hover:text-white"
            }`}
          >
            🧾 Invoicing & Revenue
          </button>
          <button
            onClick={() => setAdminView("portfolio")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              adminView === "portfolio"
                ? "bg-red text-white shadow-md shadow-red/25"
                : "text-secondary hover:text-white"
            }`}
          >
            🎬 Portfolio Videos CMS
          </button>
        </div>

        {adminView === "invoices" && (
          <div className="flex items-center gap-3">
            <Link
              href="/admin/invoices/new"
              className="bg-red hover:bg-cherry text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-red/25 hover:shadow-red/40 flex items-center gap-2"
            >
              <span>+</span>
              <span>Create Invoice</span>
            </Link>
          </div>
        )}
      </div>

      {/* RENDER PORTFOLIO CMS VIEW */}
      {adminView === "portfolio" && (
        <div className="animate-fade-in -mt-6">
          <PortfolioStudio />
        </div>
      )}

      {/* RENDER INVOICING DASHBOARD VIEW */}
      {adminView === "invoices" && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Description */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-white tracking-tight">
                Invoicing Overview
              </h1>
              <span className="bg-red/20 text-red text-xs px-2.5 py-0.5 border border-red/30 rounded-full font-mono uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-secondary text-xs mt-1">
              Real-time revenue, client payments, and invoice status metrics.
            </p>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Invoiced */}
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-secondary text-xs mb-3">
                <span className="uppercase tracking-wider font-semibold">Total Invoiced</span>
                <span className="w-7 h-7 rounded-lg bg-white/5 text-white grid place-items-center">
                  ₹
                </span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {formatMoney(stats.totalInvoiced, currency)}
              </p>
              <p className="text-[11px] text-mute mt-2">
                Across {stats.totalInvoices} project invoice{stats.totalInvoices === 1 ? "" : "s"}
              </p>
            </div>

            {/* Received */}
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-3">
                <span className="uppercase tracking-wider font-semibold">Total Received</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center">
                  ✓
                </span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {formatMoney(stats.totalReceived, currency)}
              </p>
              <p className="text-[11px] text-mute mt-2">
                Advances and paid balances collected
              </p>
            </div>

            {/* Outstanding */}
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between text-gold text-xs mb-3">
                <span className="uppercase tracking-wider font-semibold">Outstanding Balance</span>
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-gold grid place-items-center">
                  ⌛
                </span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-gold tracking-tight">
                {formatMoney(stats.totalOutstanding, currency)}
              </p>
              <p className="text-[11px] text-mute mt-2">
                Pending client payment
              </p>
            </div>

            {/* Overdue */}
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-red/40 transition-all">
              <div className="flex items-center justify-between text-red text-xs mb-3">
                <span className="uppercase tracking-wider font-semibold">Overdue Invoices</span>
                <span className="w-7 h-7 rounded-lg bg-red/10 text-red grid place-items-center">
                  !
                </span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-red tracking-tight">
                {formatMoney(stats.totalOverdue, currency)}
              </p>
              <p className="text-[11px] text-mute mt-2">
                {stats.countOverdue} invoice{stats.countOverdue === 1 ? "" : "s"} past due date
              </p>
            </div>
          </div>

          {/* Quick Access Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/admin/invoices/new"
              className="p-4 rounded-xl bg-card border border-white/10 hover:border-red hover:bg-white/[0.02] transition-all text-left group"
            >
              <p className="text-sm font-semibold text-white group-hover:text-red transition-colors flex items-center justify-between">
                <span>+ New Invoice</span>
                <span className="text-xs text-mute group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
              <p className="text-[11px] text-secondary mt-1">Generate PDF & bill client</p>
            </Link>

            <Link
              href="/admin/clients"
              className="p-4 rounded-xl bg-card border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-all text-left group"
            >
              <p className="text-sm font-semibold text-white transition-colors flex items-center justify-between">
                <span>Clients CRM</span>
                <span className="text-xs text-mute group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
              <p className="text-[11px] text-secondary mt-1">Manage client records</p>
            </Link>

            <Link
              href="/admin/services"
              className="p-4 rounded-xl bg-card border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-all text-left group"
            >
              <p className="text-sm font-semibold text-white transition-colors flex items-center justify-between">
                <span>Services & Rates</span>
                <span className="text-xs text-mute group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
              <p className="text-[11px] text-secondary mt-1">Custom preset pricing</p>
            </Link>

            <Link
              href="/admin/settings"
              className="p-4 rounded-xl bg-card border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-all text-left group"
            >
              <p className="text-sm font-semibold text-white transition-colors flex items-center justify-between">
                <span>Studio Settings</span>
                <span className="text-xs text-mute group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
              <p className="text-[11px] text-secondary mt-1">UPI, Bank & branding</p>
            </Link>
          </div>

          {/* Recent Invoices Table */}
          <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h2 className="font-display font-semibold text-white text-base">
                  Recent Invoices
                </h2>
                <p className="text-[11px] text-secondary mt-0.5">
                  Latest invoices generated for your video editing clients
                </p>
              </div>

              <Link
                href="/admin/invoices"
                className="text-xs text-red hover:underline underline-offset-4"
              >
                View All Invoices ({stats.totalInvoices}) →
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center text-secondary text-xs">
                No invoices generated yet. Click &quot;Create Invoice&quot; to begin!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-mute uppercase text-[10px] tracking-wider border-b border-white/10 pb-2">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-white">
                          <Link
                            href={`/admin/invoices/${inv.id}/edit`}
                            className="hover:text-red transition-colors"
                          >
                            {inv.number}
                          </Link>
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-medium text-white">{inv.clientName}</p>
                          {inv.clientCompany && (
                            <p className="text-[10px] text-secondary">{inv.clientCompany}</p>
                          )}
                        </td>

                        <td className="py-3 px-3 text-secondary">{inv.dueDate}</td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                          {formatMoney(inv.grandTotal, inv.currency)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={inv.balanceDue > 0 ? "text-gold" : "text-emerald-400"}>
                            {formatMoney(inv.balanceDue, inv.currency)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              inv.status === "Paid"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : inv.status === "Overdue"
                                ? "bg-red/20 text-red border-red/40"
                                : "bg-white/10 text-secondary border-white/15"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <a
                            href={`/api/admin/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-secondary hover:text-white underline underline-offset-4"
                          >
                            PDF ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
