"use client";

import React from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { Footer } from "./Sections";
import { useStore } from "@/context/StoreContext";

export default function AboutView() {
  const { siteContent } = useStore();

  const PURPOSE_PILLARS = [
    {
      numeral: "I",
      eyebrow: siteContent.about_pillar_1_eyebrow || "Preserving History & Culture",
      bengali: siteContent.about_pillar_1_bengali || "ইতিহাস ও ঐতিহ্য সংরক্ষণ",
      title: siteContent.about_pillar_1_title || "Keeping the soul of Bengal alive.",
      body:
        siteContent.about_pillar_1_body ||
        "For generations, the artistry of Bangladesh has been written in thread, clay, bamboo, and timber—in the rippling kantha phor stitch, the lacy geometry of Alpona, and the warm shadow-play of woven lanterns. As mass production replaces handwork, these quiet traditions risk fading into memory. Noksha was founded to preserve this living heritage—not behind glass, but inside the homes we inhabit every day.",
      image: siteContent.about_pillar_1_image || "/images/kantha-crimson-padma.png",
      accent: "#8C2F2F",
    },
    {
      numeral: "II",
      eyebrow: siteContent.about_pillar_2_eyebrow || "Spreading Culture to the Younger Generation",
      bengali: siteContent.about_pillar_2_bengali || "নতুন প্রজন্মের কাছে বাংলার শেকড়",
      title: siteContent.about_pillar_2_title || "Heirlooms reimagined for contemporary lives.",
      body:
        siteContent.about_pillar_2_body ||
        "A culture endures only when the younger generation claims it as their own. We curate and craft pieces—sculptural light shades, one-of-a-kind Nakshi Kanthas, and hand-carved jewellery chests—that speak with quiet, modern refinement while remaining unmistakably Bangladeshi. Our goal is to make young collectors proud to live with, gift, and pass down the craft of their homeland.",
      image: siteContent.about_pillar_2_image || "/images/light-jamdani-pendant.png",
      accent: "#B9772C",
    },
    {
      numeral: "III",
      eyebrow: siteContent.about_pillar_3_eyebrow || "Empowering Women & Artisans",
      bengali: siteContent.about_pillar_3_bengali || "নারী ও কারিগরদের ক্ষমতায়ন",
      title: siteContent.about_pillar_3_title || "Dignity and independence in every stitch.",
      body:
        siteContent.about_pillar_3_body ||
        "At the heart of Noksha are the Bangladeshi artisans and rural women whose hands hold centuries of skill. Every Nakshi Kantha we release is a singular, one-of-one creation stitched over weeks by women artisans—never mass-duplicated. By championing their craft and valuing unhurried handmade work, we help create sustainable income, creative recognition, and lasting empowerment for women and maker families across Bangladesh.",
      image: siteContent.about_pillar_3_image || "/images/artisan-hands.jpg",
      accent: "#2F5D58",
    },
  ];

  return (
    <>
      {/* 1. Full-Bleed Editorial Hero */}
      <section className="relative h-[74svh] min-h-[520px] w-full overflow-hidden bg-espresso text-paper">
        <img
          src={siteContent.about_hero_image || "/images/about-shital-pati.jpg"}
          alt="A glowing woven light shade over a Bangladeshi Shital Pati mat with a folded Nakshi Kantha and a brass-inlaid wooden jewellery box"
          className="hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#140f0b]/85 via-[#140f0b]/40 to-[#140f0b]/45" />

        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-16 sm:px-10 sm:pb-22">
          <div className="max-w-3xl">
            <p
              className="hero-line eyebrow text-gold-soft"
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              {siteContent.about_hero_eyebrow || "About Noksha · আমাদের গল্প"}
            </p>
            <h1
              className="hero-line font-display mt-5 text-5xl font-light leading-[1.02] sm:text-7xl lg:text-[5.5rem]"
              style={{ "--d": "280ms" } as React.CSSProperties}
            >
              {siteContent.about_hero_title_1 || "Preserving our history."}
              <br />
              <em className="font-light">
                {siteContent.about_hero_title_2 || "Empowering the hands that make it."}
              </em>
            </h1>
            <p
              className="hero-line font-bengali mt-5 text-xl font-light text-paper/85"
              style={{ "--d": "400ms" } as React.CSSProperties}
            >
              {siteContent.about_hero_bengali || "বাংলার ইতিহাস, নতুন প্রজন্মের গর্ব ও নারীর হাতের সম্মান"}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Why We Started */}
      <section className="kantha-bg grain relative bg-paper px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <img src={siteContent.brand_mark || "/brand/noksha-mark.png"} alt="Noksha Mark" className="mx-auto h-14 w-14" />
          </Reveal>
          <Reveal delay={80}>
            <p className="eyebrow mt-8 text-gold">
              {siteContent.about_why_eyebrow || "Why We Started · কেন আমাদের শুরু"}
            </p>
          </Reveal>
          <Reveal delay={140}>
            <h2 className="font-display mt-5 text-4xl font-light leading-[1.15] text-ink sm:text-6xl">
              {siteContent.about_why_title || <>Because a culture lives in what it <em>chooses to keep.</em></>}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mx-auto mt-8 max-w-3xl space-y-6 text-[1.05rem] leading-[1.9] text-ink-soft">
              <p>
                {siteContent.about_why_p1 ||
                  "Noksha (নকশা) began with a deeply personal question: as our homes become more modern, why must our own history and craftsmanship disappear from them?"}
              </p>
              <p>
                {siteContent.about_why_p2 ||
                  "We started Noksha to preserve the artistic heritage of Bangladesh, to inspire the younger generation to fall in love with their own cultural identity, and to work closely with Bangladeshi artisans and women—empowering them through dignified, meaningful craft."}
              </p>
              <p>
                {siteContent.about_why_p3 ||
                  "Launching with three intimate pillars of the Bengali home—sculptural Alo light shades, one-of-one Nakshi Kanthas, and hand-carved wooden jewellery boxes—every piece we bring to life bridges memory and contemporary living."}
              </p>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="mx-auto mt-14 max-w-2xl">
              <div className="kantha-rule mb-8" />
              <div className="grid grid-cols-3">
                {[
                  [siteContent.about_stat_1_num || "1 of 1", siteContent.about_stat_1_label || "Exclusive Kantha designs"],
                  [siteContent.about_stat_2_num || "100%", siteContent.about_stat_2_label || "Bangladeshi craft"],
                  [siteContent.about_stat_3_num || "3", siteContent.about_stat_3_label || "Founding home pillars"],
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

      {/* 3. Mission & Vision */}
      <section className="kantha-bg bg-cream px-5 py-16 sm:px-10 sm:py-24 border-y border-[var(--hairline)]">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="text-center max-w-2xl mx-auto">
            <p className="eyebrow text-gold">Our Direction</p>
            <h2 className="font-display mt-4 text-4xl font-light sm:text-6xl">
              Mission &amp; <em>Vision</em>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {/* Mission Card */}
            <Reveal className="bg-paper border border-[var(--hairline)] p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-5">
                  <span className="eyebrow text-gold">01 · Our Mission</span>
                  <span className="font-bengali text-lg text-alta">আমাদের লক্ষ্য</span>
                </div>
                <h3 className="font-display mt-7 text-3xl font-light leading-snug text-ink sm:text-4xl">
                  {siteContent.about_mission_title ||
                    "To preserve Bangladeshi heritage, pass it to the next generation, and uplift the women and artisans behind every piece."}
                </h3>
                <p className="mt-6 text-[0.98rem] leading-[1.85] text-ink-soft">
                  {siteContent.about_mission_body ||
                    "Our mission is threefold: to safeguard traditional Bangladeshi craft forms through thoughtful design, to make our cultural stories desirable and relevant to young people today, and to empower women stitchers and master artisans by honoring their time, skill, and livelihood."}
                </p>
              </div>
              <div className="kantha-rule mt-8" />
            </Reveal>

            {/* Vision Card */}
            <Reveal delay={100} className="bg-paper border border-[var(--hairline)] p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-5">
                  <span className="eyebrow text-gold">02 · Our Vision</span>
                  <span className="font-bengali text-lg text-river">আমাদের স্বপ্ন</span>
                </div>
                <h3 className="font-display mt-7 text-3xl font-light leading-snug text-ink sm:text-4xl">
                  {siteContent.about_vision_title ||
                    "A world where Bangladeshi craft is celebrated as timeless luxury—and every maker thrives with pride."}
                </h3>
                <p className="mt-6 text-[0.98rem] leading-[1.85] text-ink-soft">
                  {siteContent.about_vision_body ||
                    "We envision Noksha as Bangladesh’s defining house of heirloom craft: where every young home cherishes objects rooted in Bengali culture, where no traditional stitch or carving is lost to time, and where women artisans across the country achieve lasting financial independence through their art."}
                </p>
              </div>
              <div className="kantha-rule mt-8" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. Three Pillars of Purpose */}
      <section className="kantha-bg bg-paper px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="border-b border-[var(--hairline)] pb-8">
            <p className="eyebrow text-gold">What Guides Us</p>
            <h2 className="font-display mt-4 text-4xl font-light sm:text-6xl">
              Three commitments behind <em>every piece.</em>
            </h2>
          </Reveal>

          {PURPOSE_PILLARS.map((item, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={item.numeral}
                className="grid items-center gap-10 border-b border-[var(--hairline)] py-12 last:border-b-0 md:grid-cols-12 md:gap-16 md:py-16"
              >
                <Reveal
                  variant="media"
                  className={`relative aspect-[4/5] w-full overflow-hidden bg-sand md:col-span-5 ${
                    flip ? "md:order-2 md:col-start-8" : ""
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </Reveal>

                <div
                  className={`md:col-span-6 ${
                    flip ? "md:order-1 md:col-start-1" : "md:col-start-7"
                  }`}
                >
                  <Reveal>
                    <div className="flex items-center gap-4">
                      <span
                        className="font-display text-xl font-light italic"
                        style={{ color: item.accent }}
                      >
                        {item.numeral}.
                      </span>
                      <span className="h-px w-10 bg-[var(--hairline)]" />
                      <span className="eyebrow text-mute">{item.eyebrow}</span>
                    </div>
                  </Reveal>

                  <Reveal delay={80}>
                    <p
                      className="font-bengali mt-5 text-xl font-light"
                      style={{ color: item.accent }}
                    >
                      {item.bengali}
                    </p>
                    <h3 className="font-display mt-3 text-4xl font-light leading-tight sm:text-5xl">
                      {item.title}
                    </h3>
                  </Reveal>

                  <Reveal delay={150}>
                    <p className="mt-6 text-[1rem] leading-[1.85] text-ink-soft">
                      {item.body}
                    </p>
                  </Reveal>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. Closing Quote & CTA */}
      <section className="bg-espresso text-paper px-5 py-20 sm:px-10 sm:py-28 text-center">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <img
              src="/brand/noksha-mark-light.png"
              alt=""
              className="mx-auto h-12 w-12 opacity-90"
            />
            <blockquote className="font-display mt-8 text-3xl font-light leading-[1.25] sm:text-5xl">
              {siteContent.about_closing_quote ||
                "“When you bring a piece of Noksha into your home, you carry a story forward—for the hands that made it, and for the generation that will inherit it.”"}
            </blockquote>
            <p className="font-bengali mt-6 text-lg font-light text-gold-soft">
              {siteContent.about_closing_bengali || "নকশা — বাংলার ঐতিহ্য, আগামী প্রজন্মের জন্য"}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/#shop" className="press btn-ghost on-dark">
                Explore The Pieces
              </Link>
              <Link
                href="/collections/nakshi-kantha"
                className="link-draw eyebrow !tracking-[0.24em] text-paper/90"
              >
                Discover 1-of-1 Kanthas <span className="arrow">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
