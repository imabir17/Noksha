"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { availabilityNote } from "@/components/Shop";
import { Footer } from "@/components/Sections";
import { NokshaProduct, formatBDT } from "@/data/nokshaData";

interface ProductDetailViewProps {
  product: NokshaProduct;
  related: NokshaProduct[];
}

export default function ProductDetailView({ product, related }: ProductDetailViewProps) {
  const { addToBag, reservePiece, reserved } = useStore();
  const [finish, setFinish] = useState(0);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isReserve = product.status === "waitlist";
  const isReserved = reserved.includes(product.id);
  const isKantha = product.category === "nakshi-kantha";

  const whatsapp = `https://wa.me/8801700665742?text=${encodeURIComponent(
    `Hello Noksha, I would like to enquire about “${product.name}” (${product.colors[finish]?.name}).`
  )}`;

  const categoryLabel =
    product.category === "light-shades"
      ? "Alo — Light Shades"
      : product.category === "nakshi-kantha"
      ? "Kantha — Story Quilts"
      : "Shindook — Wooden Boxes";

  return (
    <>
      <main className="kantha-bg bg-paper pt-24 sm:pt-30">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-10 sm:pb-20">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-6">
            <Link
              href="/#shop"
              className="link-draw eyebrow !tracking-[0.24em] text-ink-soft"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
              Back to The Pieces
            </Link>
            <span className="eyebrow hidden !text-[0.6rem] text-mute sm:inline">
              {categoryLabel}
            </span>
          </div>

          {/* 2-Column Editorial Product View */}
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Image Frame */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                {(product.status !== "ready" || isKantha) && (
                  <span className="eyebrow absolute left-5 top-5 bg-paper/90 px-3.5 py-2 !text-[0.58rem] text-ink backdrop-blur-sm">
                    {availabilityNote(product)}
                  </span>
                )}
              </div>
            </div>

            {/* Right Story & Purchase Details */}
            <div className="lg:col-span-5 lg:col-start-8 flex flex-col justify-center">
              <p className="eyebrow text-gold">{availabilityNote(product)}</p>

              <h1 className="font-display mt-5 text-4xl font-light leading-[1.04] sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>

              <p className="font-bengali mt-3 text-xl font-light text-mute">
                {product.bengaliName}
              </p>

              <p className="mt-7 text-2xl tabular-nums text-ink">
                {formatBDT(product.priceBDT)}
              </p>

              <p className="mt-8 text-[0.98rem] leading-[1.85] text-ink-soft">
                {product.story}
              </p>

              {/* Finish */}
              <div className="mt-10">
                <p className="eyebrow !text-[0.6rem] text-mute">
                  Finish — <span className="text-ink">{product.colors[finish]?.name}</span>
                </p>
                <div className="mt-4 flex gap-3">
                  {product.colors.map((c, i) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setFinish(i)}
                      aria-label={c.name}
                      aria-pressed={i === finish}
                      className="press flex h-9 w-9 items-center justify-center rounded-full cursor-pointer"
                      style={{
                        boxShadow:
                          i === finish
                            ? "0 0 0 1px var(--color-ink)"
                            : "0 0 0 1px transparent",
                      }}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-black/10"
                        style={{ background: c.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="mt-10">
                {isReserve ? (
                  isReserved ? (
                    <div className="swap-fade border border-[var(--hairline)] p-6">
                      <p className="eyebrow text-river">Reserved</p>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        This piece is held for you from Batch No. 02. Our client care team will contact you before dispatch.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim() && phone.trim()) reservePiece(product.id);
                      }}
                    >
                      <p className="text-sm leading-relaxed text-ink-soft">
                        Currently in preparation for Batch No. 02. Reserve without deposit — we will contact you before release.
                      </p>
                      <input
                        className="field mt-4"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        aria-label="Your name"
                      />
                      <input
                        className="field"
                        type="tel"
                        placeholder="Phone / WhatsApp"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        aria-label="Phone"
                      />
                      <button type="submit" className="press btn-solid mt-8 w-full cursor-pointer">
                        Reserve this piece
                      </button>
                    </form>
                  )
                ) : (
                  <div>
                    <div className="flex gap-3">
                      {!isKantha && (
                        <div className="flex items-center border border-[var(--hairline)]">
                          <button
                            type="button"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            className="press h-full px-4 cursor-pointer"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty((q) => Math.min(5, q + 1))}
                            className="press h-full px-4 cursor-pointer"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          addToBag(
                            product,
                            isKantha ? 1 : qty,
                            product.colors[finish]?.name ?? ""
                          )
                        }
                        className="press btn-solid flex-1 cursor-pointer"
                      >
                        Add to bag
                      </button>
                    </div>
                    {isKantha && (
                      <p className="mt-3 text-xs text-mute">
                        Exclusive piece — one design created once, never repeated.
                      </p>
                    )}
                  </div>
                )}

                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-draw eyebrow mt-6 !tracking-[0.22em] text-ink-soft"
                >
                  Speak with client care <span className="arrow">→</span>
                </a>
              </div>

              {/* Specifications */}
              <dl className="mt-12 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                {[
                  ["Materials", product.materials],
                  ["Dimensions", product.dimensions],
                  [
                    "Made",
                    <React.Fragment key="made">
                      <span className="font-num">{product.artisanHours}</span> hours by hand
                    </React.Fragment>,
                  ],
                  ["Care", product.care],
                ].map(([k, v]) => (
                  <div key={String(k)} className="grid grid-cols-[7rem_1fr] gap-4 py-5">
                    <dt className="eyebrow !text-[0.6rem] pt-1 text-mute">{k}</dt>
                    <dd className="text-sm leading-relaxed text-ink-soft">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Related Pieces */}
          {related.length > 0 && (
            <section className="mt-16 border-t border-[var(--hairline)] pt-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-gold">Continue exploring</p>
                  <h2 className="font-display mt-3 text-4xl font-light sm:text-5xl">
                    Companion <em>pieces</em>
                  </h2>
                </div>
                <Link href="/#shop" className="link-draw eyebrow !tracking-[0.22em]">
                  View all <span className="arrow">→</span>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/pieces/${item.id}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="media-zoom h-full w-full object-cover"
                      />
                      {(item.status !== "ready" || item.category === "nakshi-kantha") && (
                        <span className="eyebrow pointer-events-none absolute left-4 top-4 bg-paper/90 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                          {availabilityNote(item)}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-2xl font-light leading-tight">
                          {item.name}
                        </h3>
                        <p className="font-bengali mt-1 text-sm text-mute">
                          {item.bengaliName}
                        </p>
                      </div>
                      <p className="shrink-0 pt-1 text-sm tabular-nums text-ink-soft">
                        {formatBDT(item.priceBDT)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
