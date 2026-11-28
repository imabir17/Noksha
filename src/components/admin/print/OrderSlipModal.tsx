"use client";

import React from "react";
import { Printer } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminOrder } from "../adminTypes";

interface OrderSlipModalProps {
  orders: AdminOrder[];
  onClose: () => void;
}

export default function OrderSlipModal({ orders, onClose }: OrderSlipModalProps) {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-8 print:static print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-8 print:space-y-0">
        <div className="admin-surface-enter bg-white text-neutral-900 border border-neutral-200 rounded-xl p-4 sm:px-8 flex items-center justify-between shadow-lg print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="admin-press px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-medium cursor-pointer"
          >
            ← Back to Orders
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="admin-press px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-200" />
            {orders.length === 1
              ? `Print / Save as PDF (${orders[0].id})`
              : `Print ${orders.length} Packing Slips`}
          </button>
        </div>

        {orders.map((printingSlipOrder, slipIdx) => (
          <div
            key={printingSlipOrder.id}
            className={`admin-surface-enter bg-white text-neutral-900 border border-neutral-200 rounded-xl p-8 sm:p-12 shadow-2xl print:border-0 print:shadow-none print:rounded-none ${
              slipIdx < orders.length - 1 ? "print:break-after-page" : ""
            }`}
          >
            {/* Slip Header */}
            <div className="flex items-start justify-between border-b border-neutral-300 pb-6">
              <div>
                <img
                  src="/brand/noksha-logo.png"
                  alt="NOKSHA"
                  className="h-12 w-auto object-contain"
                />
                <p className="font-num text-xs text-neutral-500 mt-2">
                  Noksha Online Atelier · Dhaka, Bangladesh · +880 1973-673217
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                  Invoice &amp; Packing Slip
                </p>
                <p className="font-num text-2xl font-bold mt-1">{printingSlipOrder.id}</p>
                <p className="font-num text-xs text-neutral-500 mt-1">
                  Date: {new Date(printingSlipOrder.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>

            {/* Recipient & Payment Meta */}
            <div className="grid grid-cols-2 gap-8 py-6 border-b border-neutral-300 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Deliver To
                </p>
                <p className="font-semibold text-base mt-1">{printingSlipOrder.customerName}</p>
                <p className="font-num text-neutral-700">{printingSlipOrder.customerPhone}</p>
                {printingSlipOrder.customerEmail && (
                  <p className="text-neutral-600">{printingSlipOrder.customerEmail}</p>
                )}
                <p className="text-neutral-700 mt-1">
                  {printingSlipOrder.address}, {printingSlipOrder.district}
                </p>
                {printingSlipOrder.notes && (
                  <p className="text-xs text-neutral-500 mt-1">Note: {printingSlipOrder.notes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Payment &amp; Dispatch
                </p>
                <p className="mt-1 font-medium uppercase">
                  Method: {printingSlipOrder.paymentMethod} ({printingSlipOrder.paymentStatus})
                </p>
                {printingSlipOrder.trxId && (
                  <p className="font-num text-xs text-neutral-600">
                    TrxID: {printingSlipOrder.trxId}
                  </p>
                )}
                <p className="text-xs text-neutral-600 mt-1 uppercase">
                  Order Status: {printingSlipOrder.status}
                </p>
                {printingSlipOrder.courierName && (
                  <p className="font-num text-xs text-neutral-700 mt-1">
                    Courier: {printingSlipOrder.courierName}{" "}
                    {printingSlipOrder.trackingCode ? `(${printingSlipOrder.trackingCode})` : ""}
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
                {printingSlipOrder.items.map((item, idx) => (
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
                  <span className="font-num">{formatBDT(printingSlipOrder.subtotalBDT)}</span>
                </div>
                {printingSlipOrder.discountBDT > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Courtesy ({printingSlipOrder.promoCode || "Discount"})</span>
                    <span className="font-num">− {formatBDT(printingSlipOrder.discountBDT)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">Delivery</span>
                  <span className="font-num">
                    {printingSlipOrder.deliveryBDT === 0
                      ? "Complimentary"
                      : formatBDT(printingSlipOrder.deliveryBDT)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-bold">
                  <span>Total (BDT)</span>
                  <span className="font-num">{formatBDT(printingSlipOrder.totalBDT)}</span>
                </div>
              </div>
            </div>

            {printingSlipOrder.giftNote && (
              <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 text-xs">
                <span className="font-semibold uppercase tracking-wider text-neutral-600">
                  Calligraphy Card Message:
                </span>{" "}
                <span className="italic">“{printingSlipOrder.giftNote}”</span>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span>Wrapped in unbleached kora muslin · Handcrafted in Bangladesh</span>
              <span>Thank you for collecting Noksha (নকশা)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
