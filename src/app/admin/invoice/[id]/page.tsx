import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSessionTokenFromCookies } from "@/lib/auth";
import { getDb, getSessionUser } from "@/lib/db";
import { formatBDT } from "@/data/nokshaData";
import PrintInvoiceControls from "./PrintInvoiceControls";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getSessionTokenFromCookies();
  const user = getSessionUser(token);
  if (!user) {
    redirect("/admin");
  }

  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | {
        id: string;
        customer_name: string;
        customer_phone: string;
        customer_email: string;
        district: string;
        address: string;
        notes: string;
        payment_method: string;
        payment_status: string;
        trx_id: string;
        gift_note: string;
        promo_code: string;
        subtotal_bdt: number;
        discount_bdt: number;
        delivery_bdt: number;
        total_bdt: number;
        status: string;
        courier_name: string;
        tracking_code: string;
        items_json: string;
        created_at: string;
      }
    | undefined;

  if (!row) {
    notFound();
  }

  let items: {
    name: string;
    priceBDT: number;
    quantity: number;
    selectedColor: string;
  }[] = [];
  try {
    items = JSON.parse(row.items_json);
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-6 sm:p-12 print:p-0">
      <div className="max-w-3xl mx-auto border border-neutral-300 p-8 sm:p-12 print:border-0">
        <PrintInvoiceControls orderId={row.id} />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-300 pb-6">
          <div>
            <img
              src="/brand/noksha-logo.png"
              alt="NOKSHA"
              className="h-12 w-auto object-contain"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Noksha Online Atelier · Dhaka, Bangladesh · +880 1700-665742
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              Invoice &amp; Packing Slip
            </p>
            <p className="font-num text-2xl font-bold mt-1">{row.id}</p>
            <p className="font-num text-xs text-neutral-500 mt-1">
              Date: {new Date(row.created_at).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        {/* Recipient & Payment Meta */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-neutral-300 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
              Deliver To
            </p>
            <p className="font-semibold text-base mt-1">{row.customer_name}</p>
            <p className="font-num text-neutral-700">{row.customer_phone}</p>
            {row.customer_email && <p className="text-neutral-600">{row.customer_email}</p>}
            <p className="text-neutral-700 mt-1">
              {row.address}, {row.district}
            </p>
            {row.notes && (
              <p className="text-xs text-neutral-500 mt-1">Note: {row.notes}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
              Payment &amp; Dispatch
            </p>
            <p className="mt-1 font-medium uppercase">
              Method: {row.payment_method} ({row.payment_status})
            </p>
            {row.trx_id && (
              <p className="font-num text-xs text-neutral-600">TrxID: {row.trx_id}</p>
            )}
            <p className="text-xs text-neutral-600 mt-1 uppercase">
              Order Status: {row.status}
            </p>
            {row.courier_name && (
              <p className="text-xs text-neutral-700 mt-1">
                Courier: {row.courier_name}{" "}
                {row.tracking_code ? `(${row.tracking_code})` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-sm my-6 border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="py-2.5">Piece</th>
              <th className="py-2.5">Finish</th>
              <th className="py-2.5 text-center">Qty</th>
              <th className="py-2.5 text-right">Unit Price</th>
              <th className="py-2.5 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3 text-neutral-600">{item.selectedColor}</td>
                <td className="py-3 text-center font-num">{item.quantity}</td>
                <td className="py-3 text-right font-num">{formatBDT(item.priceBDT)}</td>
                <td className="py-3 text-right font-num font-semibold">
                  {formatBDT(item.priceBDT * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end border-t border-neutral-300 pt-4">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-num">{formatBDT(row.subtotal_bdt)}</span>
            </div>
            {row.discount_bdt > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Courtesy ({row.promo_code || "Discount"})</span>
                <span className="font-num">− {formatBDT(row.discount_bdt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-600">Delivery</span>
              <span className="font-num">
                {row.delivery_bdt === 0 ? "Complimentary" : formatBDT(row.delivery_bdt)}
              </span>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-bold">
              <span>Total (BDT)</span>
              <span className="font-num">{formatBDT(row.total_bdt)}</span>
            </div>
          </div>
        </div>

        {/* Calligraphy Note */}
        {row.gift_note && (
          <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 text-xs">
            <span className="font-semibold uppercase tracking-wider text-neutral-600">
              Calligraphy Card Message:
            </span>{" "}
            <span className="italic">“{row.gift_note}”</span>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Wrapped in unbleached kora muslin · Handcrafted in Bangladesh</span>
          <span>Thank you for collecting Noksha (নকশা)</span>
        </div>
      </div>
    </div>
  );
}
