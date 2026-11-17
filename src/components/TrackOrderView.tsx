"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Download, Package, Search, Truck, XCircle } from "lucide-react";
import { Footer } from "./Sections";
import { formatBDT } from "@/data/nokshaData";

interface TrackedOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  district: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  trxId: string;
  giftNote: string;
  subtotalBDT: number;
  discountBDT: number;
  deliveryBDT: number;
  totalBDT: number;
  status: string;
  courierName: string;
  trackingCode: string;
  items: {
    productId?: string;
    name: string;
    priceBDT: number;
    quantity: number;
    selectedColor: string;
    image?: string;
  }[];
  timeline: { status: string; at: string; by: string; note: string }[];
  cancellationRequested: boolean;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}

const PIPELINE_STEPS = [
  { key: "new", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function TrackOrderView() {
  const [phone, setPhone] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const lookupOrders = useCallback(async (phoneInput: string) => {
    const clean = phoneInput.trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not look up orders.");
        setOrders([]);
      } else {
        setOrders(data.orders || []);
        setSearchedPhone(clean);
      }
    } catch {
      setError("Network error while looking up orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("phone");
    if (p) {
      setPhone(p);
      lookupOrders(p);
    }
  }, [lookupOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrders(phone);
  };

  const handleCancelRequest = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          phone: searchedPhone || phone,
          reason: cancelReason.trim() || "Customer requested cancellation before dispatch",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelFeedback((prev) => ({
          ...prev,
          [orderId]: { ok: false, msg: data.error || "Unable to submit cancellation request." },
        }));
      } else {
        setCancelFeedback((prev) => ({
          ...prev,
          [orderId]: {
            ok: true,
            msg: "Cancellation request submitted. Our team will confirm shortly.",
          },
        }));
        setCancelOrderId(null);
        setCancelReason("");
        lookupOrders(searchedPhone || phone);
      }
    } catch {
      setCancelFeedback((prev) => ({
        ...prev,
        [orderId]: { ok: false, msg: "Network error submitting request." },
      }));
    }
  };

  return (
    <>
      <main className="kantha-bg bg-paper pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-10">
          {/* Header */}
          <div className="text-center border-b border-[var(--hairline)] pb-10 print:hidden">
            <p className="eyebrow text-gold">Order Concierge</p>
            <h1 className="font-display mt-4 text-5xl font-light sm:text-6xl">
              Track &amp; <em>Manage Order</em>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
              Enter the mobile number you used while placing your order to check live progress, save your order details as PDF, or request a cancellation before shipment.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01711 000000"
                className="flex-1 border border-[var(--hairline)] bg-cream/60 px-4 py-3 text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none font-num"
                aria-label="Phone number used while ordering"
              />
              <button
                type="submit"
                disabled={loading}
                className="press btn-solid inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                {loading ? "Searching…" : "Find Orders"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-sm text-alta">{error}</p>
            )}
          </div>

          {/* Results */}
          {searchedPhone && !loading && orders.length === 0 && !error && (
            <div className="py-16 text-center">
              <p className="font-display text-3xl font-light text-ink-soft">
                No orders found for <span className="font-num text-ink">{searchedPhone}</span>.
              </p>
              <p className="mt-3 text-sm text-mute">
                Please double-check the phone number you entered at checkout, or{" "}
                <Link href="/shop" className="text-ink underline">
                  continue shopping
                </Link>
                .
              </p>
            </div>
          )}

          {orders.length > 0 && (
            <div className="mt-12 space-y-12">
              {orders.map((order) => {
                const isShippedOrDone = ["shipped", "delivered", "cancelled"].includes(order.status);
                const canCancel = !isShippedOrDone && !order.cancellationRequested;
                const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.key === order.status);
                const fb = cancelFeedback[order.id];

                return (
                  <article
                    key={order.id}
                    className="border border-[var(--hairline)] bg-paper p-6 sm:p-10 space-y-8"
                  >
                    {/* Top Row */}
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--hairline)] pb-6">
                      <div>
                        <p className="eyebrow text-gold">
                          Order <span className="font-num">{order.id}</span>
                        </p>
                        <h2 className="font-display mt-2 text-3xl font-light">
                          {order.customerName}
                        </h2>
                        <p className="mt-1 text-xs text-mute font-num">
                          Placed on {new Date(order.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 print:hidden">
                        <span
                          className={`eyebrow px-3 py-1.5 !text-[0.58rem] border ${
                            order.status === "cancelled"
                              ? "border-alta/40 bg-alta/10 text-alta"
                              : order.status === "delivered"
                              ? "border-river/40 bg-river/10 text-river"
                              : "border-gold/40 bg-cream text-ink"
                          }`}
                        >
                          Status: {order.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="press inline-flex items-center gap-1.5 border border-ink px-4 py-2 eyebrow !text-[0.56rem] text-ink hover:bg-ink hover:text-paper transition-colors cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Save PDF
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {order.status !== "cancelled" ? (
                      <div className="grid grid-cols-5 gap-2">
                        {PIPELINE_STEPS.map((st, idx) => {
                          const done = idx <= currentStepIdx;
                          return (
                            <div key={st.key} className="space-y-2">
                              <div
                                className={`h-1.5 w-full ${
                                  done ? "bg-ink" : "bg-[var(--hairline)]"
                                }`}
                              />
                              <p
                                className={`eyebrow !text-[0.52rem] ${
                                  done ? "text-ink" : "text-mute"
                                }`}
                              >
                                {st.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 border border-alta/30 bg-alta/5 p-4 text-sm text-alta">
                        <XCircle className="h-4 w-4 shrink-0" />
                        This order has been cancelled.
                      </div>
                    )}

                    {/* Courier Tracking */}
                    {(order.courierName || order.trackingCode) && (
                      <div className="flex flex-wrap items-center gap-3 border border-[var(--hairline)] bg-cream/60 p-4 text-sm">
                        <Truck className="h-4 w-4 text-gold shrink-0" />
                        <span>
                          Courier: <strong>{order.courierName || "Assigned"}</strong>
                        </span>
                        {order.trackingCode && (
                          <span className="font-num text-ink-soft">
                            · Tracking Code: <strong className="text-ink">{order.trackingCode}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Items & Totals */}
                    <div>
                      <ul className="divide-y divide-[var(--hairline)]">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between gap-4 py-4">
                            <div className="flex items-center gap-4">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-12 object-cover bg-sand shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-display text-lg font-light">{item.name}</p>
                                <p className="eyebrow mt-1 !text-[0.55rem] text-mute">
                                  {item.selectedColor} · Qty <span className="font-num">{item.quantity}</span>
                                </p>
                              </div>
                            </div>
                            <p className="text-sm tabular-nums text-ink">
                              {formatBDT(item.priceBDT * item.quantity)}
                            </p>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 space-y-1.5 border-t border-[var(--hairline)] pt-4 text-sm text-ink-soft">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="tabular-nums">{formatBDT(order.subtotalBDT)}</span>
                        </div>
                        {order.discountBDT > 0 && (
                          <div className="flex justify-between">
                            <span>Discount</span>
                            <span className="tabular-nums">− {formatBDT(order.discountBDT)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Delivery ({order.district})</span>
                          <span className="tabular-nums">
                            {order.deliveryBDT === 0 ? "Complimentary" : formatBDT(order.deliveryBDT)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--hairline)] pt-3 text-base text-ink font-medium">
                          <span>Total</span>
                          <span className="font-display text-2xl tabular-nums">
                            {formatBDT(order.totalBDT)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery & Payment Summary */}
                    <dl className="grid gap-6 border-t border-[var(--hairline)] pt-6 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="eyebrow !text-[0.58rem] text-mute">Delivery Address</dt>
                        <dd className="mt-2 text-ink-soft leading-relaxed">
                          {order.address}, {order.district}
                          <br />
                          <span className="font-num">{order.customerPhone}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow !text-[0.58rem] text-mute">Payment</dt>
                        <dd className="mt-2 text-ink-soft leading-relaxed uppercase">
                          {order.paymentMethod} · {order.paymentStatus}
                          {order.trxId && (
                            <span className="block font-num text-ink normal-case mt-0.5">
                              TrxID: {order.trxId}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    {/* Cancellation Section (Only allowed before shipped) */}
                    <div className="border-t border-[var(--hairline)] pt-6 print:hidden">
                      {order.cancellationRequested ? (
                        <div className="flex items-start gap-3 border border-gold/40 bg-cream/70 p-4 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-ink">
                              Cancellation Request Submitted
                            </p>
                            {order.cancellationReason && (
                              <p className="mt-1 text-xs text-ink-soft">
                                Reason: “{order.cancellationReason}”
                              </p>
                            )}
                          </div>
                        </div>
                      ) : isShippedOrDone ? (
                        <div className="flex items-center gap-2.5 text-xs text-mute">
                          <Package className="h-4 w-4 shrink-0" />
                          {order.status === "cancelled"
                            ? "This order has been cancelled."
                            : "This order has already been shipped — cancellation requests are no longer accepted."}
                        </div>
                      ) : canCancel ? (
                        cancelOrderId === order.id ? (
                          <div className="border border-[var(--hairline)] bg-cream/60 p-5 space-y-4">
                            <p className="eyebrow !text-[0.6rem] text-ink">
                              Request Cancellation for Order <span className="font-num">{order.id}</span>
                            </p>
                            <input
                              type="text"
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Optional reason for cancellation..."
                              className="w-full border border-[var(--hairline)] bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                            />
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => handleCancelRequest(order.id)}
                                className="press bg-alta px-5 py-2.5 eyebrow !text-[0.58rem] text-paper cursor-pointer"
                              >
                                Confirm Cancellation Request
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelOrderId(null);
                                  setCancelReason("");
                                }}
                                className="press border border-[var(--hairline)] px-4 py-2.5 eyebrow !text-[0.58rem] text-ink-soft cursor-pointer"
                              >
                                Keep Order
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-xs text-mute">
                              Need to cancel? Cancellation requests are accepted until the order is shipped.
                            </p>
                            <button
                              type="button"
                              onClick={() => setCancelOrderId(order.id)}
                              className="press border border-alta/50 px-4 py-2 eyebrow !text-[0.56rem] text-alta hover:bg-alta hover:text-paper transition-colors cursor-pointer"
                            >
                              Request Cancellation
                            </button>
                          </div>
                        )
                      ) : null}

                      {fb && (
                        <p
                          className={`mt-3 flex items-center gap-2 text-xs ${
                            fb.ok ? "text-river" : "text-alta"
                          }`}
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fb.msg}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
