"use client";

import React, { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useOverlay } from "./Reveal";
import { BANGLADESH_DISTRICTS, NokshaProduct, PROMO_CODES, formatBDT } from "@/data/nokshaData";

export interface CartItem {
  product: NokshaProduct;
  quantity: number;
  selectedColor: string;
}

type Payment = "cod" | "bkash" | "whatsapp";

interface BagDrawerProps {
  items: CartItem[];
  promo: string | null;
  onPromo: (code: string | null) => void;
  onQty: (id: string, color: string, delta: number) => void;
  onRemove: (id: string, color: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const PAYMENTS: { id: Payment; title: string; note: string }[] = [
  { id: "cod", title: "Cash on delivery", note: "Pay when you have inspected your piece." },
  { id: "bkash", title: "bKash / Nagad", note: "Merchant 01700-665742 — enter your TrxID." },
  { id: "whatsapp", title: "Arrange with client care", note: "We will confirm details on WhatsApp." },
];

export default function BagDrawer({ items, promo, onPromo, onQty, onRemove, onClear, onClose }: BagDrawerProps) {
  useOverlay(true, onClose);
  const [step, setStep] = useState<"bag" | "details" | "done">("bag");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", district: "Dhaka", address: "", trx: "" });
  const [payment, setPayment] = useState<Payment>("cod");
  const [order, setOrder] = useState<{ id: string; total: number; name: string; items: CartItem[] } | null>(null);

  const subtotal = items.reduce((s, i) => s + i.product.priceBDT * i.quantity, 0);
  const discount = promo && PROMO_CODES[promo] ? Math.round(subtotal * PROMO_CODES[promo].discountRate) : 0;
  const delivery = subtotal === 0 || subtotal >= 8000 ? 0 : form.district === "Dhaka" ? 120 : 200;
  const total = subtotal - discount + delivery;

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrder({ id: `NK-${Math.floor(10000 + Math.random() * 89999)}`, total, name: form.name, items: [...items] });
    setStep("done");
    onClear();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="overlay-backdrop absolute inset-0 bg-[#140f0b]/45 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="overlay-drawer relative flex h-full w-full max-w-[480px] flex-col bg-paper">
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-[var(--hairline)] px-7">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <button type="button" onClick={() => setStep("bag")} className="press -ml-2 p-2 cursor-pointer" aria-label="Back">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
              </button>
            )}
            <p className="eyebrow">
              {step === "bag" ? "Your bag" : step === "details" ? "Delivery & payment" : "With gratitude"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="press -mr-2 p-2 cursor-pointer" aria-label="Close bag">
            <X className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7">
          {step === "bag" &&
            (items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <img src="/brand/noksha-mark.png" alt="" className="h-10 w-10 opacity-80" />
                <p className="font-display mt-6 text-3xl font-light">Your bag is empty.</p>
                <button type="button" onClick={onClose} className="link-draw eyebrow mt-8 !tracking-[0.22em] cursor-pointer">
                  Discover the pieces <span className="arrow">→</span>
                </button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-[var(--hairline)]">
                  {items.map((i) => (
                    <li key={`${i.product.id}-${i.selectedColor}`} className="flex gap-5 py-7">
                      <img src={i.product.image} alt="" className="h-28 w-[5.5rem] shrink-0 object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-4">
                          <p className="font-display text-xl font-light leading-tight">{i.product.name}</p>
                          <p className="shrink-0 text-sm tabular-nums">{formatBDT(i.product.priceBDT * i.quantity)}</p>
                        </div>
                        <p className="eyebrow mt-2 !text-[0.58rem] text-mute">{i.selectedColor}</p>
                        <div className="mt-auto flex items-center justify-between pt-4">
                          {i.product.category === "nakshi-kantha" ? (
                            <span className="eyebrow !text-[0.56rem] text-mute">One of one</span>
                          ) : (
                            <div className="flex items-center gap-4 text-sm">
                              <button type="button" className="press px-1 cursor-pointer" onClick={() => onQty(i.product.id, i.selectedColor, -1)} aria-label="Decrease">−</button>
                              <span className="tabular-nums">{i.quantity}</span>
                              <button type="button" className="press px-1 cursor-pointer" onClick={() => onQty(i.product.id, i.selectedColor, 1)} aria-label="Increase">+</button>
                            </div>
                          )}
                          <button type="button" onClick={() => onRemove(i.product.id, i.selectedColor)} className="nav-link eyebrow !text-[0.58rem] text-mute cursor-pointer">
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-[var(--hairline)] py-7">
                  <p className="eyebrow !text-[0.6rem] text-mute">A note for the calligraphy card</p>
                  <input className="field text-sm" placeholder="Optional — English or বাংলা" value={giftNote} onChange={(e) => setGiftNote(e.target.value)} aria-label="Gift note" />
                  <p className="mt-3 text-xs leading-relaxed text-mute">Every piece is wrapped in kora muslin with dried marigold, at no charge.</p>
                </div>

                <div className="border-t border-[var(--hairline)] py-7">
                  {promo ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-river">Founding courtesy applied — {promo}</span>
                      <button type="button" onClick={() => onPromo(null)} className="nav-link eyebrow !text-[0.58rem] text-mute cursor-pointer">Remove</button>
                    </div>
                  ) : (
                    <form
                      className="flex items-end gap-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const c = code.trim().toUpperCase();
                        if (PROMO_CODES[c]) {
                          onPromo(c);
                          setCodeError(false);
                        } else setCodeError(true);
                      }}
                    >
                      <input className="field text-sm uppercase" placeholder="Courtesy code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Courtesy code" />
                      <button type="submit" className="press eyebrow shrink-0 pb-3 cursor-pointer">Apply</button>
                    </form>
                  )}
                  {codeError && <p className="mt-3 text-xs text-alta">This code is not recognised.</p>}
                </div>
              </>
            ))}

