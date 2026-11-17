"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { useStore } from "@/context/StoreContext";
import { NokshaProduct, PillarId, formatBDT } from "@/data/nokshaData";

export type CategoryFilter = "all" | "exclusive-drops" | PillarId;

export function availabilityNote(p: NokshaProduct) {
  const isCollectionPiece = Boolean(p.collectionId && p.collectionId.trim() !== "");

  if (isCollectionPiece) {
    if (p.status === "sold") {
      return p.acquiredBy ? `Acquired by ${p.acquiredBy}` : "One of One · Acquired";
    }
    if (p.dropStatus === "upcoming") {
      return "One of One · Upcoming Drop";
    }
    if (p.dropStatus === "prebooking" || p.status === "waitlist") {
      return "One of One · Pre-Booking";
    }
    return "One of One";
  }

  // Regular multi-stock store product
  const stock = p.stockQty ?? 5;
  if (p.status === "sold" || stock <= 0) {
    return "Sold out";
  }
  if (p.status === "waitlist") {
    return "Pre-order";
  }
  if (stock <= 3 || p.status === "limited") {
    return `Only ${stock} in stock`;
  }
  return `In stock · ${stock} available`;
}

interface ShopProps {
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
  onQuickAdd: (p: NokshaProduct) => void;
}

