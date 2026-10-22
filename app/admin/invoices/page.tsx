"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Invoice, InvoiceStatus, CURRENCY_SYMBOLS } from "@/lib/types/invoice";
import { formatMoney } from "@/lib/invoice-calc";
import { AdminAlert, AlertType } from "@/components/admin/AdminAlert";

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortOption, setSortOption] = useState("date-desc");
  const [notification, setNotification] = useState<{ message: string; type: AlertType } | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("query", search.trim());
      if (statusFilter !== "All") params.set("status", statusFilter);
      params.set("sort", sortOption);

      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err: any) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, sortOption]);

  const showToast = (msg: string, type: AlertType = "success") => {
    setNotification({ message: msg, type });
  };

  const handleDuplicate = async (id: string, num: string) => {
    try {
      const res = await fetch(`/api/admin/invoices/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Duplicated ${num} as new invoice ${data.invoice.number}!`, "success");
      fetchInvoices();
    } catch (err: any) {
      showToast("Error duplicating: " + err.message, "error");
    }
  };

  const handleMarkPaid = async (id: string, num: string) => {
    try {
      const res = await fetch(`/api/admin/invoices/${id}/mark-paid`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Invoice ${num} marked as Paid!`, "success");
      fetchInvoices();
    } catch (err: any) {
      showToast("Error marking paid: " + err.message, "error");
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to permanently delete invoice ${num}?`)) return;

    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Invoice ${num} deleted.`, "success");
      fetchInvoices();
    } catch (err: any) {
      showToast("Error deleting: " + err.message, "error");
    }
  };

  const copyPublicLink = (inv: Invoice) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/i/${inv.publicToken}`;
    navigator.clipboard.writeText(url);
    showToast(`Public link for ${inv.number} copied!`, "success");
  };

  const shareWhatsApp = (inv: Invoice) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/i/${inv.publicToken}`;
    const text = encodeURIComponent(
      `Hello ${inv.clientName},\n\nHere is your invoice ${inv.number} from SBX Studio.\nTotal: ${formatMoney(inv.grandTotal, inv.currency)}\nDue Date: ${inv.dueDate}\n\nYou can view and download your invoice here:\n${url}\n\nThank you!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Overdue":
        return "bg-red/20 text-red border-red/40 animate-pulse";
      case "Sent":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Partially Paid":
        return "bg-amber-500/15 text-gold border-amber-500/30";
      case "Cancelled":
        return "bg-zinc-700/20 text-mute border-zinc-700/40";
      default:
        return "bg-white/10 text-secondary border-white/15";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Invoices
          </h1>
          <p className="text-secondary text-xs mt-1">
            Manage, generate PDFs, track payments, and send invoices to clients.
          </p>
        </div>

        <Link
          href="/admin/invoices/new"
          className="bg-red hover:bg-cherry text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-red/25 hover:shadow-red/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="text-base leading-none">+</span>
          <span>Create New Invoice</span>
        </Link>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <AdminAlert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      {/* Filters, Search & Sort Bar */}
      <div className="bg-card border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, company, or invoice #..."
            className="w-full bg-ink border border-white/15 focus:border-red rounded-xl px-4 py-2.5 pl-9 text-xs text-white placeholder-mute/40 focus:outline-none transition-colors"
          />
          <svg
            className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["All", "Draft", "Sent", "Partially Paid", "Paid", "Overdue"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-red text-white font-semibold"
                  : "text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-mute hidden sm:inline">Sort:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-ink border border-white/15 text-xs text-secondary hover:text-white rounded-xl px-3 py-2 focus:border-red focus:outline-none"
          >
            <option value="date-desc">Newest Date</option>
            <option value="date-asc">Oldest Date</option>
            <option value="due-asc">Earliest Due</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="number-desc">Invoice # (High-Low)</option>
          </select>
        </div>
      </div>

      {/* Invoice Table / Cards */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-secondary">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-2xl p-12 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-mute grid place-items-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-white text-lg">No invoices found</h3>
          <p className="text-secondary text-xs mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "All"
              ? "No invoices match your current search or filter criteria."
              : "You haven't generated any invoices yet. Create your first invoice in seconds!"}
          </p>
          <Link
            href="/admin/invoices/new"
            className="mt-5 inline-block bg-red hover:bg-cherry text-white text-xs px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            + Create First Invoice
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-secondary uppercase tracking-wider text-[11px] border-b border-white/10">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Date / Due</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      <Link
                        href={`/admin/invoices/${inv.id}/edit`}
                        className="hover:text-red transition-colors"
                      >
                        {inv.number}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{inv.clientName}</p>
                      {inv.clientCompany && (
                        <p className="text-[11px] text-secondary">{inv.clientCompany}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-secondary">
                      <p>{inv.date}</p>
                      <p className="text-[11px] text-mute">Due: {inv.dueDate}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                      {formatMoney(inv.grandTotal, inv.currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={inv.balanceDue > 0 ? "text-gold" : "text-emerald-400"}>
                        {formatMoney(inv.balanceDue, inv.currency)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* PDF Download Button */}
                        <a
                          href={`/api/admin/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => showToast(`Downloading PDF for ${inv.number}...`, "info")}
                          title="Download Official PDF"
                          className="bg-white/5 hover:bg-white/15 text-white p-2 rounded-lg transition-colors border border-white/10"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </a>

                        {/* Edit Button */}
                        <Link
                          href={`/admin/invoices/${inv.id}/edit`}
                          title="Edit Invoice"
                          className="bg-white/5 hover:bg-white/15 text-white p-2 rounded-lg transition-colors border border-white/10"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>

                        {/* Mark Paid (if not already paid) */}
                        {inv.status !== "Paid" && inv.id && (
                          <button
                            onClick={() => handleMarkPaid(inv.id!, inv.number)}
                            title="Mark as Paid"
                            className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 p-2 rounded-lg transition-colors border border-emerald-500/20"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}

                        {/* Copy Public Link */}
                        <button
                          onClick={() => copyPublicLink(inv)}
                          title="Copy Shareable Public Link"
                          className="bg-white/5 hover:bg-white/15 text-secondary hover:text-white p-2 rounded-lg transition-colors border border-white/10"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => shareWhatsApp(inv)}
                          title="Share via WhatsApp"
                          className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 p-2 rounded-lg transition-colors border border-emerald-500/20"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
                          </svg>
                        </button>

                        {/* Duplicate */}
                        {inv.id && (
                          <button
                            onClick={() => handleDuplicate(inv.id!, inv.number)}
                            title="Duplicate Invoice"
                            className="bg-white/5 hover:bg-white/15 text-secondary hover:text-white p-2 rounded-lg transition-colors border border-white/10"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}

                        {/* Delete */}
                        {inv.id && (
                          <button
                            onClick={() => handleDelete(inv.id!, inv.number)}
                            title="Delete Invoice"
                            className="bg-red/10 hover:bg-red/25 text-red p-2 rounded-lg transition-colors border border-red/20"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