          {step === "details" && (
            <form id="checkout" onSubmit={placeOrder} className="py-8">
              <p className="eyebrow !text-[0.6rem] text-mute">Recipient</p>
              <input className="field" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Full name" />
              <input className="field" type="tel" placeholder="Phone (+880)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone" />
              <select className="field cursor-pointer" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} aria-label="Division">
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input className="field" placeholder="House, road, area" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} aria-label="Address" />

              <p className="eyebrow mt-12 !text-[0.6rem] text-mute">Payment</p>
              <div className="mt-4 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                {PAYMENTS.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-start gap-4 py-5">
                    <input type="radio" name="payment" checked={payment === p.id} onChange={() => setPayment(p.id)} className="mt-1.5 accent-[#1E1915]" />
                    <span>
                      <span className="block text-sm">{p.title}</span>
                      <span className="mt-1 block text-xs text-mute">{p.note}</span>
                    </span>
                  </label>
                ))}
              </div>
              {payment === "bkash" && (
                <input className="field swap-fade" placeholder="Transaction ID" required value={form.trx} onChange={(e) => setForm({ ...form, trx: e.target.value })} aria-label="Transaction ID" />
              )}
            </form>
          )}

          {step === "done" && order && (
            <div className="swap-fade flex h-full flex-col justify-center py-10 text-center">
              <img src="/brand/noksha-mark.png" alt="" className="mx-auto h-12 w-12" />
              <p className="eyebrow mt-8 text-gold">
                Order <span className="font-num">{order.id}</span>
              </p>
              <p className="font-display mt-4 text-4xl font-light leading-tight">
                Thank you, <em>{order.name.split(" ")[0]}.</em>
              </p>
              <p className="mx-auto mt-6 max-w-xs text-sm leading-relaxed text-ink-soft">
                Your piece is being wrapped in our Dhaka atelier. Client care will call to confirm delivery within one day.
              </p>
              <div className="mx-auto mt-10 w-full max-w-xs border-t border-[var(--hairline)] pt-5 text-left">
                {order.items.map((i) => (
                  <div key={i.product.id + i.selectedColor} className="flex justify-between py-1.5 text-sm text-ink-soft">
                    <span className="truncate pr-4">{i.product.name} × {i.quantity}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-[var(--hairline)] pt-4 text-sm">
                  <span className="eyebrow !text-[0.6rem]">Total</span>
                  <span className="tabular-nums">{formatBDT(order.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && step !== "done" && (
          <div className="shrink-0 border-t border-[var(--hairline)] px-7 py-6">
            <div className="space-y-2 text-sm text-ink-soft">
              <Row label="Subtotal" value={formatBDT(subtotal)} />
              {discount > 0 && <Row label="Founding courtesy" value={`− ${formatBDT(discount)}`} />}
              <Row label="Delivery" value={delivery === 0 ? "Complimentary" : formatBDT(delivery)} />
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-[var(--hairline)] pt-4">
              <span className="eyebrow">Total</span>
              <span className="font-display text-2xl tabular-nums">{formatBDT(total)}</span>
            </div>
            {step === "bag" ? (
              <button type="button" onClick={() => setStep("details")} className="press btn-solid mt-6 w-full cursor-pointer">
                Continue
              </button>
            ) : (
              <button type="submit" form="checkout" className="press btn-solid mt-6 w-full cursor-pointer">
                Place order
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
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
