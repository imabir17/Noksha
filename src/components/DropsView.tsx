"use client";

import React from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { Footer } from "./Sections";
import { getDropStatusLabel } from "./CollectionDetailView";
import { availabilityNote } from "./Shop";
import { StoreCollection, useStore } from "@/context/StoreContext";
import { NokshaProduct, formatBDT } from "@/data/nokshaData";

interface DropsViewProps {
  initialCollections: StoreCollection[];
  initialProducts: NokshaProduct[];
}

export default function DropsView({
  initialCollections,
  initialProducts,
}: DropsViewProps) {
  const { collections, products, categories, siteContent } = useStore();
  const activeCollections = collections.length > 0 ? collections : initialCollections;
  const activeProducts = products.length > 0 ? products : initialProducts;

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  return (
    <>
      {/* 1. Full-Bleed Hero Banner */}
      <section className="relative h-[62svh] min-h-[440px] w-full overflow-hidden bg-espresso text-paper">
        <img
          src={siteContent.drops_hero_image || "/images/hero-courtyard.png"}
          alt="Noksha Exclusive Collector Drops"
          className="hero-image absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#140f0b]/90 via-[#140f0b]/45 to-[#140f0b]/55" />

        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-14 pt-28 sm:px-10 sm:pb-20 sm:pt-32">
          <div className="max-w-3xl">
            <p
              className="hero-line eyebrow text-gold-soft"
              style={{ "--d": "120ms" } as React.CSSProperties}
            >
              {siteContent.drops_hero_eyebrow || "Exclusive Collector Releases · One of One"}
            </p>
            <h1
              className="hero-line font-display mt-4 text-5xl font-light leading-[1.02] sm:text-7xl lg:text-[5.5rem]"
              style={{ "--d": "220ms" } as React.CSSProperties}
            >
              {siteContent.drops_hero_title || <>The <em>Drops</em></>}
            </h1>
            <p
              className="hero-line font-bengali mt-4 text-2xl font-light text-gold-soft"
              style={{ "--d": "320ms" } as React.CSSProperties}
            >
              {siteContent.drops_hero_bengali || "নকশা সম্ভার — একমেবাদ্বিতীয়ম্"}
            </p>
            <p
              className="hero-line mt-5 max-w-xl text-[0.98rem] leading-[1.75] text-paper/85"
              style={{ "--d": "420ms" } as React.CSSProperties}
            >
              {siteContent.drops_hero_description ||
                "Each Drop curates singular one-of-one works across Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes. Once a piece is acquired and delivered, it is permanently inscribed with its collector's name and never repeated."}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Numbered Drops Showcase */}
      <section className="kantha-bg bg-paper px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[1440px] space-y-24">
          {activeCollections.map((drop, i) => {
            const dropPieces = activeProducts.filter((p) => p.collectionId === drop.id);
            const flip = i % 2 === 1;

            return (
              <article
                key={drop.id}
                className="border-b border-[var(--hairline)] pb-20 last:border-b-0 last:pb-0"
              >
                <div className="grid items-center gap-10 md:grid-cols-12 md:gap-16">
                  {/* Drop Banner Image */}
                  <Reveal
                    variant="media"
                    className={`relative aspect-[4/5] w-full overflow-hidden bg-sand md:col-span-5 ${
                      flip ? "md:order-2 md:col-start-8" : ""
                    }`}
                  >
                    <Link href={`/collections/${drop.id}`} className="block h-full w-full group">
                      <img
                        src={drop.heroImage}
                        alt={drop.title}
                        className="media-zoom h-full w-full object-cover"
                      />
                      <span className="eyebrow absolute left-5 top-5 bg-espresso/90 px-3.5 py-2 !text-[0.58rem] text-gold-soft backdrop-blur-sm">
                        <span className="font-num">{drop.dropNumber || drop.shortName}</span> ·{" "}
                        {getDropStatusLabel(drop.dropStatus)}
                      </span>
                    </Link>
                  </Reveal>

                  {/* Drop Details */}
                  <div
                    className={`md:col-span-6 ${
                      flip ? "md:order-1 md:col-start-1" : "md:col-start-7"
                    }`}
                  >
                    <Reveal>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="eyebrow bg-espresso px-3 py-1.5 !text-[0.58rem] text-gold-soft">
                          <span className="font-num">{drop.dropNumber || drop.shortName}</span>
                        </span>
                        <span className="eyebrow !text-[0.6rem] text-gold">
                          {getDropStatusLabel(drop.dropStatus)}
                        </span>
                        <span className="eyebrow !text-[0.58rem] text-mute">
                          · <span className="font-num">{drop.releaseDate || "Live Now"}</span>
                        </span>
                      </div>
                    </Reveal>

                    <Reveal delay={80}>
                      <Link href={`/collections/${drop.id}`} className="block">
                        <h2 className="font-display mt-6 text-4xl font-light leading-[1.06] sm:text-6xl hover:opacity-80 transition-opacity">
                          {drop.title}
                        </h2>
                      </Link>
                      <p
                        className="font-bengali mt-3 text-2xl font-light"
                        style={{ color: drop.accentHex }}
                      >
                        {drop.bengaliTitle}
                      </p>
                    </Reveal>

                    <Reveal delay={160}>
                      <p className="font-display mt-6 text-2xl font-light italic text-ink-soft">
                        {drop.subtitle}
                      </p>
                      <p className="mt-4 max-w-xl text-[0.95rem] leading-[1.85] text-ink-soft">
                        {drop.description}
                      </p>
                    </Reveal>

                    <Reveal delay={240}>
                      <dl className="mt-8 grid max-w-lg grid-cols-3 gap-6 border-y border-[var(--hairline)] py-5">
                        <div>
                          <dt className="eyebrow !text-[0.56rem] text-mute">Edition</dt>
                          <dd className="mt-1.5 text-sm font-num">1 of 1 Exclusive</dd>
                        </div>
                        <div>
                          <dt className="eyebrow !text-[0.56rem] text-mute">Pieces</dt>
                          <dd className="mt-1.5 text-sm font-num">
                            {dropPieces.length} {dropPieces.length === 1 ? "piece" : "pieces"}
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow !text-[0.56rem] text-mute">Range</dt>
                          <dd className="mt-1.5 text-sm tabular-nums">{drop.priceRange}</dd>
                        </div>
                      </dl>

                      <div className="mt-8 flex flex-wrap items-center gap-6">
                        <Link
                          href={`/collections/${drop.id}`}
                          className="press btn-solid"
                        >
                          Enter <span className="font-num ml-1">{drop.dropNumber || drop.shortName}</span>
                        </Link>
                        <Link
                          href="/#shop"
                          className="link-draw eyebrow !tracking-[0.22em] text-ink-soft"
                        >
                          Browse Store Categories <span className="arrow">→</span>
                        </Link>
                      </div>
                    </Reveal>
                  </div>
                </div>

                {/* Pieces Across Categories Inside This Drop */}
                {dropPieces.length > 0 && (
                  <div className="mt-14">
                    <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4 mb-8">
                      <p className="eyebrow !text-[0.6rem] text-mute">
                        Featured Pieces Across Categories in{" "}
                        <span className="text-ink font-num">{drop.dropNumber || drop.shortName}</span>
                      </p>
                      <Link
                        href={`/collections/${drop.id}`}
                        className="link-draw eyebrow !text-[0.58rem]"
                      >
                        View Full Drop <span className="arrow">→</span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                      {dropPieces.map((p) => (
                        <Link key={p.id} href={`/pieces/${p.id}`} className="group block">
                          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="media-zoom h-full w-full object-cover"
                            />
                            <span className="eyebrow pointer-events-none absolute left-4 top-4 bg-paper/92 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                              <span className="font-num">{availabilityNote(p)}</span>
                            </span>
                            <span className="eyebrow pointer-events-none absolute right-4 top-4 bg-espresso/90 px-3 py-1.5 !text-[0.55rem] text-gold-soft backdrop-blur-sm">
                              {getCategoryName(p.category)}
                            </span>
                          </div>
                          <div className="mt-4 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-2xl font-light leading-tight">
                                {p.name}
                              </h3>
                              <p className="font-bengali mt-1 text-sm text-mute">
                                {p.bengaliName}
                              </p>
                            </div>
                            <p className="shrink-0 pt-1 text-sm tabular-nums text-ink-soft">
                              {formatBDT(p.priceBDT)}
                            </p>
                          </div>
                          {p.status === "sold" && p.acquiredBy && (
                            <p className="eyebrow mt-2.5 !text-[0.56rem] text-gold">
                              Acquired by {p.acquiredBy}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <Footer />
    </>
  );
}
