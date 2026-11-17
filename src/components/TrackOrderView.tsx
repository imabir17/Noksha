"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Download, Package, Search, Truck, XCircle } from "lucide-react";
import { Footer } from "./Sections";
import { formatBDT } from "@/data/nokshaData";

interface TrackedOrder {
  id: string;
  customerName: string;
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
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const lookupOrder = useCallback(async (idInput: string) => {
    const clean = idInput.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError("");
    setCancelFeedback(null);
    setShowCancelForm(false);
    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found.");
        setOrder(null);
      } else {
        setOrder(data.order || null);
      }
    } catch {
      setError("Network error while looking up order.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("order") || params.get("orderId");
    if (idParam) {
      setOrderNumber(idParam);
      lookupOrder(idParam);
    }
  }, [lookupOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrder(orderNumber);
  };

  const handleCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCancelFeedback(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phone: verifyPhone.trim(),
          reason: cancelReason.trim() || "Customer requested cancellation before dispatch",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelFeedback({
          ok: false,
          msg: data.error || "Unable to submit cancellation request.",
        });
      } else {
        setCancelFeedback({
          ok: true,
          msg: "Cancellation request submitted. Our team will confirm shortly.",
        });
        setShowCancelForm(false);
        setCancelReason("");
        setVerifyPhone("");
        lookupOrder(order.id);
      }
    } catch {
      setCancelFeedback({ ok: false, msg: "Network error submitting request." });
    }
  };

  const isShippedOrDone = order ? ["shipped", "delivered", "cancelled"].includes(order.status) : false;
  const canCancel = order ? !isShippedOrDone && !order.cancellationRequested : false;
  const currentStepIdx = order ? PIPELINE_STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <>
      <main className="kantha-bg bg-paper pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-10">
          {/* Header & Search */}
          <div className="text-center border-b border-[var(--hairline)] pb-10 print:hidden">
            <p className="eyebrow text-gold">Order Concierge</p>
            <h1 className="font-display mt-4 text-5xl font-light sm:text-6xl">
              Track &amp; <em>Manage Order</em>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
              Enter your Order Number (e.g. <span className="font-num text-ink">NK-84K21</span>) to check live progress, save your order details as PDF, or request a cancellation before shipment.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Order Number (e.g. NK-84K21)"
                className="flex-1 border border-[var(--hairline)] bg-cream/60 px-4 py-3 text-sm uppercase text-ink placeholder:normal-case placeholder:text-mute focus:border-ink focus:outline-none font-num"
                aria-label="Order Number"
              />
              <button
                type="submit"
                disabled={loading}
                className="press btn-solid inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                {loading ? "Searching…" : "Track Order"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-sm text-alta">{error}</p>
            )}
          </div>

          {/* Single Order Result */}
          {order && (
            <div className="mt-12">
              <article className="border border-[var(--hairline)] bg-paper p-6 sm:p-10 space-y-8">
                {/* Print Letterhead */}
                <div className="hidden print:flex items-center justify-between border-b border-[var(--hairline)] pb-6">
                  <div>
                    <p className="font-display text-2xl">NOKSHA · নকশা</p>
                    <p className="eyebrow !text-[0.55rem] text-mute mt-1">Order Details &amp; Status</p>
                  </div>
                  <div className="text-right text-xs text-mute">
                    <p className="font-num text-ink font-medium">{order.id}</p>
                    <p className="font-num">{new Date(order.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>

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
                    <dt className="eyebrow !text-[0.58rem] text-mute">Delivery Destination</dt>
                    <dd className="mt-2 text-ink-soft leading-relaxed">
                      {order.address}, {order.district}
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

                {/* Cancellation Section (Only allowed before shipped; verified by ordering phone number) */}
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
                    showCancelForm ? (
                      <form
                        onSubmit={handleCancelRequest}
                        className="border border-[var(--hairline)] bg-cream/60 p-5 space-y-4"
                      >
                        <p className="eyebrow !text-[0.6rem] text-ink">
                          Request Cancellation for Order <span className="font-num">{order.id}</span>
                        </p>
                        <p className="text-xs text-ink-soft">
                          To verify ownership, please enter the mobile number used while placing this order.
                        </p>
                        <input
                          type="tel"
                          required
                          value={verifyPhone}
                          onChange={(e) => setVerifyPhone(e.target.value)}
                          placeholder="Phone number used while ordering (e.g. 01711 000000)"
                          className="w-full border border-[var(--hairline)] bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none font-num"
                        />
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Reason for cancellation (optional)"
                          className="w-full border border-[var(--hairline)] bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            className="press bg-alta px-5 py-2.5 eyebrow !text-[0.58rem] text-paper cursor-pointer"
                          >
                            Confirm Cancellation Request
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelForm(false);
                              setCancelReason("");
                              setVerifyPhone("");
                            }}
                            className="press border border-[var(--hairline)] px-4 py-2.5 eyebrow !text-[0.58rem] text-ink-soft cursor-pointer"
                          >
                            Keep Order
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-xs text-mute">
                          Need to cancel? Cancellation requests are accepted until the order is shipped.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCancelForm(true)}
                          className="press border border-alta/50 px-4 py-2 eyebrow !text-[0.56rem] text-alta hover:bg-alta hover:text-paper transition-colors cursor-pointer"
                        >
                          Request Cancellation
                        </button>
                      </div>
                    )
                  ) : null}

                  {cancelFeedback && (
                    <p
                      className={`mt-3 flex items-center gap-2 text-xs ${
                        cancelFeedback.ok ? "text-river" : "text-alta"
                      }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {cancelFeedback.msg}
                    </p>
                  )}
                </div>

                <div className="pt-2 text-center print:hidden">
                  <Link href="/shop" className="link-draw eyebrow !text-[0.58rem] text-ink-soft">
                    Continue Shopping <span className="arrow">→</span>
                  </Link>
                </div>
              </article>
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
