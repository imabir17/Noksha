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
  const { addToBag, reservePiece, reserved, products, categories } = useStore();
  const liveProduct = products.find((p) => p.id === product.id) ?? product;
  const [finish, setFinish] = useState(0);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isCollectionPiece = Boolean(
    liveProduct.collectionId && liveProduct.collectionId.trim() !== ""
  );
  const stock = liveProduct.stockQty ?? 5;
  const maxSelectableQty = isCollectionPiece ? 1 : Math.min(10, Math.max(1, stock));

  const isSold =
    liveProduct.status === "sold" || (!isCollectionPiece && stock <= 0);
  const isUpcoming = isCollectionPiece && liveProduct.dropStatus === "upcoming";
  const isPrebooking =
    (isCollectionPiece && liveProduct.dropStatus === "prebooking") ||
    liveProduct.status === "waitlist";
  const isReserved = reserved.includes(liveProduct.id);

  const whatsapp = `https://wa.me/8801973673217?text=${encodeURIComponent(
    `Hello Noksha, I would like to enquire about “${liveProduct.name}” (${liveProduct.colors[finish]?.name}).`
  )}`;

  const categoryObj = categories.find((c) => c.id === liveProduct.category);
  const categoryLabel = categoryObj
    ? `${categoryObj.shortName} — ${categoryObj.name}`
    : liveProduct.category === "light-shades"
    ? "Alo — Light Shades"
    : liveProduct.category === "nakshi-kantha"
    ? "Kantha — Nakshi Kanthas"
    : "Wooden Jewelry Boxes";

  return (
    <>
      <main className="kantha-bg bg-paper pt-24 sm:pt-30">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-10 sm:pb-20">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline)] pb-6">
            <Link
              href="/#shop"
              className="link-draw eyebrow !tracking-[0.24em] text-ink-soft"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
              Back to The Pieces
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <span className="eyebrow !text-[0.6rem] text-mute">
                {categoryLabel}
              </span>
              {isCollectionPiece && (
                <Link
                  href={`/collections/${liveProduct.collectionId}`}
                  className="eyebrow bg-espresso px-3 py-1.5 !text-[0.56rem] text-gold-soft hover:opacity-90"
                >
                  <span className="font-num">{liveProduct.dropNumber || "Exclusive Drop"}</span>
                  {liveProduct.collectionName ? ` · ${liveProduct.collectionName}` : ""}
                </Link>
              )}
            </div>
          </div>

          {/* 2-Column Editorial Product View */}
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Image Frame */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
                <img
                  src={liveProduct.image}
                  alt={liveProduct.name}
                  className="h-full w-full object-cover"
                />
                <span className="eyebrow absolute left-5 top-5 bg-paper/92 px-3.5 py-2 !text-[0.58rem] text-ink backdrop-blur-sm">
                  <span className="font-num">{availabilityNote(liveProduct)}</span>
                </span>
                {isCollectionPiece && (
                  <Link
                    href={`/collections/${liveProduct.collectionId}`}
                    className="eyebrow absolute right-5 top-5 bg-espresso/90 px-3.5 py-2 !text-[0.56rem] text-gold-soft backdrop-blur-sm"
                  >
                    <span className="font-num">{liveProduct.dropNumber || "Drop"}</span> · 1 of 1
                  </Link>
                )}
              </div>
            </div>

            {/* Right Story & Purchase Details */}
            <div className="lg:col-span-5 lg:col-start-8 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow text-gold">
                  <span className="font-num">{availabilityNote(liveProduct)}</span>
                </p>
                {isCollectionPiece && (
                  <Link
                    href={`/collections/${liveProduct.collectionId}`}
                    className="eyebrow border border-gold/40 bg-cream px-2.5 py-1 !text-[0.55rem] text-ink hover:border-gold"
                  >
                    Collection: <span className="font-num">{liveProduct.dropNumber}</span> ·{" "}
                    {liveProduct.collectionName}
                  </Link>
                )}
              </div>

              <h1 className="font-display mt-5 text-4xl font-light leading-[1.04] sm:text-5xl lg:text-6xl">
                {liveProduct.name}
              </h1>

              <p className="font-bengali mt-3 text-xl font-light text-mute">
                {liveProduct.bengaliName}
              </p>

              <div className="mt-7 flex items-baseline gap-4">
                <p className="text-2xl tabular-nums text-ink">
                  {formatBDT(liveProduct.priceBDT)}
                </p>
                {!isCollectionPiece && !isSold && (
                  <span className="eyebrow !text-[0.58rem] text-river">
                    In stock (<span className="font-num">{stock}</span> available)
                  </span>
                )}
                {isCollectionPiece && (
                  <span className="eyebrow !text-[0.58rem] text-gold">
                    One of One Collector Piece
                  </span>
                )}
              </div>

              <p className="mt-8 text-[0.98rem] leading-[1.85] text-ink-soft">
                {liveProduct.story}
              </p>

              {/* Finish */}
              <div className="mt-10">
                <p className="eyebrow !text-[0.6rem] text-mute">
                  Finish — <span className="text-ink">{liveProduct.colors[finish]?.name}</span>
                </p>
                <div className="mt-4 flex gap-3">
                  {liveProduct.colors.map((c, i) => (
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
                {isSold ? (
                  <div className="border border-[var(--hairline)] bg-cream/60 p-6">
                    {isCollectionPiece ? (
                      <>
                        <p className="eyebrow text-gold">
                          {liveProduct.acquiredBy
                            ? `Acquired by ${liveProduct.acquiredBy}`
                            : "One of One · Acquired"}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                          {liveProduct.acquiredBy
                            ? `This one-of-one collector piece from ${
                                liveProduct.dropNumber || "our Exclusive Drop"
                              } has been delivered to the private collection of ${
                                liveProduct.acquiredBy
                              }. Because every collection piece is created only once, it will never be repeated.`
                            : "This one-of-one collector piece has been acquired. Once delivery is completed, the collector's name is permanently inscribed in our archive."}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="eyebrow text-alta">Sold out</p>
                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                          This store piece is currently out of stock. Speak with client care to be notified when the next workshop batch arrives.
                        </p>
                      </>
                    )}
                  </div>
                ) : isUpcoming ? (
                  isReserved ? (
                    <div className="swap-fade border border-[var(--hairline)] bg-cream/60 p-6">
                      <p className="eyebrow text-river">Drop Notification Registered</p>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        We have recorded your interest for{" "}
                        <span className="font-num">{liveProduct.dropNumber}</span>. Our concierge will notify you as soon as pre-booking opens.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim() && phone.trim()) {
                          reservePiece(liveProduct.id, name.trim(), phone.trim(), liveProduct.name);
                        }
                      }}
                      className="border border-[var(--hairline)] bg-cream/50 p-6"
                    >
                      <p className="eyebrow text-gold">
                        Upcoming Release · <span className="font-num">{liveProduct.dropNumber}</span>
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        This one-of-one piece belongs to{" "}
                        <strong>{liveProduct.collectionName || liveProduct.dropNumber}</strong>, which is currently in preview. Leave your details to receive private early access when pre-booking opens.
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
                      <button type="submit" className="press btn-solid mt-6 w-full cursor-pointer">
                        Notify Me When Drop Opens
                      </button>
                    </form>
                  )
                ) : isPrebooking ? (
                  isReserved ? (
                    <div className="swap-fade border border-[var(--hairline)] bg-cream/60 p-6">
                      <p className="eyebrow text-river">Pre-Booking Request Received</p>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        Your pre-booking request for this 1-of-1 piece from{" "}
                        <span className="font-num">{liveProduct.dropNumber || "Batch #02"}</span> is registered. Our client care team will contact you to confirm allocation.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim() && phone.trim()) {
                          reservePiece(liveProduct.id, name.trim(), phone.trim(), liveProduct.name);
                        }
                      }}
                    >
                      <p className="eyebrow text-gold mb-2">
                        {isCollectionPiece
                          ? `${liveProduct.dropNumber || "Drop"} · Open for Pre-Booking`
                          : "Batch Pre-Booking"}
                      </p>
                      <p className="text-sm leading-relaxed text-ink-soft">
                        {isCollectionPiece
                          ? "This 1-of-1 drop piece is currently open for pre-booking. Reserve without deposit — our atelier concierge will contact you directly to finalize your acquisition."
                          : "Currently in preparation for the next workshop batch. Reserve without deposit — we will contact you before release."}
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
                        Pre-Book This Piece
                      </button>
                    </form>
                  )
                ) : (
                  <div>
                    <div className="flex gap-3">
                      {!isCollectionPiece && (
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
                            onClick={() => setQty((q) => Math.min(maxSelectableQty, q + 1))}
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
                            liveProduct,
                            isCollectionPiece ? 1 : qty,
                            liveProduct.colors[finish]?.name ?? ""
                          )
                        }
                        className="press btn-solid flex-1 cursor-pointer"
                      >
                        {isCollectionPiece ? "Acquire 1-of-1 Piece" : "Add to bag"}
                      </button>
                    </div>
                    {isCollectionPiece ? (
                      <p className="mt-3 text-xs text-mute">
                        Exclusive 1-of-1 piece from{" "}
                        <span className="font-num">{liveProduct.dropNumber}</span> — created once, never repeated. Upon delivery, your name is recorded in our archive.
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-mute">
                        Signature store piece · <span className="font-num">{stock}</span> pieces currently available in stock.
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
                  ["Category", categoryLabel],
                  ...(isCollectionPiece
                    ? [
                        [
                          "Collection",
                          <Link
                            key="col-link"
                            href={`/collections/${liveProduct.collectionId}`}
                            className="text-gold hover:underline"
                          >
                            <span className="font-num">{liveProduct.dropNumber}</span> —{" "}
                            {liveProduct.collectionName} (One of One)
                          </Link>,
                        ],
                      ]
                    : [["Availability", `Store Edition · ${stock} in stock`]]),
                  ["Materials", liveProduct.materials],
                  ["Dimensions", liveProduct.dimensions],
                  [
                    "Made",
                    <React.Fragment key="made">
                      <span className="font-num">{liveProduct.artisanHours}</span> hours by hand
                    </React.Fragment>,
                  ],
                  ["Care", liveProduct.care],
                ].map(([k, v]) => (
                  <div key={String(k)} className="grid grid-cols-[7.5rem_1fr] gap-4 py-5">
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
                {related.map((item) => {
                  const itemIsCol = Boolean(item.collectionId && item.collectionId.trim() !== "");
                  return (
                    <Link key={item.id} href={`/pieces/${item.id}`} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="media-zoom h-full w-full object-cover"
                        />
                        <span className="eyebrow pointer-events-none absolute left-4 top-4 bg-paper/90 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                          <span className="font-num">{availabilityNote(item)}</span>
                        </span>
                        {itemIsCol && (
                          <span className="eyebrow pointer-events-none absolute right-4 top-4 bg-espresso/90 px-3 py-1.5 !text-[0.55rem] text-gold-soft backdrop-blur-sm">
                            <span className="font-num">{item.dropNumber || "Drop"}</span>
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
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
