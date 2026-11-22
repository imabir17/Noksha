"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { LAUNCH_ROADMAP } from "@/data/nokshaData";
import { useStore } from "@/context/StoreContext";

const HOUSE_TENETS = [
  {
    no: "01",
    title: "A singular story",
    body: "Every Nakshi Kantha is one of a kind — one design, stitched once, never repeated. Our light shades and carved chests are curated in small editions.",
  },
  {
    no: "02",
    title: "Honest materials",
    body: "Handloom kora cotton, seasoned bamboo, alluvial terracotta, and solid Bengal hardwood with cast brass — never synthetic veneer.",
  },
  {
    no: "03",
    title: "Wrapped to keep",
    body: "Each piece leaves our Dhaka studio wrapped in unbleached kora muslin with dried marigold.",
  },
];

export function Atelier() {
  const { siteContent } = useStore();
  const tenets = [
    {
      no: "01",
      title: siteContent.tenet_1_title || HOUSE_TENETS[0].title,
      body: siteContent.tenet_1_body || HOUSE_TENETS[0].body,
    },
    {
      no: "02",
      title: siteContent.tenet_2_title || HOUSE_TENETS[1].title,
      body: siteContent.tenet_2_body || HOUSE_TENETS[1].body,
    },
    {
      no: "03",
      title: siteContent.tenet_3_title || HOUSE_TENETS[2].title,
      body: siteContent.tenet_3_body || HOUSE_TENETS[2].body,
    },
  ];

  return (
    <section id="atelier" className="bg-espresso text-paper">
      {/* Full-bleed craft image with a single quote */}
      <div className="relative h-[80svh] min-h-[520px] overflow-hidden">
        <Reveal variant="media" className="absolute inset-0">
          <img
            src={siteContent.atelier_image || "/images/artisan-hands.jpg"}
            alt="An artisan's hands stitching a Nakshi Kantha"
            className="h-full w-full object-cover"
          />
        </Reveal>
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/30 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1440px] items-end px-5 pb-16 sm:px-10 sm:pb-24">
          <Reveal className="max-w-3xl">
            <p className="eyebrow text-gold-soft">{siteContent.atelier_eyebrow || "The Atelier"}</p>
            <blockquote className="font-display mt-6 text-4xl font-light leading-[1.15] sm:text-6xl">
              {siteContent.atelier_quote || "“Pull the thread too tight and the story loses its softness.”"}
            </blockquote>
            <p className="eyebrow mt-6 text-paper/60">{siteContent.atelier_caption || "Hand-stitched in Bangladesh"}</p>
          </Reveal>
        </div>
      </div>

      {/* Three quiet house tenets — no regional/location breakdown */}
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-18">
        <div className="grid border-t border-[var(--hairline-light)] md:grid-cols-3">
          {tenets.map((t, i) => (
            <Reveal
              key={t.no}
              delay={i * 80}
              className={`py-10 md:px-10 ${i > 0 ? "border-t border-[var(--hairline-light)] md:border-l md:border-t-0" : ""} md:first:pl-0 md:last:pr-0`}
            >
              <span className="eyebrow tabular-nums !text-[0.6rem] text-gold-soft">{t.no}</span>
              <h3 className="font-display mt-5 text-3xl font-light">{t.title}</h3>
              <p className="mt-4 text-[0.95rem] leading-[1.8] text-paper/70">{t.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

interface CircleProps {
  onJoined: () => void;
}

export function FoundingCircle({ onJoined }: CircleProps) {
  const { siteContent } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState<{ name: string; no: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const no = String(Math.floor(100 + Math.random() * 400)).padStart(3, "0");
    setJoined({ name: name.trim(), no });
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join_circle",
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        memberNo: no,
      }),
    }).catch(() => {});
    onJoined();
  };

  return (
    <section id="circle" className="kantha-bg grain relative bg-cream px-5 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1440px]">
        {/* Release calendar */}
        <Reveal className="text-center">
          <p className="eyebrow text-gold">{siteContent.calendar_eyebrow || "Release calendar"}</p>
          <h2 className="font-display mt-5 text-5xl font-light sm:text-7xl">
            {siteContent.calendar_title || <>Made in <em>small numbers.</em></>}
          </h2>
        </Reveal>

        <div className="mt-12 grid border-t border-[var(--hairline)] md:grid-cols-3">
          {LAUNCH_ROADMAP.map((m, i) => (
            <Reveal
              key={m.batch}
              delay={i * 80}
              className={`py-10 md:px-10 ${i > 0 ? "border-t border-[var(--hairline)] md:border-l md:border-t-0" : ""} md:first:pl-0`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    m.state === "live" ? "bg-river" : m.state === "waitlist" ? "bg-marigold" : "bg-alta"
                  }`}
                />
                <span className="eyebrow !text-[0.6rem] text-mute">{m.batch}</span>
              </div>
              <h3 className="font-display mt-6 text-3xl font-light">{m.title}</h3>
              <p className="font-bengali mt-2 text-sm text-mute">{m.bengaliLabel}</p>
              <p className="mt-5 text-[0.92rem] leading-[1.8] text-ink-soft">{m.summary}</p>
            </Reveal>
          ))}
        </div>

        {/* Invitation */}
        <div className="mt-16 grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-gold">{siteContent.circle_eyebrow || "The Founding Circle"}</p>
            <h3 className="font-display mt-5 text-5xl font-light leading-[1.05] sm:text-6xl">
              {siteContent.circle_title_line1 || "An invitation to"} <br />
              <em>{siteContent.circle_title_line2 || "our first collectors."}</em>
            </h3>
            <p className="mt-8 max-w-md text-[0.95rem] leading-[1.8] text-ink-soft">
              {siteContent.circle_body ||
                "Private previews of each batch before release, early access to one-of-one Kanthas, and a founding courtesy on your first acquisition."}
            </p>
          </Reveal>

          <Reveal delay={120}>
            {joined ? (
              <div className="swap-fade relative border border-gold/50 bg-paper p-10 sm:p-14">
                <img src="/brand/noksha-mark.png" alt="" className="h-10 w-10" />
                <p className="eyebrow mt-8 text-gold">
                  Founding Circle · No. <span className="font-num">{joined.no}</span>
                </p>
                <p className="font-display mt-4 text-4xl font-light">Welcome, {joined.name}.</p>
                <p className="mt-6 text-[0.95rem] leading-[1.8] text-ink-soft">
                  Your founding courtesy of ten percent has been added to your bag and will apply
                  at checkout. We will write before each release.
                </p>
                <p className="eyebrow mt-8 text-mute">
                  Courtesy code &nbsp;<span className="text-ink">SHUVO<span className="font-num">10</span></span>
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-2">
                <label className="sr-only" htmlFor="c-name">Name</label>
                <input id="c-name" className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                <label className="sr-only" htmlFor="c-email">Email</label>
                <input id="c-email" type="email" className="field" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label className="sr-only" htmlFor="c-phone">Phone</label>
                <input id="c-phone" type="tel" className="field" placeholder="Phone / WhatsApp (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div className="pt-8">
                  <button type="submit" className="press btn-solid w-full sm:w-auto cursor-pointer">
                    Request an invitation
                  </button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { siteContent } = useStore();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const waDisplay = siteContent.whatsapp_number
    ? siteContent.whatsapp_number.replace(/^880/, "+880 ")
    : "+880 1973-673217";

  return (
    <footer className="bg-espresso text-paper">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 sm:px-10">
        <div className="flex flex-col items-center text-center">
          <img src={siteContent.brand_logo_light || "/brand/noksha-logo-light.png"} alt="Noksha — Handcrafted in Bangladesh" className="h-16 w-auto sm:h-20" />
          <p className="font-bengali mt-8 text-lg font-light text-paper/60">
            {siteContent.footer_tagline_bengali || "নকশা — বাংলার হাতের কাজ"}
          </p>
        </div>

        <div className="mt-12 grid gap-12 border-t border-[var(--hairline-light)] py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow !text-[0.6rem] text-gold-soft">{siteContent.footer_atelier_title || "Online Atelier"}</p>
            <p className="mt-5 text-sm leading-[1.9] text-paper/70 whitespace-pre-line">
              {siteContent.footer_atelier_lines || "Dhaka, Bangladesh\nDispatched nationwide\nSat – Thu, 11 AM – 7 PM"}
            </p>
          </div>
          <div>
            <p className="eyebrow !text-[0.6rem] text-gold-soft">{siteContent.footer_care_title || "Client care"}</p>
            <p className="mt-5 text-sm leading-[1.9] text-paper/70">
              {waDisplay} (WhatsApp)<br />{siteContent.support_email || "atelier@noksha.bd"}<br />{siteContent.footer_delivery_note || "Nationwide delivery"}
            </p>
          </div>
          <div>
            <p className="eyebrow !text-[0.6rem] text-gold-soft">House</p>
            <ul className="mt-5 space-y-2 text-sm text-paper/70">
              <li><a className="nav-link" href="/about">Our Story</a></li>
              <li><Link className="nav-link" href="/drops">Exclusive Drops</Link></li>
              <li><a className="nav-link" href="/#categories">Categories</a></li>
              <li><Link className="nav-link" href="/track-order">Track Order</Link></li>
              <li><a className="nav-link" href="/#atelier">The Atelier</a></li>
              <li><a className="nav-link" href="/#circle">Founding Circle</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-[0.6rem] text-gold-soft">Letters from the looms</p>
            {done ? (
              <p className="swap-fade mt-5 text-sm text-paper/70">Thank you — our next letter is on its way to you.</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) {
                    fetch("/api/store", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "subscribe_newsletter",
                        email: email.trim(),
                      }),
                    }).catch(() => {});
                    setDone(true);
                  }
                }}
                className="mt-3 flex items-end gap-4"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="field on-dark text-sm"
                  aria-label="Email address"
                />
                <button type="submit" className="press eyebrow shrink-0 pb-3 text-paper cursor-pointer">
                  Join →
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--hairline-light)] py-8 text-paper/45 sm:flex-row">
          <p className="eyebrow !text-[0.58rem]">
            {siteContent.footer_copyright || "© 2026 Noksha · Handcrafted in Bangladesh"}
          </p>
          <p className="eyebrow !text-[0.58rem]">
            {siteContent.footer_payments_note || "Cash on delivery · UddoktaPay · bKash · Nagad · Cards"}
          </p>
        </div>
      </div>
    </footer>
  );
}
