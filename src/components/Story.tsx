"use client";

import React from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { useStore } from "@/context/StoreContext";
import { CategoryFilter } from "./Shop";
import { getDropStatusLabel } from "./CollectionDetailView";

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function Manifesto() {
  const { siteContent, collections } = useStore();
  return (
    <section className="kantha-bg grain relative bg-paper px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <img src="/brand/noksha-mark.png" alt="" className="mx-auto h-14 w-14" />
        </Reveal>
        <Reveal delay={80}>
          <p className="eyebrow mt-10 text-gold">
            {siteContent.manifesto_eyebrow || "নকশা — meaning “design, pattern”"}
          </p>
        </Reveal>
        <Reveal delay={160}>
          {siteContent.manifesto_body ? (
            <p className="font-display mt-8 text-[1.9rem] font-light leading-[1.3] text-ink sm:text-[2.75rem]">
              {siteContent.manifesto_body}
            </p>
          ) : (
            <p className="font-display mt-8 text-[1.9rem] font-light leading-[1.3] text-ink sm:text-[2.75rem]">
              We began with three objects every Bengali home has always held dear —
              <em> a lamp</em> for the evening, <em>a kantha</em> for rest, and
              <em> a carved box</em> for what we cannot bear to lose. Each is made slowly,
              by hand, by Bangladeshi Artisans.
            </p>
          )}
        </Reveal>
        <Reveal delay={240}>
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="kantha-rule mb-8" />
            <div className="grid grid-cols-3">
              {[
                [String(collections.length), "Exclusive Drops"],
                ["280", "Hours in one kantha"],
                ["100%", "Made in Bangladesh"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-3xl font-light tabular-nums sm:text-4xl">{n}</p>
                  <p className="eyebrow mt-2 !text-[0.6rem] text-mute">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Collections({ onExplore }: { onExplore?: (id: CategoryFilter) => void }) {
  const { collections } = useStore();

  return (
    <section id="collections" className="kantha-bg bg-cream">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 sm:px-10 sm:pt-22">
        <Reveal className="flex flex-col items-start justify-between gap-6 border-b border-[var(--hairline)] pb-10 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-gold">Exclusive Collections · Numbered Drops</p>
            <h2 className="font-display mt-5 text-5xl font-light leading-none sm:text-7xl">
              Collector <em>drops.</em>
            </h2>
          </div>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
            Every collection is released as an exclusive numbered Drop of one-of-one pieces. Once a drop piece is delivered, it is permanently archived under its collector&apos;s name.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-10 sm:pb-20">
        {collections.map((pillar, i) => {
          const flip = i % 2 === 1;
          return (
            <article
              key={pillar.id}
              className="grid items-center gap-10 border-b border-[var(--hairline)] py-12 last:border-b-0 md:grid-cols-12 md:gap-16 md:py-16"
            >
              <Reveal
                variant="media"
                className={`relative aspect-[4/5] w-full overflow-hidden bg-sand md:col-span-6 ${
                  flip ? "md:order-2 md:col-start-7" : ""
                }`}
              >
                <Link href={`/collections/${pillar.id}`} className="block h-full w-full group">
                  <img
                    src={pillar.heroImage}
                    alt={pillar.title}
                    className="media-zoom h-full w-full object-cover"
                  />
                  <span className="eyebrow absolute left-5 top-5 bg-espresso/90 px-3.5 py-2 !text-[0.58rem] text-gold-soft backdrop-blur-sm">
                    <span className="font-num">{pillar.dropNumber || pillar.shortName}</span> ·{" "}
                    {getDropStatusLabel(pillar.dropStatus)}
                  </span>
                </Link>
              </Reveal>

              <div
                className={`md:col-span-5 ${
                  flip ? "md:order-1 md:col-start-1" : "md:col-start-8"
                }`}
              >
                <Reveal>
                  <div className="flex items-center gap-5">
                    <span
                      className="font-display text-xl font-light italic"
                      style={{ color: pillar.accentHex }}
                    >
                      {NUMERALS[i] ?? `${i + 1}`}.
                    </span>
                    <span className="h-px w-12 bg-[var(--hairline)]" />
                    <span className="eyebrow !text-[0.6rem] text-gold">
                      <span className="font-num">{pillar.dropNumber || pillar.shortName}</span> · One of One
                    </span>
                  </div>
                </Reveal>
                <Reveal delay={80}>
                  <Link href={`/collections/${pillar.id}`} className="block">
                    <h3 className="font-display mt-6 text-4xl font-light leading-[1.06] sm:text-6xl hover:opacity-80 transition-opacity">
                      {pillar.title}
                    </h3>
                  </Link>
                  <p
                    className="font-bengali mt-4 text-2xl font-light"
                    style={{ color: pillar.accentHex }}
                  >
                    {pillar.bengaliTitle}
                  </p>
                </Reveal>
                <Reveal delay={160}>
                  <p className="font-display mt-6 text-2xl font-light italic text-ink-soft">
                    {pillar.subtitle}
                  </p>
                  <p className="mt-5 max-w-md text-[0.95rem] leading-[1.8] text-ink-soft">
                    {pillar.description}
                  </p>
                </Reveal>
                <Reveal delay={240}>
                  <dl className="mt-10 grid max-w-md grid-cols-2 gap-6 border-t border-[var(--hairline)] pt-6">
                    <div>
                      <dt className="eyebrow !text-[0.6rem] text-mute">Drop Status</dt>
                      <dd className="mt-2 text-sm font-medium text-ink">
                        {getDropStatusLabel(pillar.dropStatus)}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow !text-[0.6rem] text-mute">From</dt>
                      <dd className="mt-2 text-sm tabular-nums">
                        {pillar.priceRange.split("–")[0].trim()}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-10 flex flex-wrap items-center gap-8">
                    <Link
                      href={`/collections/${pillar.id}`}
                      className="link-draw eyebrow !tracking-[0.24em]"
                    >
                      Enter <span className="font-num">{pillar.dropNumber || pillar.shortName}</span>{" "}
                      <span className="arrow">→</span>
                    </Link>
                    {onExplore && (
                      <button
                        type="button"
                        onClick={() => onExplore("exclusive-drops")}
                        className="eyebrow !text-[0.6rem] text-mute hover:text-ink cursor-pointer"
                      >
                        View all drop pieces below
                      </button>
                    )}
                  </div>
                </Reveal>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
