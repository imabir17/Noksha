"use client";

import React from "react";
import { Reveal } from "./Reveal";
import { useStore } from "@/context/StoreContext";
import { FOUNDING_PILLARS } from "@/data/nokshaData";
import { CategoryFilter } from "./Shop";

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function Manifesto() {
  const { siteContent, categories } = useStore();
  return (
    <section className="kantha-bg grain relative bg-paper px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <img src={siteContent.brand_mark || "/brand/noksha-mark.png"} alt="" className="mx-auto h-14 w-14" />
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
                [siteContent.manifesto_stat_1_num || String(categories.length || 3), siteContent.manifesto_stat_1_label || "Craft categories"],
                [siteContent.manifesto_stat_2_num || "280", siteContent.manifesto_stat_2_label || "Hours in one kantha"],
                [siteContent.manifesto_stat_3_num || "100%", siteContent.manifesto_stat_3_label || "Made in Bangladesh"],
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
  const { categories, siteContent } = useStore();

  // Merge rich visual defaults from FOUNDING_PILLARS with dynamic categories from DB
  const displayCategories = categories.map((cat, idx) => {
    const pillar = FOUNDING_PILLARS.find((p) => p.id === cat.id) ?? FOUNDING_PILLARS[idx % FOUNDING_PILLARS.length];
    return {
      id: cat.id,
      shortName: cat.shortName || cat.name,
      title: cat.name,
      bengaliTitle: cat.bengaliName || pillar.bengaliTitle,
      subtitle: cat.subtitle || pillar.subtitle,
      description: pillar.description,
      craftMetric: pillar.craftMetric,
      priceRange: pillar.priceRange,
      heroImage: pillar.heroImage,
      accentHex: pillar.accentHex,
    };
  });

  return (
    <section id="categories" className="kantha-bg bg-cream">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 sm:px-10 sm:pt-22">
        <Reveal className="flex flex-col items-start justify-between gap-6 border-b border-[var(--hairline)] pb-10 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-gold">{siteContent.categories_eyebrow || "The Categories"}</p>
            <h2 className="font-display mt-5 text-5xl font-light leading-none sm:text-7xl">
              {siteContent.categories_title || <>Three crafts, <em>one house.</em></>}
            </h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
            {siteContent.categories_subtitle || "Explore our signature craft categories—available as multi-piece store editions or as one-of-one collector pieces in our numbered Drops."}
          </p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-10 sm:pb-20">
        {displayCategories.map((cat, i) => {
          const flip = i % 2 === 1;
          return (
            <article
              key={cat.id}
              className="grid items-center gap-10 border-b border-[var(--hairline)] py-12 last:border-b-0 md:grid-cols-12 md:gap-16 md:py-16"
            >
              <Reveal
                variant="media"
                className={`relative aspect-[4/5] w-full overflow-hidden bg-sand md:col-span-6 ${
                  flip ? "md:order-2 md:col-start-7" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onExplore && onExplore(cat.id as CategoryFilter)}
                  className="block h-full w-full group text-left cursor-pointer"
                >
                  <img
                    src={cat.heroImage}
                    alt={cat.title}
                    className="media-zoom h-full w-full object-cover"
                  />
                </button>
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
                      style={{ color: cat.accentHex }}
                    >
                      {NUMERALS[i] ?? `${i + 1}`}.
                    </span>
                    <span className="h-px w-12 bg-[var(--hairline)]" />
                    <span className="eyebrow !text-[0.6rem] text-mute">
                      Category · {cat.shortName}
                    </span>
                  </div>
                </Reveal>
                <Reveal delay={80}>
                  <button
                    type="button"
                    onClick={() => onExplore && onExplore(cat.id as CategoryFilter)}
                    className="block text-left cursor-pointer"
                  >
                    <h3 className="font-display mt-6 text-5xl font-light leading-[1.06] sm:text-6xl hover:opacity-80 transition-opacity">
                      {cat.title}
                    </h3>
                  </button>
                  <p
                    className="font-bengali mt-4 text-2xl font-light"
                    style={{ color: cat.accentHex }}
                  >
                    {cat.bengaliTitle}
                  </p>
                </Reveal>
                <Reveal delay={160}>
                  <p className="font-display mt-6 text-2xl font-light italic text-ink-soft">
                    {cat.subtitle}
                  </p>
                  <p className="mt-5 max-w-md text-[0.95rem] leading-[1.8] text-ink-soft">
                    {cat.description}
                  </p>
                </Reveal>
                <Reveal delay={240}>
                  <dl className="mt-10 grid max-w-md grid-cols-2 gap-6 border-t border-[var(--hairline)] pt-6">
                    <div>
                      <dt className="eyebrow !text-[0.6rem] text-mute">Making time</dt>
                      <dd className="mt-2 text-sm">{cat.craftMetric}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow !text-[0.6rem] text-mute">From</dt>
                      <dd className="mt-2 text-sm tabular-nums">
                        {cat.priceRange.split("–")[0].trim()}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-10 flex flex-wrap items-center gap-8">
                    {onExplore && (
                      <button
                        type="button"
                        onClick={() => onExplore(cat.id as CategoryFilter)}
                        className="link-draw eyebrow !tracking-[0.24em] cursor-pointer"
                      >
                        Explore {cat.title} <span className="arrow">→</span>
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
