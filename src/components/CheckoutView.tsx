"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import PromoField from "@/components/PromoField";
import { Footer } from "@/components/Sections";
import { BANGLADESH_DISTRICTS, formatBDT } from "@/data/nokshaData";
import {
  FREE_DELIVERY_THRESHOLD,
  PaymentMethod,
  PlacedOrder,
  computePrice,
  isValidBdPhone,
} from "@/lib/pricing";

const PAYMENTS: { id: PaymentMethod; title: string; note: string }[] = [
  { id: "uddoktapay", title: "Pay Online (UddoktaPay)", note: "bKash, Nagad, Rocket, Upay or Card — Sandbox test gateway ready." },
  { id: "cod", title: "Cash on delivery", note: "Pay in taka when your piece arrives and you have inspected it." },
  { id: "bkash", title: "bKash / Nagad (Manual)", note: "Send the total to our merchant number, then enter your transaction ID." },
  { id: "whatsapp", title: "Arrange with client care", note: "We will confirm payment and delivery with you on WhatsApp." },
];

const MERCHANT_NUMBER = "01700-665742";
const CARE_NUMBER = "8801973673217";

type Errors = Partial<Record<"name" | "phone" | "email" | "address" | "trxId", string>>;

export default function CheckoutView() {
  const {
    hydrated,
    bag,
    promo,
    promoRules,
    giftNote,
    lastOrder,
    visitorId,
    sessionId,
    setPromo,
    updateQty,
    removeItem,
    clearBag,
    saveOrder,
    trackEvent,
    refreshStore,
  } = useStore();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    district: "Dhaka",
    address: "",
    notes: "",
    trxId: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [errors, setErrors] = useState<Errors>({});
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);

  // Handle UddoktaPay redirect callback (?uddoktapay=success&invoice_id=...&order_id=...)
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("uddoktapay");
    const invoiceId = params.get("invoice_id");
    const orderId = params.get("order_id");

    if (statusParam === "cancelled") {
      setGatewayNotice("Online payment was cancelled. You can retry with UddoktaPay or choose Cash on Delivery.");
      window.history.replaceState({}, "", "/checkout");
      return;
    }

    if (statusParam === "success" && invoiceId) {
      fetch("/api/payments/uddoktapay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, order_id: orderId }),
      })
        .then((r) => r.json())
        .then((res) => {
          const baseOrder = lastOrder;
          if (baseOrder) {
            const updatedOrder: PlacedOrder = {
              ...baseOrder,
              trxId: res.transaction_id || invoiceId,
            };
            saveOrder(updatedOrder);
            setPlaced(updatedOrder);
          }
          clearBag();
          refreshStore();
          window.history.replaceState({}, "", "/checkout");
        })
        .catch(() => {
          if (lastOrder) {
            setPlaced(lastOrder);
            clearBag();
          }
        });
    }
  }, [hydrated, lastOrder, saveOrder, clearBag, refreshStore]);

  // Remember delivery details between visits (not payment details).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("noksha_contact");
      if (saved) setForm((f) => ({ ...f, ...JSON.parse(saved) }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const price = computePrice(bag, promo, form.district, promoRules);
  const toFree = Math.max(0, FREE_DELIVERY_THRESHOLD - (price.subtotal - price.discount));

  // Sync checkout step progression for funnel & abandoned-cart tracking
  useEffect(() => {
    if (!hydrated || bag.length === 0) return;
    let step = "checkout_viewed";
    if (form.name.trim().length >= 2 && form.phone.trim().length >= 6) {
      step = "recipient_filled";
    }
    if (step === "recipient_filled" && form.address.trim().length >= 6) {
      step = "delivery_filled";
    }
    if (step === "delivery_filled" && (payment !== "bkash" || form.trxId.trim().length >= 4)) {
      step = "payment_selected";
    }

    const timer = setTimeout(() => {
      trackEvent("checkout_step", { path: "/checkout", step });
      fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_checkout",
          sessionId,
          visitorId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          district: form.district,
          address: form.address,
          lastStep: step,
          subtotalBDT: price.subtotal,
          items: bag.map((i) => ({
            name: i.product.name,
            priceBDT: i.product.priceBDT,
            quantity: i.quantity,
            selectedColor: i.selectedColor,
          })),
        }),
      }).catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [hydrated, bag, form.name, form.phone, form.email, form.district, form.address, form.trxId, payment, price.subtotal, sessionId, visitorId, trackEvent]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key as keyof Errors]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = (): Errors => {
    const er: Errors = {};
    if (form.name.trim().length < 2) er.name = "Please enter your full name.";
    if (!isValidBdPhone(form.phone)) er.phone = "Enter a Bangladesh mobile number, e.g. 01711 000000.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = "That email address looks incomplete.";
    if (form.address.trim().length < 8) er.address = "Please add house, road and area so we can deliver.";
    if (payment === "bkash" && form.trxId.trim().length < 6) er.trxId = "Enter the transaction ID from your bKash / Nagad receipt.";
    return er;
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length > 0) {
      document.querySelector<HTMLElement>("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const order: PlacedOrder = {
      id: `NK-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(10 + Math.random() * 89)}`,
      placedAt: new Date().toISOString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      district: form.district,
      address: form.address.trim(),
      notes: form.notes.trim(),
      payment,
      trxId: payment === "bkash" ? form.trxId.trim() : "",
      giftNote: giftNote.trim(),
      promoCode: promo ?? "",
      items: bag,
      price,
    };
    try {
      localStorage.setItem(
        "noksha_contact",
        JSON.stringify({ name: form.name, phone: form.phone, email: form.email, district: form.district, address: form.address })
      );
    } catch {
      // Ignore storage errors
    }

    setSubmitting(true);
    setGatewayNotice(null);

    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place_order",
          order,
          sessionId,
          visitorId,
        }),
      });
    } catch {
      // ignore
    }

    trackEvent("order_placed", { path: "/checkout", step: "order_completed" });
    saveOrder(order);

    if (payment === "uddoktapay") {
      try {
        const res = await fetch("/api/payments/uddoktapay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order, origin: window.location.origin }),
        });
        const data = await res.json();
        if (res.ok && data.payment_url) {
          window.location.href = data.payment_url;
          return;
        }
        setGatewayNotice(data.error || "Could not open UddoktaPay checkout. Please try again.");
        setSubmitting(false);
        return;
      } catch {
        setGatewayNotice("Network error connecting to UddoktaPay. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    refreshStore().catch(() => {});
    setPlaced(order);
    clearBag();
    setSubmitting(false);
    window.scrollTo({ top: 0 });
  };

  const field = (key: keyof Errors) => ({
    "data-error": errors[key] ? "true" : undefined,
    "aria-invalid": errors[key] ? true : undefined,
  });

  /* ───────── Confirmation ───────── */
  const confirmed = placed ?? null;
  if (confirmed) {
    return <Confirmation order={confirmed} />;
  }

  /* ───────── Loading / empty states ───────── */
  if (!hydrated) {
    return <main className="kantha-bg min-h-screen bg-paper" />;
  }

  if (bag.length === 0) {
    return (
      <>
        <main className="kantha-bg flex min-h-[80svh] items-center justify-center bg-paper px-5 pt-24">
          <div className="max-w-md text-center">
            <img src="/brand/noksha-mark.png" alt="" className="mx-auto h-12 w-12" />
            <h1 className="font-display mt-8 text-5xl font-light">Your bag is empty.</h1>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
              Add a piece to begin your order.
            </p>
            <Link href="/#shop" className="press btn-solid mt-10">
              Discover the pieces
            </Link>
            {lastOrder && (
              <p className="mt-10 text-xs text-mute">
                Your previous order <span className="font-num text-ink">{lastOrder.id}</span> was received.
              </p>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ───────── Checkout form ───────── */
  return (
    <>
      <main className="kantha-bg bg-paper pt-24 sm:pt-30">
        <div className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-10">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-6">
            <Link href="/#shop" className="link-draw eyebrow !tracking-[0.24em] text-ink-soft">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
              Continue browsing
            </Link>
            <p className="eyebrow !text-[0.6rem] text-mute">Secure checkout</p>
          </div>

          <h1 className="font-display mt-10 text-5xl font-light sm:text-6xl">Checkout</h1>

          <form onSubmit={placeOrder} noValidate className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-20">
            {/* Left: details */}
            <div className="lg:col-span-7">
              <Step n="01" title="Recipient" />
              <div className="grid gap-x-8 sm:grid-cols-2">
                <Field label="Full name" error={errors.name} className="sm:col-span-2">
                  <input className="field" autoComplete="name" value={form.name} onChange={set("name")} placeholder="As it should appear on the parcel" {...field("name")} />
                </Field>
                <Field label="Mobile number" error={errors.phone}>
                  <input className="field" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="01711 000000" {...field("phone")} />
                </Field>
                <Field label="Email (optional)" error={errors.email}>
                  <input className="field" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="For your receipt" {...field("email")} />
                </Field>
              </div>

              <Step n="02" title="Delivery" className="mt-14" />
              <div className="grid gap-x-8 sm:grid-cols-2">
                <Field label="Division / district">
                  <select className="field cursor-pointer" value={form.district} onChange={set("district")} autoComplete="address-level1">
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Delivery estimate">
                  <p className="border-b border-[var(--hairline)] py-[0.85rem] text-[0.95rem] text-ink-soft">
                    {form.district === "Dhaka" ? "1–2 working days" : "3–5 working days"}
                  </p>
                </Field>
                <Field label="Full address" error={errors.address} className="sm:col-span-2">
                  <input className="field" autoComplete="street-address" value={form.address} onChange={set("address")} placeholder="House, road, area, thana" {...field("address")} />
                </Field>
                <Field label="Delivery notes (optional)" className="sm:col-span-2">
                  <input className="field" value={form.notes} onChange={set("notes")} placeholder="Landmark, preferred time, gate instructions" />
                </Field>
              </div>

              <Step n="03" title="Payment" className="mt-14" />
              <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                {PAYMENTS.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-start gap-4 py-5">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === p.id}
                      onChange={() => setPayment(p.id)}
                      className="mt-1.5 accent-[#1E1915]"
                    />
                    <span className="flex-1">
                      <span className="block text-sm">{p.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-mute">{p.note}</span>
                    </span>
                  </label>
                ))}
              </div>

              {payment === "bkash" && (
                <div className="swap-fade mt-6 border border-[var(--hairline)] bg-paper/70 p-6">
                  <p className="eyebrow !text-[0.6rem] text-mute">Send exactly</p>
                  <p className="font-display mt-2 text-3xl font-light tabular-nums">{formatBDT(price.total)}</p>
                  <p className="mt-3 text-sm text-ink-soft">
                    to bKash / Nagad merchant <span className="font-num text-ink">{MERCHANT_NUMBER}</span>
                  </p>
                  <Field label="Transaction ID" error={errors.trxId} className="mt-4">
                    <input className="field uppercase" value={form.trxId} onChange={set("trxId")} placeholder="e.g. BGD9X72KLM" {...field("trxId")} />
                  </Field>
                </div>
              )}
            </div>

            {/* Right: summary */}
            <aside className="lg:col-span-5">
              <div className="border border-[var(--hairline)] bg-paper p-7 sm:p-9 lg:sticky lg:top-28">
                <p className="eyebrow">Your order</p>

                <ul className="mt-6 divide-y divide-[var(--hairline)]">
                  {bag.map((i) => (
                    <li key={`${i.product.id}-${i.selectedColor}`} className="flex gap-4 py-5">
                      <img src={i.product.image} alt="" className="h-24 w-[4.5rem] shrink-0 object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <p className="font-display text-lg font-light leading-tight">{i.product.name}</p>
                          <p className="shrink-0 text-sm tabular-nums">{formatBDT(i.product.priceBDT * i.quantity)}</p>
                        </div>
                        <p className="eyebrow mt-1.5 !text-[0.56rem] text-mute">{i.selectedColor}</p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          {i.product.category === "nakshi-kantha" ? (
                            <span className="eyebrow !text-[0.54rem] text-mute">One of one</span>
                          ) : (
                            <div className="flex items-center gap-3 text-sm">
                              <button type="button" className="press px-1 cursor-pointer" onClick={() => updateQty(i.product.id, i.selectedColor, -1)} aria-label="Decrease">−</button>
                              <span className="tabular-nums">{i.quantity}</span>
                              <button type="button" className="press px-1 cursor-pointer" onClick={() => updateQty(i.product.id, i.selectedColor, 1)} aria-label="Increase">+</button>
                            </div>
                          )}
                          <button type="button" onClick={() => removeItem(i.product.id, i.selectedColor)} className="nav-link eyebrow !text-[0.56rem] text-mute cursor-pointer">
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-[var(--hairline)] py-6">
                  <PromoField promo={promo} onPromo={setPromo} promoRules={promoRules} />
                </div>

                {giftNote.trim() && (
                  <p className="border-t border-[var(--hairline)] py-5 text-xs leading-relaxed text-mute">
                    Calligraphy card: <span className="italic text-ink-soft">“{giftNote.trim()}”</span>
                  </p>
                )}

                <div className="space-y-2 border-t border-[var(--hairline)] pt-6 text-sm text-ink-soft">
                  <Row label="Subtotal" value={formatBDT(price.subtotal)} />
                  {price.discount > 0 && <Row label="Founding courtesy" value={`− ${formatBDT(price.discount)}`} />}
                  <Row label="Delivery" value={price.delivery === 0 ? "Complimentary" : formatBDT(price.delivery)} />
                </div>
                {toFree > 0 && (
                  <p className="mt-3 text-xs text-mute">
                    Add <span className="tabular-nums text-ink">{formatBDT(toFree)}</span> for complimentary delivery.
                  </p>
                )}
                <div className="mt-5 flex items-baseline justify-between border-t border-[var(--hairline)] pt-5">
                  <span className="eyebrow">Total</span>
                  <span className="font-display text-3xl tabular-nums">{formatBDT(price.total)}</span>
                </div>

                {gatewayNotice && (
                  <p className="mt-4 border border-alta/40 bg-alta/10 px-4 py-3 text-xs text-alta">
                    {gatewayNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="press btn-solid mt-7 w-full cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? payment === "uddoktapay"
                      ? "Redirecting to UddoktaPay…"
                      : "Placing order…"
                    : payment === "uddoktapay"
                    ? "Proceed to UddoktaPay"
                    : "Place order"}
                </button>
                <p className="mt-4 text-center text-xs leading-relaxed text-mute">
                  Wrapped in kora muslin at no charge. We will contact you to confirm before dispatch.
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ───────── Confirmation view ───────── */
function Confirmation({ order }: { order: PlacedOrder }) {
  const paymentLabel =
    order.payment === "uddoktapay"
      ? "UddoktaPay (Online)"
      : order.payment === "cod"
      ? "Cash on delivery"
      : order.payment === "bkash"
      ? "bKash / Nagad"
      : "Arranged with client care";

  const lines = order.items
    .map((i) => `• ${i.product.name} (${i.selectedColor}) × ${i.quantity} — ${formatBDT(i.product.priceBDT * i.quantity)}`)
    .join("\n");
  const message = [
    `Hello Noksha, I have placed order ${order.id}.`,
    "",
    lines,
    "",
    `Total: ${formatBDT(order.price.total)} (${paymentLabel}${order.trxId ? `, TrxID ${order.trxId}` : ""})`,
    `Name: ${order.name}`,
    `Phone: ${order.phone}`,
    `Deliver to: ${order.address}, ${order.district}`,
    order.notes ? `Notes: ${order.notes}` : "",
    order.giftNote ? `Card message: ${order.giftNote}` : "",
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");

  return (
    <>
      <main className="kantha-bg bg-paper pt-24 sm:pt-30">
        <div className="mx-auto max-w-3xl px-5 pb-20 sm:px-10">
          <div className="swap-fade pt-10 text-center sm:pt-16">
            <img src="/brand/noksha-mark.png" alt="" className="mx-auto h-14 w-14" />
            <p className="eyebrow mt-8 text-gold">
              Order <span className="font-num">{order.id}</span>
            </p>
            <h1 className="font-display mt-4 text-5xl font-light leading-tight sm:text-6xl">
              Thank you, <em>{order.name.split(" ")[0]}.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-[0.98rem] leading-[1.8] text-ink-soft">
              Your order has been recorded. Please send it to our client care team on WhatsApp so we can confirm
              availability, payment and delivery with you.
            </p>
            <a
              href={`https://wa.me/${CARE_NUMBER}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press btn-solid mt-9"
            >
              Send order on WhatsApp
            </a>
          </div>

          <div className="mt-16 border border-[var(--hairline)] bg-paper p-7 sm:p-10">
            <ul className="divide-y divide-[var(--hairline)]">
              {order.items.map((i) => (
                <li key={`${i.product.id}-${i.selectedColor}`} className="flex gap-5 py-5">
                  <img src={i.product.image} alt="" className="h-24 w-[4.5rem] shrink-0 object-cover" />
                  <div className="flex flex-1 justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-light leading-tight">{i.product.name}</p>
                      <p className="eyebrow mt-2 !text-[0.56rem] text-mute">
                        {i.selectedColor} · Qty <span className="font-num">{i.quantity}</span>
                      </p>
                    </div>
                    <p className="shrink-0 text-sm tabular-nums">{formatBDT(i.product.priceBDT * i.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-[var(--hairline)] pt-6 text-sm text-ink-soft">
              <Row label="Subtotal" value={formatBDT(order.price.subtotal)} />
              {order.price.discount > 0 && <Row label="Founding courtesy" value={`− ${formatBDT(order.price.discount)}`} />}
              <Row label="Delivery" value={order.price.delivery === 0 ? "Complimentary" : formatBDT(order.price.delivery)} />
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-[var(--hairline)] pt-5">
              <span className="eyebrow">Total</span>
              <span className="font-display text-3xl tabular-nums">{formatBDT(order.price.total)}</span>
            </div>

            <dl className="mt-8 grid gap-6 border-t border-[var(--hairline)] pt-8 sm:grid-cols-2">
              <div>
                <dt className="eyebrow !text-[0.6rem] text-mute">Deliver to</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {order.name}
                  <br />
                  {order.address}, {order.district}
                  <br />
                  <span className="font-num">{order.phone}</span>
                </dd>
              </div>
              <div>
                <dt className="eyebrow !text-[0.6rem] text-mute">Payment</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {paymentLabel}
                  {order.trxId && (
                    <>
                      <br />
                      TrxID <span className="font-num">{order.trxId}</span>
                    </>
                  )}
                  <br />
                  Estimated delivery: {order.district === "Dhaka" ? "1–2" : "3–5"} working days
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-10 text-center">
            <Link href="/" className="link-draw eyebrow !tracking-[0.24em]">
              Return to Noksha <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ───────── Small helpers ───────── */
function Step({ n, title, className = "" }: { n: string; title: string; className?: string }) {
  return (
    <div className={`mb-4 flex items-baseline gap-5 border-b border-[var(--hairline)] pb-4 ${className}`}>
      <span className="font-num text-sm italic text-gold">{n}</span>
      <h2 className="font-display text-3xl font-light">{title}</h2>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block pt-5 ${className}`}>
      <span className="eyebrow !text-[0.6rem] text-mute">{label}</span>
      {children}
      {error && <span className="mt-2 block text-xs text-alta">{error}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
