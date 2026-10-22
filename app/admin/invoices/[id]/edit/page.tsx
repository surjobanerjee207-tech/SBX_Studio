"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Invoice } from "@/lib/types/invoice";
import { InvoiceEditor } from "@/components/admin/InvoiceEditor";
import Link from "next/link";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/invoices/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        setInvoice(data.invoice);
      } catch (err: any) {
        setError(err.message || "Invoice not found");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Invoice Not Found</h2>
        <p className="text-secondary text-xs mb-6">{error || "Could not find this invoice."}</p>
        <Link
          href="/admin/invoices"
          className="bg-red hover:bg-cherry text-white text-xs px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          ← Return to Invoices
        </Link>
      </div>
    );
  }

  return <InvoiceEditor initialInvoice={invoice} isNew={false} />;
}
