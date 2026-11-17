"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "./Reveal";
import { availabilityNote } from "./Shop";
import { Footer } from "./Sections";
import { StoreCollection, useStore } from "@/context/StoreContext";
import { NokshaProduct, formatBDT } from "@/data/nokshaData";

interface CollectionDetailViewProps {
  collection: StoreCollection;
  initialProducts: NokshaProduct[];
  otherCollections: StoreCollection[];
}

export function getDropStatusLabel(status?: string) {
  switch (status) {
    case "upcoming":
      return "Upcoming Drop · Preview";
    case "prebooking":
      return "Pre-Booking Open";
    case "archived":
      return "Archived Collector Drop";
    case "live":
    default:
      return "Live Drop · Open to Acquire";
  }
}

export default function CollectionDetailView({
  collection,
  initialProducts,
  otherCollections,
}: CollectionDetailViewProps) {
  const { collections, products, categories, addToBag } = useStore();

  const liveCollection =
    collections.find((c) => c.id === collection.id) ?? collection;
  const matched = products.filter((p) => p.collectionId === liveCollection.id);
  const collectionProducts = matched.length > 0 ? matched : initialProducts;

  const paragraphs = (liveCollection.story || liveCollection.description)
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  return (
    <>
      {/* 1. Full-Bleed Collection Drop Banner */}
      <section className="relative h-[68svh] min-h-[480px] w-full overflow-hidden bg-espresso text-paper">
        <img
          src={liveCollection.bannerImage || liveCollection.heroImage}
          alt={liveCollection.title}
          className="hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#140f0b]/88 via-[#140f0b]/40 to-[#140f0b]/50" />

        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-between px-5 pb-14 pt-28 sm:px-10 sm:pb-20 sm:pt-32">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/#collections"
              className="link-draw eyebrow !tracking-[0.24em] text-paper/85"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
              All Exclusive Drops
            </Link>
            <span className="eyebrow border border-gold-soft/40 bg-[#140f0b]/70 px-3.5 py-1.5 !text-[0.58rem] text-gold-soft backdrop-blur-sm">
              <span className="font-num">
                {liveCollection.dropNumber || liveCollection.shortName}
              </span>{" "}
              · {getDropStatusLabel(liveCollection.dropStatus)}
            </span>
          </div>

          <div className="max-w-3xl">
            <p className="hero-line eyebrow text-gold-soft" style={{ "--d": "140ms" } as React.CSSProperties}>
              Exclusive Collector Release ·{" "}
              <span className="font-num">
                {liveCollection.dropNumber || liveCollection.shortName}
              </span>{" "}
              · One of One
            </p>
            <h1
              className="hero-line font-display mt-4 text-5xl font-light leading-[1.02] sm:text-7xl lg:text-[5.5rem]"
              style={{ "--d": "240ms" } as React.CSSProperties}
            >
              {liveCollection.title}
            </h1>
            <p
              className="hero-line font-bengali mt-4 text-2xl font-light text-gold-soft"
              style={{ "--d": "340ms" } as React.CSSProperties}
            >
              {liveCollection.bengaliTitle}
            </p>
            <p
              className="hero-line font-display mt-4 text-2xl font-light italic text-paper/85"
              style={{ "--d": "440ms" } as React.CSSProperties}
            >
              {liveCollection.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Collection Story & Drop Metadata */}
      <section className="kantha-bg grain relative bg-paper px-5 py-16 sm:px-10 sm:py-24 border-b border-[var(--hairline)]">
        <div className="mx-auto max-w-[1440px] grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-4">
              <img src="/brand/noksha-mark.png" alt="" className="h-10 w-10" />
              <div>
                <p className="eyebrow text-gold">
                  <span className="font-num">
                    {liveCollection.dropNumber || liveCollection.shortName}
                  </span>{" "}
                  Archive
                </p>
                <p className="font-bengali text-lg text-ink-soft mt-0.5">
                  {liveCollection.bengaliTitle}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
              <div className="py-4 flex justify-between gap-4">
                <dt className="eyebrow !text-[0.6rem] text-mute">Drop Status</dt>
                <dd className="text-sm text-right font-medium text-gold">
                  {getDropStatusLabel(liveCollection.dropStatus)}
                </dd>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <dt className="eyebrow !text-[0.6rem] text-mute">Release Schedule</dt>
                <dd className="text-sm font-num text-right">
                  {liveCollection.releaseDate || "Live Now"}
                </dd>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <dt className="eyebrow !text-[0.6rem] text-mute">Edition</dt>
                <dd className="text-sm text-right">
                  Strictly <span className="font-num">1 of 1</span> per piece
                </dd>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <dt className="eyebrow !text-[0.6rem] text-mute">Craftsmanship</dt>
                <dd className="text-sm text-right">{liveCollection.craftMetric}</dd>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <dt className="eyebrow !text-[0.6rem] text-mute">Price range</dt>
                <dd className="text-sm tabular-nums text-right">{liveCollection.priceRange}</dd>
              </div>
              <div className="py-4 flex justify-between gap-4">
                <dt className="eyebrow !text-[0.6rem] text-mute">Pieces in drop</dt>
                <dd className="text-sm font-num text-right">{collectionProducts.length}</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 space-y-6">
            <h2 className="font-display text-3xl font-light leading-snug text-ink sm:text-4xl">
              {liveCollection.description}
            </h2>
            <div className="kantha-rule" />
            <div className="space-y-5 text-[1rem] leading-[1.85] text-ink-soft">
              {paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. One-of-One Pieces Under This Drop */}
      <section className="kantha-bg bg-paper px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--hairline)] pb-8">
            <div>
              <p className="eyebrow text-gold">
                <span className="font-num">
                  {liveCollection.dropNumber || liveCollection.shortName}
                </span>{" "}
                · One-of-One Collector Pieces
              </p>
              <h2 className="font-display mt-3 text-4xl font-light sm:text-6xl">
                Pieces in <em>{liveCollection.dropNumber || liveCollection.shortName}</em>
              </h2>
            </div>
            <p className="eyebrow !text-[0.6rem] text-mute">
              <span className="font-num">{collectionProducts.length}</span>{" "}
              {collectionProducts.length === 1 ? "exclusive piece" : "exclusive pieces"}
            </p>
          </div>

          {collectionProducts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-3xl font-light text-ink-soft">
                The 1-of-1 pieces for {liveCollection.title} are being cataloged in our atelier.
              </p>
              <Link href="/#shop" className="press btn-solid mt-8">
                Explore All Store Pieces
              </Link>
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
              {collectionProducts.map((p, i) => {
                const isSold = p.status === "sold";
                const isPrebook =
                  liveCollection.dropStatus === "prebooking" ||
                  p.dropStatus === "prebooking" ||
                  p.status === "waitlist";
                const isUpcoming =
                  liveCollection.dropStatus === "upcoming" || p.dropStatus === "upcoming";

                return (
                  <Reveal key={p.id} as="article" delay={(i % 3) * 70} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                      <Link
                        href={`/pieces/${p.id}`}
                        className="block h-full w-full"
                        aria-label={`View ${p.name}`}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="media-zoom h-full w-full object-cover"
                        />
                      </Link>
                      <span className="eyebrow pointer-events-none absolute left-4 top-4 bg-paper/92 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                        <span className="font-num">{availabilityNote(p)}</span>
                      </span>
                      <span className="eyebrow pointer-events-none absolute right-4 top-4 bg-espresso/90 px-3 py-1.5 !text-[0.56rem] text-gold-soft backdrop-blur-sm">
                        <span className="font-num">
                          {liveCollection.dropNumber || p.dropNumber || "Drop"}
                        </span>{" "}
                        · 1 of 1
                      </span>

                      {isSold ? (
                        <span className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/85 py-4 text-center text-paper/85 backdrop-blur-sm md:block">
                          {p.acquiredBy ? `Acquired by ${p.acquiredBy}` : "Acquired"}
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
                          Pre-Book 1-of-1 Piece
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToBag(p)}
                          className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-paper backdrop-blur-sm hover:bg-ink md:block cursor-pointer"
                        >
                          Acquire 1-of-1 Piece
                        </button>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="eyebrow !text-[0.55rem] text-mute">
                          {getCategoryName(p.category)}
                        </span>
                        <span className="eyebrow !text-[0.55rem] text-gold">
                          One of One
                        </span>
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
                        {isSold && p.acquiredBy ? (
                          <p className="eyebrow mt-3 !text-[0.58rem] text-gold">
                            Acquired by {p.acquiredBy}
                          </p>
                        ) : (
                          <p className="eyebrow mt-3 !text-[0.58rem] text-mute">
                            <span className="font-num">{p.artisanHours}</span> hours by hand · 1 of 1
                          </p>
                        )}
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}

          {/* 4. Explore Other Drops */}
          {otherCollections.length > 0 && (
            <div className="mt-20 border-t border-[var(--hairline)] pt-16">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-gold">Continue Exploring</p>
                  <h3 className="font-display mt-3 text-4xl font-light sm:text-5xl">
                    Other <em>exclusive drops</em>
                  </h3>
                </div>
                <Link href="/#collections" className="link-draw eyebrow !tracking-[0.22em]">
                  All drops <span className="arrow">→</span>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
                {otherCollections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className="group relative aspect-[16/10] overflow-hidden bg-espresso text-paper block"
                  >
                    <img
                      src={col.heroImage}
                      alt={col.title}
                      className="media-zoom absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140f0b]/85 via-[#140f0b]/25 to-transparent" />
                    <div className="relative flex h-full flex-col justify-between p-7 sm:p-10">
                      <div className="flex justify-between items-center">
                        <span className="eyebrow bg-[#140f0b]/70 px-3 py-1.5 !text-[0.55rem] text-gold-soft">
                          <span className="font-num">{col.dropNumber || col.shortName}</span> · 1 of 1
                        </span>
                        <span className="eyebrow !text-[0.55rem] text-paper/80">
                          {getDropStatusLabel(col.dropStatus)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bengali text-lg text-gold-soft">{col.bengaliTitle}</p>
                        <h4 className="font-display mt-1 text-3xl font-light sm:text-4xl">
                          <span className="font-num">{col.dropNumber || col.shortName}</span> —{" "}
                          <em>{col.title}</em>
                        </h4>
                        <p className="mt-2 text-sm text-paper/80 line-clamp-2 max-w-md">
                          {col.subtitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
