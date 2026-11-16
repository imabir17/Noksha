import React from "react";
import { Reveal } from "./Reveal";
import { FOUNDING_PILLARS, PillarId } from "@/data/nokshaData";

const NUMERALS = ["I", "II", "III"];
const SHORT: Record<PillarId, { word: string; meaning: string }> = {
  "light-shades": { word: "Alo", meaning: "Light" },
  "nakshi-kantha": { word: "Kantha", meaning: "Thread" },
  "jewelry-boxes": { word: "Shindook", meaning: "Timber" },
};

export function Manifesto() {
  return (
    <section className="kantha-bg grain relative bg-paper px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <img src="/brand/noksha-mark.png" alt="" className="mx-auto h-14 w-14" />
        </Reveal>
        <Reveal delay={80}>
          <p className="eyebrow mt-10 text-gold">নকশা — meaning “design, pattern”</p>
        </Reveal>
        <Reveal delay={160}>
          <p className="font-display mt-8 text-[1.9rem] font-light leading-[1.3] text-ink sm:text-[2.75rem]">
            We began with three objects every Bengali home has always held dear —
            <em> a lamp</em> for the evening, <em>a kantha</em> for rest, and
            <em> a carved box</em> for what we cannot bear to lose. Each is made slowly,
            by hand, by Bangladeshi Artisans.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="kantha-rule mb-8" />
            <div className="grid grid-cols-3">
              {[
                ["3", "Heritage crafts"],
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

export function Collections({ onExplore }: { onExplore: (id: PillarId) => void }) {
  return (
    <section id="collections" className="kantha-bg bg-cream">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 sm:px-10 sm:pt-22">
        <Reveal className="flex flex-col items-start justify-between gap-6 border-b border-[var(--hairline)] pb-10 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-gold">The Collections</p>
            <h2 className="font-display mt-5 text-5xl font-light leading-none sm:text-7xl">
              Three crafts, <em>one house.</em>
            </h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
            Each collection is thoughtfully curated in small batches and finished in our Dhaka atelier.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-10 sm:pb-20">
        {FOUNDING_PILLARS.map((pillar, i) => {
          const flip = i % 2 === 1;
          const short = SHORT[pillar.id];
          return (
            <article
              key={pillar.id}
              className={`grid items-center gap-10 border-b border-[var(--hairline)] py-12 last:border-b-0 md:grid-cols-12 md:gap-16 md:py-16`}
            >
              <Reveal
                variant="media"
                className={`relative aspect-[4/5] w-full overflow-hidden bg-sand md:col-span-6 ${flip ? "md:order-2 md:col-start-7" : ""}`}
              >
                <img src={pillar.heroImage} alt={pillar.title} className="h-full w-full object-cover" />
              </Reveal>

              <div className={`md:col-span-5 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-8"}`}>
                <Reveal>
                  <div className="flex items-center gap-5">
                    <span className="font-display text-xl font-light italic" style={{ color: pillar.accentHex }}>
                      {NUMERALS[i]}.
                    </span>
                    <span className="h-px w-12 bg-[var(--hairline)]" />
                  </div>
                </Reveal>
                <Reveal delay={80}>
                  <h3 className="font-display mt-8 text-6xl font-light leading-none sm:text-7xl">
                    {short.word}
                  </h3>
                  <p className="font-bengali mt-4 text-2xl font-light" style={{ color: pillar.accentHex }}>
                    {pillar.bengaliTitle}
                  </p>
                </Reveal>
                <Reveal delay={160}>
                  <p className="font-display mt-8 text-2xl font-light italic text-ink-soft">
                    {pillar.subtitle}
                  </p>
                  <p className="mt-5 max-w-md text-[0.95rem] leading-[1.8] text-ink-soft">
                    {pillar.description}
                  </p>
                </Reveal>
                <Reveal delay={240}>
                  <dl className="mt-10 grid max-w-md grid-cols-2 gap-6 border-t border-[var(--hairline)] pt-6">
                    <div>
                      <dt className="eyebrow !text-[0.6rem] text-mute">Making time</dt>
                      <dd className="mt-2 text-sm">{pillar.craftMetric}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow !text-[0.6rem] text-mute">From</dt>
                      <dd className="mt-2 text-sm tabular-nums">{pillar.priceRange.split("–")[0].trim()}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => onExplore(pillar.id)}
                    className="link-draw eyebrow mt-10 !tracking-[0.24em] cursor-pointer"
                  >
                    Explore {short.word} <span className="arrow">→</span>
                  </button>
                </Reveal>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