export default function Shop({ category, onCategory, onQuickAdd }: ShopProps) {
  const { products: allProducts, categories } = useStore();

  const products =
    category === "all"
      ? allProducts
      : category === "exclusive-drops"
      ? allProducts.filter((p) => Boolean(p.collectionId && p.collectionId.trim() !== ""))
      : allProducts.filter((p) => p.category === category);

  const dynamicTabs = [
    { id: "all" as CategoryFilter, label: "All pieces", bn: undefined },
    ...categories.map((c) => ({
      id: c.id as CategoryFilter,
      label: c.name,
      bn: c.shortName,
    })),
    { id: "exclusive-drops" as CategoryFilter, label: "Exclusive Drops", bn: "১/১" },
  ];

  // Sliding underline indicator, moved with transform only
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[category];
      if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [category, categories.length]);

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  return (
    <section id="shop" className="kantha-bg bg-paper px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="text-center">
          <p className="eyebrow text-gold">
            Curated Store &amp; Exclusive Drops
          </p>
          <h2 className="font-display mt-5 text-5xl font-light sm:text-7xl">
            The <em>pieces</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
            Browse our signature store categories with multi-piece availability alongside one-of-one collector pieces from our numbered Drops.
          </p>
        </Reveal>

        {/* Category Tabs */}
        <Reveal delay={100} className="mt-14 flex justify-center">
          <div className="relative flex gap-7 overflow-x-auto sm:gap-12" role="tablist">
            {dynamicTabs.map((t) => {
              const active = t.id === category;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => onCategory(t.id)}
                  className={`press whitespace-nowrap pb-4 cursor-pointer ${
                    active ? "text-ink" : "text-mute hover:text-ink"
                  }`}
                >
                  <span className="eyebrow !tracking-[0.22em]">{t.label}</span>
                  {t.bn && (
                    <span className="ml-2 text-xs text-gold/90">· {t.bn}</span>
                  )}
                </button>
              );
            })}
            <span className="absolute bottom-0 left-0 h-px w-full bg-[var(--hairline)]" />
            <span
              className="absolute bottom-0 left-0 h-px w-px origin-left bg-ink"
              style={{
                transform: `translateX(${indicator.x}px) scaleX(${indicator.w})`,
                transition: "transform 420ms var(--ease-in-out)",
              }}
            />
          </div>
        </Reveal>

        {/* Product Grid */}
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
          {products.map((p, i) => {
            const isCollectionPiece = Boolean(p.collectionId && p.collectionId.trim() !== "");
            const stock = p.stockQty ?? 5;
            const isSold = p.status === "sold" || (!isCollectionPiece && stock <= 0);
            const isPrebook =
              (isCollectionPiece && p.dropStatus === "prebooking") || p.status === "waitlist";
            const isUpcoming = isCollectionPiece && p.dropStatus === "upcoming";

            return (
              <Reveal key={`${category}-${p.id}`} as="article" delay={(i % 3) * 70} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                  <Link
                    href={`/pieces/${p.id}`}
                    className="block h-full w-full"
                    aria-label={`View ${p.name}`}
                  >
                    <img src={p.image} alt={p.name} className="media-zoom h-full w-full object-cover" />
                  </Link>

                  {/* Top-Left Status / Stock / One-of-One Badge */}
                  <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1.5">
                    <span className="eyebrow bg-paper/92 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                      <span className="font-num">{availabilityNote(p)}</span>
                    </span>
                  </div>

                  {/* Top-Right Collection Tag if item belongs to an Exclusive Drop */}
                  {isCollectionPiece && (
                    <Link
                      href={`/collections/${p.collectionId}`}
                      className="eyebrow absolute right-4 top-4 bg-espresso/90 px-3 py-1.5 !text-[0.56rem] text-gold-soft backdrop-blur-sm hover:bg-espresso transition-colors"
                    >
                      <span className="font-num">{p.dropNumber || "Exclusive Drop"}</span> · 1 of 1
                    </Link>
                  )}

                  {/* Hover Action Bar */}
                  {isSold ? (
                    <span className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/85 py-4 text-center text-paper/85 backdrop-blur-sm md:block">
                      {isCollectionPiece
                        ? p.acquiredBy
                          ? `Acquired by ${p.acquiredBy}`
                          : "Acquired"
                        : "Sold out"}
                    </span>
                  ) : isUpcoming ? (
                    <Link
                      href={`/pieces/${p.id}`}
                      className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-center text-paper backdrop-blur-sm hover:bg-ink md:block"
                    >
                      Upcoming Drop · View Piece
                    </Link>
                  ) : isPrebook ? (
                    <Link
                      href={`/pieces/${p.id}`}
                      className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-center text-paper backdrop-blur-sm hover:bg-ink md:block"
                    >
                      Pre-Book This Piece
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuickAdd(p)}
                      className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-paper backdrop-blur-sm hover:bg-ink md:block cursor-pointer"
                    >
                      {isCollectionPiece ? "Acquire 1-of-1 Piece" : "Add to bag"}
                    </button>
                  )}
                </div>

                <div className="mt-5">
                  {/* Category & Collection Tag Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="eyebrow !text-[0.55rem] text-mute">
                      {getCategoryName(p.category)}
                    </span>
                    {isCollectionPiece ? (
                      <Link
                        href={`/collections/${p.collectionId}`}
                        className="eyebrow !text-[0.55rem] text-gold hover:underline"
                      >
                        <span className="font-num">{p.dropNumber || "Drop"}</span>
                        {p.collectionName ? ` — ${p.collectionName}` : ""}
                      </Link>
                    ) : (
                      <span className="eyebrow !text-[0.55rem] text-mute">
                        {isSold ? (
                          <span className="text-alta">Sold out</span>
                        ) : (
                          <>
                            <span className="font-num">{stock}</span> in stock
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <Link href={`/pieces/${p.id}`} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h3 className="font-display text-[1.45rem] font-light leading-tight">
                          {p.name}
                        </h3>
                        <p className="font-bengali mt-1.5 text-sm text-mute">{p.bengaliName}</p>
                      </div>
                      <p className="shrink-0 pt-1 text-sm tabular-nums text-ink-soft">
                        {formatBDT(p.priceBDT)}
                      </p>
                    </div>

                    {isCollectionPiece && isSold && p.acquiredBy ? (
                      <p className="eyebrow mt-3 !text-[0.58rem] text-gold">
                        Acquired by {p.acquiredBy}
                      </p>
                    ) : (
                      <p className="eyebrow mt-3 !text-[0.58rem] text-mute">
                        <span className="font-num">{p.artisanHours}</span> hours by hand
                        {isCollectionPiece && " · One of One"}
                      </p>
                    )}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
