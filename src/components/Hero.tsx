"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";

export default function Hero() {
  const { siteContent } = useStore();
  const eyebrow = siteContent.hero_eyebrow || "The Inaugural Collection";
  const line1 = siteContent.hero_title_line1 || "Heirlooms for the";
  const line2 = siteContent.hero_title_line2 || "Bengali home.";
  const bengali = siteContent.hero_bengali || "আলো, সুতো ও কাঠের কাব্য";

  return (
    <section id="top" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-espresso text-paper">
      <img
        src="/images/hero-courtyard.png"
        alt="A sunlit Bengali living room with a woven bamboo pendant, a hand-stitched Nakshi Kantha and a brass-inlaid teak jewellery box"
        className="hero-image absolute inset-0 h-full w-full object-cover"
      />
      {/* Quiet tonal veil for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#140f0b]/80 via-[#140f0b]/25 to-[#140f0b]/40" />

      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-16 sm:px-10 sm:pb-20">
        <div className="max-w-3xl">
          <p className="hero-line eyebrow text-gold-soft" style={{ "--d": "200ms" } as React.CSSProperties}>
            {eyebrow}
          </p>
          <h1
            className="hero-line font-display mt-6 text-[3.1rem] font-light leading-[0.98] tracking-[-0.01em] sm:text-7xl lg:text-[6.5rem]"
            style={{ "--d": "320ms" } as React.CSSProperties}
          >
            {line1}
            <br />
            <em className="font-light">{line2}</em>
          </h1>
          <p
            className="hero-line font-bengali mt-6 text-lg font-light text-paper/80 sm:text-xl"
            style={{ "--d": "460ms" } as React.CSSProperties}
          >
            {bengali}
          </p>
          <div
            className="hero-line mt-10 flex flex-wrap items-center gap-x-10 gap-y-5"
            style={{ "--d": "600ms" } as React.CSSProperties}
          >
            <a href="#shop" className="press btn-ghost on-dark">
              Discover the pieces
            </a>
            <a href="/about" className="link-draw eyebrow !tracking-[0.24em] text-paper/90">
              Our story <span className="arrow">→</span>
            </a>
          </div>
        </div>

        {/* Collection index, bottom right */}
        <div
          className="hero-line absolute bottom-20 right-10 hidden text-right lg:block"
          style={{ "--d": "800ms" } as React.CSSProperties}
        >
          <ul className="space-y-2 font-display text-lg font-light italic text-paper/75">
            <li>I. &nbsp;Alo — Light</li>
            <li>II. &nbsp;Kantha — Thread</li>
            <li>III. &nbsp;Shindook — Timber</li>
          </ul>
        </div>

        <div className="absolute bottom-0 left-1/2 hidden h-14 w-px -translate-x-1/2 overflow-hidden sm:block">
          <div className="scroll-cue h-full w-full bg-paper/60" />
        </div>
      </div>
    </section>
  );
}
