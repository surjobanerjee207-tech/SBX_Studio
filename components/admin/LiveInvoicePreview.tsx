"use client";

import React, { useState, useEffect } from "react";
import { Invoice, StudioSettings, CURRENCY_SYMBOLS } from "@/lib/types/invoice";
import { formatMoney } from "@/lib/invoice-calc";
import { generateInvoiceQrDataUrl, getQrDecision } from "@/lib/upi-qr";

interface LiveInvoicePreviewProps {
  invoice: Invoice;
  settings: StudioSettings;
}

export function LiveInvoicePreview({ invoice, settings }: LiveInvoicePreviewProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const qrDecision = getQrDecision(invoice, settings);

  useEffect(() => {
    let isMounted = true;
    generateInvoiceQrDataUrl(invoice, settings)
      .then((url) => {
        if (isMounted) {
          setQrUrl(url);
          setQrError(null);
        }
      })
      .catch((err) => {
        console.error("LiveInvoicePreview QR generation error:", err);
        if (isMounted) {
          setQrUrl(null);
          setQrError(err?.message || "Failed to generate QR");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [invoice, settings]);

  const currency = invoice.currency || "INR";
  const sym = CURRENCY_SYMBOLS[currency] || "₹";

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Overdue":
        return "bg-red/10 text-red border-red/30";
      case "Sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Partially Paid":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Cancelled":
        return "bg-gray-150 text-gray-600 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="w-full bg-white text-zinc-900 rounded-sm shadow-2xl p-6 sm:p-8 md:p-10 text-xs leading-relaxed font-sans border border-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-red">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-zinc-900">
            {settings.studioName || "SBX Studio"}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-red font-bold mt-1">
            Video Editing & Visual Storytelling
          </p>
          <div className="text-[11px] text-zinc-600 mt-2 space-y-0.5">
            {settings.address && (
              <p>
                {settings.address}
                {settings.country && !settings.address.toLowerCase().includes(settings.country.toLowerCase())
                  ? ", " + settings.country
                  : ""}
              </p>
            )}
            {settings.email && <p>Email: {settings.email}</p>}
            {settings.phone && <p>Phone: {settings.phone}</p>}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-wider text-red font-serif block">
            INVOICE
          </span>
          <p className="text-sm font-bold text-zinc-900 mt-0.5">
            {invoice.number || "SBX-2026-001"}
          </p>
          <div className="text-[11px] text-zinc-600 mt-2 space-y-0.5">
            <p>
              <span className="font-semibold text-zinc-700">Date:</span> {invoice.date}
            </p>
            <p>
              <span className="font-semibold text-zinc-700">Due Date:</span> {invoice.dueDate}
            </p>
          </div>
          <div className="mt-2.5">
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge()}`}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="my-6 p-4 bg-zinc-50 border border-zinc-200 rounded">
        <p className="text-[10px] font-bold uppercase tracking-wider text-red mb-1">
          Billed To
        </p>
        <p className="text-sm font-bold text-zinc-900">
          {invoice.clientName || "Client Name"}
        </p>
        {invoice.clientCompany && (
          <p className="text-zinc-600 font-medium">{invoice.clientCompany}</p>
        )}
        <div className="text-[11px] text-zinc-500 mt-1 space-y-0.5">
          {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
          {invoice.clientCountry && <p>{invoice.clientCountry}</p>}
          {invoice.clientEmail && <p>Email: {invoice.clientEmail}</p>}
          {invoice.clientPhone && <p>Phone: {invoice.clientPhone}</p>}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto my-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-white text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3">Item / Service</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-center">Unit</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-400 italic">
                  No line items added yet.
                </td>
              </tr>
            ) : (
              invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? "bg-zinc-50/60" : ""}>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-zinc-900">{item.name || "Service"}</p>
                    {item.description && (
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-zinc-700">{item.quantity}</td>
                  <td className="py-3 px-3 text-center text-zinc-500">{item.unit}</td>
                  <td className="py-3 px-3 text-right text-zinc-700">
                    {formatMoney(item.unitPrice, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-zinc-900">
                    {formatMoney(item.total, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Grid: Payment Info + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-zinc-200">
        {/* Payment instructions */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red mb-2">
              Payment Details
            </p>
            <div className="flex flex-row justify-between items-start gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                {settings.upiId && (
                  <p className="truncate">
                    <span className="font-semibold text-zinc-700">UPI ID:</span> {settings.upiId}
                  </p>
                )}
                {settings.bankName && (
                  <p>
                    <span className="font-semibold text-zinc-700">Bank:</span> {settings.bankName}
                  </p>
                )}
                {settings.bankAccountName && (
                  <p>
                    <span className="font-semibold text-zinc-700">A/C Name:</span> {settings.bankAccountName}
                  </p>
                )}
                {settings.bankAccountNumber && (
                  <p>
                    <span className="font-semibold text-zinc-700">A/C No:</span> {settings.bankAccountNumber}
                  </p>
                )}
                {settings.bankIfsc && (
                  <p>
                    <span className="font-semibold text-zinc-700">IFSC:</span> {settings.bankIfsc}
                  </p>
                )}
                {settings.bankSwift && (
                  <p>
                    <span className="font-semibold text-zinc-700">SWIFT:</span> {settings.bankSwift}
                  </p>
                )}
              </div>

              {/* Payment QR Code Box */}
              {qrUrl ? (
                <div className="flex flex-col items-center justify-center shrink-0 w-[96px]">
                  <div className="w-[92px] h-[92px] bg-white border border-zinc-200 rounded p-1 flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-bold mt-1 text-center max-w-[96px] leading-tight">
                    {settings.qrCaption || "Scan to pay with any UPI app"}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Small grey hint if condition fails (Requirement 5) */}
            {!qrUrl && qrDecision.reason ? (
              <div className="mt-2.5 pt-2 border-t border-zinc-200/80 text-[10px] text-zinc-400 italic">
                QR note: {qrDecision.reason}
              </div>
            ) : null}

            {qrError ? (
              <div className="mt-2 text-[10px] text-red italic">
                QR error: {qrError}
              </div>
            ) : null}
          </div>

          {invoice.paymentInstructions && (
            <div className="mt-3 pt-3 border-t border-zinc-200">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">Notes / Terms:</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{invoice.paymentInstructions}</p>
            </div>
          )}
        </div>

        {/* Totals Summary */}
        <div className="border border-zinc-200 rounded overflow-hidden divide-y divide-zinc-200 text-xs">
          <div className="flex justify-between p-2.5">
            <span className="text-zinc-600">Subtotal</span>
            <span className="font-semibold text-zinc-900">
              {formatMoney(invoice.subtotal, currency)}
            </span>
          </div>

          {invoice.discountAmount > 0 && (
            <div className="flex justify-between p-2.5 text-red">
              <span>
                Discount {invoice.discountType === "percent" ? `(${invoice.discountValue}%)` : ""}
              </span>
              <span className="font-semibold">
                -{formatMoney(invoice.discountAmount, currency)}
              </span>
            </div>
          )}

          {invoice.taxEnabled && invoice.taxAmount > 0 && (
            <div className="flex justify-between p-2.5">
              <span className="text-zinc-600">Tax ({invoice.taxRate}%)</span>
              <span className="font-semibold text-zinc-900">
                +{formatMoney(invoice.taxAmount, currency)}
              </span>
            </div>
          )}

          {invoice.extraCharges > 0 && (
            <div className="flex justify-between p-2.5">
              <span className="text-zinc-600">{invoice.extraChargesLabel || "Extra Fee"}</span>
              <span className="font-semibold text-zinc-900">
                +{formatMoney(invoice.extraCharges, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between p-3 bg-red/10 text-red font-bold text-sm">
            <span>Grand Total</span>
            <span>{formatMoney(invoice.grandTotal, currency)}</span>
          </div>

          {invoice.advancePaid > 0 && (
            <div className="flex justify-between p-2.5 text-emerald-700">
              <span>Advance Paid</span>
              <span className="font-semibold">
                -{formatMoney(invoice.advancePaid, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between p-3 bg-zinc-900 text-white font-bold text-sm">
            <span>Balance Due</span>
            <span>{formatMoney(invoice.balanceDue, currency)}</span>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="mt-8 pt-4 border-t border-zinc-200 text-center text-[10px] text-zinc-400 italic">
        {settings.footerMessage || "Thank you for collaborating with SBX Studio. Every frame tells a story."}
      </div>
    </div>
  );
}
