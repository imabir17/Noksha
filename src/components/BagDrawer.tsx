"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useOverlay } from "./Reveal";
import PromoField from "./PromoField";
import { NokshaProduct, formatBDT } from "@/data/nokshaData";
import { FREE_DELIVERY_THRESHOLD, PromoRule, computePrice } from "@/lib/pricing";

export interface CartItem {
  product: NokshaProduct;
  quantity: number;
  selectedColor: string;
}

interface BagDrawerProps {
  items: CartItem[];
  promo: string | null;
  promoRules?: PromoRule[];
  giftNote: string;
  onPromo: (code: string | null) => void;
  onGiftNote: (note: string) => void;
  onQty: (id: string, color: string, delta: number) => void;
  onRemove: (id: string, color: string) => void;
  onClose: () => void;
}

export default function BagDrawer({
  items,
  promo,
  promoRules,
  giftNote,
  onPromo,
  onGiftNote,
  onQty,
  onRemove,
  onClose,
}: BagDrawerProps) {
  useOverlay(true, onClose);
  const { subtotal, discount } = computePrice(items, promo, "Dhaka", promoRules);
  const toFree = Math.max(0, FREE_DELIVERY_THRESHOLD - (subtotal - discount));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="overlay-backdrop absolute inset-0 bg-[#140f0b]/45 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="overlay-drawer relative flex h-full w-full max-w-[480px] flex-col bg-paper">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-[var(--hairline)] px-7">
          <p className="eyebrow">
            Your bag <span className="tabular-nums opacity-60">({items.reduce((s, i) => s + i.quantity, 0)})</span>
          </p>
          <button type="button" onClick={onClose} className="press -mr-2 p-2 cursor-pointer" aria-label="Close bag">
            <X className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <img src="/brand/noksha-mark.png" alt="" className="h-10 w-10 opacity-80" />
              <p className="font-display mt-6 text-3xl font-light">Your bag is empty.</p>
              <Link
                href="/#shop"
                onClick={onClose}
                className="link-draw eyebrow mt-8 !tracking-[0.22em]"
              >
                Discover the pieces <span className="arrow">→</span>
              </Link>
            </div>
          ) : (
            <>
              {toFree > 0 ? (
                <p className="border-b border-[var(--hairline)] py-5 text-xs leading-relaxed text-mute">
                  Add <span className="tabular-nums text-ink">{formatBDT(toFree)}</span> more for complimentary delivery.
                </p>
              ) : (
                <p className="border-b border-[var(--hairline)] py-5 text-xs text-river">
                  Complimentary delivery unlocked.
                </p>
              )}

              <ul className="divide-y divide-[var(--hairline)]">
                {items.map((i) => (
                  <li key={`${i.product.id}-${i.selectedColor}`} className="flex gap-5 py-7">
                    <Link href={`/pieces/${i.product.id}`} onClick={onClose} className="shrink-0">
                      <img src={i.product.image} alt="" className="h-28 w-[5.5rem] object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-4">
                        <p className="font-display text-xl font-light leading-tight">{i.product.name}</p>
                        <p className="shrink-0 text-sm tabular-nums">{formatBDT(i.product.priceBDT * i.quantity)}</p>
                      </div>
                      <p className="eyebrow mt-2 !text-[0.58rem] text-mute">
                        {i.selectedColor}
                        {i.product.collectionId
                          ? ` · ${i.product.dropNumber || "Exclusive Drop"}`
                          : ""}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        {i.product.collectionId ? (
                          <span className="eyebrow !text-[0.56rem] text-gold">One of one</span>
                        ) : (
                          <div className="flex items-center gap-4 text-sm">
                            <button type="button" className="press px-1 cursor-pointer" onClick={() => onQty(i.product.id, i.selectedColor, -1)} aria-label="Decrease">−</button>
                            <span className="tabular-nums">{i.quantity}</span>
                            <button type="button" className="press px-1 cursor-pointer" onClick={() => onQty(i.product.id, i.selectedColor, 1)} aria-label="Increase">+</button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemove(i.product.id, i.selectedColor)}
                          className="nav-link eyebrow !text-[0.58rem] text-mute cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[var(--hairline)] py-7">
                <p className="eyebrow !text-[0.6rem] text-mute">A note for the calligraphy card</p>
                <input
                  className="field text-sm"
                  placeholder="Optional — English or বাংলা"
                  value={giftNote}
                  onChange={(e) => onGiftNote(e.target.value)}
                  aria-label="Gift note"
                  maxLength={140}
                />
                <p className="mt-3 text-xs leading-relaxed text-mute">
                  Every piece is wrapped in kora muslin with dried marigold, at no charge.
                </p>
              </div>

              <div className="border-t border-[var(--hairline)] py-7">
                <PromoField promo={promo} onPromo={onPromo} promoRules={promoRules} />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-[var(--hairline)] px-7 py-6">
            <div className="space-y-2 text-sm text-ink-soft">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Founding courtesy</span>
                  <span className="tabular-nums">− {formatBDT(discount)}</span>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-mute">Delivery is calculated at checkout.</p>
            <Link href="/checkout" onClick={onClose} className="press btn-solid mt-5 w-full">
              Proceed to checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
