"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  bagCount: number;
  onOpenBag: () => void;
  transparentHero?: boolean;
}

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/drops", label: "Drops" },
  { href: "/#categories", label: "Categories" },
  { href: "/about", label: "About" },
];

export default function Header({ bagCount, onOpenBag, transparentHero = true }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const solid = !transparentHero || scrolled || menuOpen;

  return (
    <>
      <header
        className={`site-header fixed inset-x-0 top-0 z-40 border-b ${
          solid
            ? "bg-paper/92 backdrop-blur-md text-ink border-[var(--hairline)]"
            : "bg-transparent text-paper border-transparent"
        }`}
      >
        <div className="mx-auto grid h-20 sm:h-24 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-10">
          {/* Left: navigation */}
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.slice(0, 2).map((item) => (
              <Link key={item.href} href={item.href} className="nav-link eyebrow !tracking-[0.24em]">
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="press -ml-2 flex h-10 w-10 items-center justify-center lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.25} /> : <Menu className="h-5 w-5" strokeWidth={1.25} />}
          </button>

          {/* Centre: logo (light version over the hero, dark when solid) */}
          <Link href="/" className="logo-swap relative block h-11 w-[176px] sm:h-14 sm:w-[228px]" aria-label="Noksha — home">
            <img
              src="/brand/noksha-logo-light.png"
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: solid ? 0 : 1 }}
            />
            <img
              src="/brand/noksha-logo.png"
              alt="Noksha — Handcrafted in Bangladesh"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: solid ? 1 : 0 }}
            />
          </Link>

          {/* Right: navigation + bag */}
          <div className="flex items-center justify-end gap-9">
            <nav className="hidden items-center gap-9 lg:flex">
              {NAV.slice(2).map((item) => (
                <Link key={item.href} href={item.href} className="nav-link eyebrow !tracking-[0.24em]">
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={onOpenBag}
              className="press nav-link eyebrow !tracking-[0.24em]"
              aria-label={`Open bag, ${bagCount} items`}
            >
              Bag <span className="opacity-60 tabular-nums">({bagCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="overlay-menu fixed inset-0 z-30 bg-paper pt-28 lg:hidden">
          <nav className="flex flex-col px-8">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="hero-line border-b border-[var(--hairline)] py-6 font-display text-4xl font-light"
                style={{ "--d": `${120 + i * 60}ms` } as React.CSSProperties}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="eyebrow mt-12 px-8 text-mute">Dhaka · Online Atelier · Nationwide Delivery</p>
        </div>
      )}
    </>
  );
}
