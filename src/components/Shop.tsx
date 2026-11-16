"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { NOKSHA_PRODUCTS, NokshaProduct, PillarId, formatBDT } from "@/data/nokshaData";

export type CategoryFilter = "all" | PillarId;

const TABS: { id: CategoryFilter; label: string; bn?: string }[] = [
  { id: "all", label: "All pieces" },
  { id: "light-shades", label: "Alo", bn: "আলো" },
  { id: "nakshi-kantha", label: "Kantha", bn: "কাঁথা" },
  { id: "jewelry-boxes", label: "Shindook", bn: "সিন্দুক" },
];

export function availabilityNote(p: NokshaProduct) {
  if (p.category === "nakshi-kantha") {
    return p.status === "waitlist" ? "One of one · By reservation" : "One of one";
  }
  if (p.status === "limited") return p.statusLabel.replace("Only ", "").replace(" Left", " remaining");
  if (p.status === "waitlist") return "By reservation";
  return "Available";
}

interface ShopProps {
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
  onQuickAdd: (p: NokshaProduct) => void;
}

export default function Shop({ category, onCategory, onQuickAdd }: ShopProps) {
  const products = category === "all" ? NOKSHA_PRODUCTS : NOKSHA_PRODUCTS.filter((p) => p.category === category);

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
  }, [category]);

  return (
    <section id="shop" className="kantha-bg bg-paper px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="text-center">
          <p className="eyebrow text-gold">
            Founding Batch · No. <span className="font-num">01</span>
          </p>
          <h2 className="font-display mt-5 text-5xl font-light sm:text-7xl">
            The <em>pieces</em>
          </h2>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={100} className="mt-14 flex justify-center">
          <div className="relative flex gap-8 overflow-x-auto sm:gap-14" role="tablist">
            {TABS.map((t) => {
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
                  className={`press whitespace-nowrap pb-4 cursor-pointer ${active ? "text-ink" : "text-mute hover:text-ink"}`}
                >
                  <span className="eyebrow !tracking-[0.26em]">{t.label}</span>
                  {t.bn && <span className="font-bengali ml-2 text-sm">{t.bn}</span>}
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

        {/* Grid */}
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
          {products.map((p, i) => (
            <Reveal key={`${category}-${p.id}`} as="article" delay={(i % 3) * 70} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                <Link
                  href={`/pieces/${p.id}`}
                  className="block h-full w-full"
                  aria-label={`View ${p.name}`}
                >
                  <img src={p.image} alt={p.name} className="media-zoom h-full w-full object-cover" />
                </Link>
                {(p.status !== "ready" || p.category === "nakshi-kantha") && (
                  <span className="eyebrow pointer-events-none absolute left-4 top-4 bg-paper/90 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                    {availabilityNote(p)}
                  </span>
                )}
                {p.status === "waitlist" ? (
                  <Link
                    href={`/pieces/${p.id}`}
                    className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-center text-paper backdrop-blur-sm hover:bg-ink md:block"
                  >
                    Reserve this piece
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onQuickAdd(p)}
                    className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-paper backdrop-blur-sm hover:bg-ink md:block cursor-pointer"
                  >
                    Add to bag
                  </button>
                )}
              </div>

              <Link href={`/pieces/${p.id}`} className="mt-6 block w-full text-left">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-display text-[1.45rem] font-light leading-tight">{p.name}</h3>
                    <p className="font-bengali mt-1.5 text-sm text-mute">{p.bengaliName}</p>
                  </div>
                  <p className="shrink-0 pt-1 text-sm tabular-nums text-ink-soft">{formatBDT(p.priceBDT)}</p>
                </div>
                <p className="eyebrow mt-4 !text-[0.58rem] text-mute">
                  <span className="font-num">{p.artisanHours}</span> hours by hand
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
