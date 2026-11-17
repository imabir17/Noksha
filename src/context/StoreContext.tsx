"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import BagDrawer, { CartItem } from "@/components/BagDrawer";
import { DropStatus, FOUNDING_PILLARS, NOKSHA_PRODUCTS, NokshaProduct } from "@/data/nokshaData";
import { PlacedOrder, PromoRule } from "@/lib/pricing";

export interface StoreCategory {
  id: string;
  shortName: string;
  name: string;
  bengaliName: string;
  subtitle: string;
  sortOrder: number;
  active: boolean;
}

export interface StoreCollection {
  id: string;
  dropNumber?: string;
  shortName: string;
  title: string;
  bengaliTitle: string;
  subtitle: string;
  description: string;
  story: string;
  craftMetric: string;
  priceRange: string;
  heroImage: string;
  bannerImage: string;
  accentHex: string;
  exclusivity: "multi" | "one_of_one";
  dropStatus?: DropStatus;
  releaseDate?: string;
  sortOrder: number;
  active: boolean;
}

const DEFAULT_CATEGORIES: StoreCategory[] = [
  {
    id: "light-shades",
    shortName: "Alo",
    name: "Light Shades",
    bengaliName: "আলো — হাতে বোনা ল্যাম্পশেড",
    subtitle: "Architectural warmth woven in bamboo, cane, jamdani muslin, and terracotta.",
    sortOrder: 1,
    active: true,
  },
  {
    id: "nakshi-kantha",
    shortName: "Kantha",
    name: "Nakshi Kanthas",
    bengaliName: "নকশি কাঁথা — সূচিশিল্পের কাব্য",
    subtitle: "Hand-embroidered heritage quilts stitched by rural women artisans.",
    sortOrder: 2,
    active: true,
  },
  {
    id: "jewelry-boxes",
    shortName: "Boxes",
    name: "Wooden Jewelry Boxes",
    bengaliName: "কাঠের গহনার বাক্স",
    subtitle: "Heirloom Chittagong teak, rosewood, and Dhamrai lost-wax brass keepsake chests.",
    sortOrder: 3,
    active: true,
  },
];

const DEFAULT_COLLECTIONS: StoreCollection[] = FOUNDING_PILLARS.map((p, idx) => ({
  id: `drop-0${idx + 1}`,
  dropNumber: `Drop 0${idx + 1}`,
  shortName: `Drop 0${idx + 1}`,
  title: p.title,
  bengaliTitle: p.bengaliTitle,
  subtitle: p.subtitle,
  description: p.description,
  story: p.description,
  craftMetric: p.craftMetric,
  priceRange: p.priceRange,
  heroImage: p.heroImage,
  bannerImage: p.heroImage,
  accentHex: p.accentHex,
  exclusivity: "one_of_one",
  dropStatus: idx === 0 ? "live" : idx === 1 ? "prebooking" : "upcoming",
  releaseDate: idx === 0 ? "Live Now" : idx === 1 ? "Pre-Booking Open" : "Upcoming Drop",
  sortOrder: idx + 1,
  active: true,
}));

interface StoreContextValue {
  hydrated: boolean;
  categories: StoreCategory[];
  collections: StoreCollection[];
  products: NokshaProduct[];
  promoRules: PromoRule[];
  siteContent: Record<string, string>;
  visitorId: string;
  sessionId: string;
  bag: CartItem[];
  bagCount: number;
  promo: string | null;
  giftNote: string;
  reserved: string[];
  lastOrder: PlacedOrder | null;
  addToBag: (product: NokshaProduct, quantity?: number, color?: string) => void;
  updateQty: (id: string, color: string, delta: number) => void;
  removeItem: (id: string, color: string) => void;
  clearBag: () => void;
  reservePiece: (id: string, name?: string, phone?: string, productName?: string) => void;
  setPromo: (code: string | null) => void;
  setGiftNote: (note: string) => void;
  saveOrder: (order: PlacedOrder | null) => void;
  openBag: () => void;
  trackEvent: (eventType: string, extra?: { path?: string; productId?: string; step?: string; durationMs?: number }) => void;
  refreshStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

const KEYS = {
  bag: "noksha_bag",
  promo: "noksha_promo",
  gift: "noksha_gift",
  reserved: "noksha_reserved",
  order: "noksha_last_order",
  vid: "noksha_vid",
  sid: "noksha_sid",
};

function detectReferrer(): string {
  if (typeof document === "undefined" || !document.referrer) return "Direct";
  const r = document.referrer.toLowerCase();
  if (r.includes("instagram")) return "Instagram";
  if (r.includes("facebook") || r.includes("fb.")) return "Facebook";
  if (r.includes("whatsapp") || r.includes("wa.me")) return "WhatsApp";
  if (r.includes("google")) return "Google Search";
  return "Direct";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const [categories, setCategories] = useState<StoreCategory[]>(DEFAULT_CATEGORIES);
  const [collections, setCollections] = useState<StoreCollection[]>(DEFAULT_COLLECTIONS);
  const [products, setProducts] = useState<NokshaProduct[]>(NOKSHA_PRODUCTS);
  const [promoRules, setPromoRules] = useState<PromoRule[]>([
    { code: "SHUVO10", discountType: "percent", discountValue: 10, minOrderBDT: 0, label: "10% Inaugural Launch Privilege", active: true },
  ]);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [visitorId, setVisitorId] = useState("anon");
  const [sessionId, setSessionId] = useState("sess");

  const [bag, setBag] = useState<CartItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [promo, setPromoState] = useState<string | null>(null);
  const [giftNote, setGiftNoteState] = useState("");
  const [reserved, setReserved] = useState<string[]>([]);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const pageEnteredAtRef = useRef<number>(Date.now());
  const currentStepRef = useRef<string>("landing");

  const refreshStore = useCallback(async () => {
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
      if (Array.isArray(data.collections) && data.collections.length > 0) {
        setCollections(data.collections);
      }
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
      if (Array.isArray(data.promoCodes)) {
        setPromoRules(data.promoCodes);
      }
      if (data.siteContent) {
        setSiteContent(data.siteContent);
      }
    } catch {
      // fallback to static defaults
    }
  }, []);

  useEffect(() => {
    try {
      const read = (k: string) => localStorage.getItem(k);
      const b = read(KEYS.bag);
      const p = read(KEYS.promo);
      const g = read(KEYS.gift);
      const r = read(KEYS.reserved);
      const o = read(KEYS.order);
      if (b) setBag(JSON.parse(b));
      if (p) setPromoState(p);
      if (g) setGiftNoteState(g);
      if (r) setReserved(JSON.parse(r));
      if (o) setLastOrder(JSON.parse(o));

      let vid = read(KEYS.vid);
      if (!vid) {
        vid = `vis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem(KEYS.vid, vid);
      }
      setVisitorId(vid);

      let sid = sessionStorage.getItem(KEYS.sid);
      if (!sid) {
        sid = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem(KEYS.sid, sid);
      }
      setSessionId(sid);
    } catch {
      // Ignore storage errors
    }
    setHydrated(true);
    refreshStore();
  }, [refreshStore]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEYS.bag, JSON.stringify(bag));
      localStorage.setItem(KEYS.gift, giftNote);
      localStorage.setItem(KEYS.reserved, JSON.stringify(reserved));
      if (promo) localStorage.setItem(KEYS.promo, promo);
      else localStorage.removeItem(KEYS.promo);
      if (lastOrder) localStorage.setItem(KEYS.order, JSON.stringify(lastOrder));
      else localStorage.removeItem(KEYS.order);
    } catch {
      // Ignore storage errors
    }
  }, [bag, promo, giftNote, reserved, lastOrder, hydrated]);

  const trackEvent = useCallback(
    (
      eventType: string,
      extra?: { path?: string; productId?: string; step?: string; durationMs?: number }
    ) => {
      if (typeof window === "undefined") return;
      const p = extra?.path ?? window.location.pathname;
      if (p.startsWith("/admin")) return;
      if (extra?.step) currentStepRef.current = extra.step;
      const payload = {
        action: "track_event",
        visitorId,
        sessionId,
        eventType,
        path: p,
        productId: extra?.productId ?? "",
        step: extra?.step ?? currentStepRef.current,
        referrer: detectReferrer(),
        device: window.innerWidth < 768 ? "mobile" : "desktop",
        durationMs: extra?.durationMs ?? 0,
      };
      fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    },
    [visitorId, sessionId]
  );

  // Track route views and page exits on storefront
  useEffect(() => {
    if (!hydrated || !pathname || pathname.startsWith("/admin")) return;
    pageEnteredAtRef.current = Date.now();

    if (pathname === "/") {
      currentStepRef.current = "landing";
      trackEvent("page_view", { path: "/", step: "landing" });
    } else if (pathname.startsWith("/pieces/")) {
      const pid = pathname.replace("/pieces/", "");
      currentStepRef.current = "product_detail";
      trackEvent("product_view", { path: pathname, productId: pid, step: "product_detail" });
    } else if (pathname === "/checkout") {
      currentStepRef.current = "checkout_viewed";
      trackEvent("checkout_step", { path: "/checkout", step: "checkout_viewed" });
    }

    const handlePageHide = () => {
      const durationMs = Math.max(1000, Date.now() - pageEnteredAtRef.current);
      trackEvent("page_exit", {
        path: pathname,
        step: currentStepRef.current,
        durationMs,
      });
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [hydrated, pathname, trackEvent]);

  const addToBag = useCallback(
    (product: NokshaProduct, quantity = 1, color = product.colors[0]?.name ?? "") => {
      if (product.status === "sold") return;
      if (product.collectionId && (product.dropStatus === "upcoming" || product.dropStatus === "prebooking")) return;
      const isOneOfOne = Boolean(product.collectionId);
      const maxStock = isOneOfOne ? 1 : Math.min(10, Math.max(1, product.stockQty ?? 5));
      setBag((prev) => {
        const hit = prev.find((i) => i.product.id === product.id && i.selectedColor === color);
        if (hit) {
          if (isOneOfOne) return prev;
          return prev.map((i) => (i === hit ? { ...i, quantity: Math.min(maxStock, i.quantity + quantity) } : i));
        }
        return [
          ...prev,
          { product, quantity: isOneOfOne ? 1 : Math.min(maxStock, quantity), selectedColor: color },
        ];
      });
      setBagOpen(true);
      currentStepRef.current = "bag_opened";
      trackEvent("add_to_bag", { productId: product.id, step: "bag_opened" });
    },
    [trackEvent]
  );

  const updateQty = useCallback((id: string, color: string, delta: number) => {
    setBag((prev) =>
      prev
        .map((i) => {
          if (i.product.id === id && i.selectedColor === color) {
            const isOneOfOne = Boolean(i.product.collectionId);
            const maxStock = isOneOfOne ? 1 : Math.min(10, Math.max(1, i.product.stockQty ?? 5));
            return { ...i, quantity: Math.min(maxStock, i.quantity + delta) };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string, color: string) => {
    setBag((prev) => prev.filter((i) => !(i.product.id === id && i.selectedColor === color)));
  }, []);

  const clearBag = useCallback(() => setBag([]), []);

  const reservePiece = useCallback(
    (id: string, name = "", phone = "", productName = "") => {
      setReserved((r) => (r.includes(id) ? r : [...r, id]));
      fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reserve_waitlist",
          productId: id,
          productName,
          name,
          phone,
        }),
      }).catch(() => {});
    },
    []
  );

  const setPromo = useCallback((code: string | null) => setPromoState(code), []);
  const setGiftNote = useCallback((note: string) => setGiftNoteState(note), []);
  const saveOrder = useCallback((order: PlacedOrder | null) => setLastOrder(order), []);
  const openBag = useCallback(() => setBagOpen(true), []);
  const closeBag = useCallback(() => setBagOpen(false), []);

  useEffect(() => {
    if (pathname === "/checkout" || isAdmin) setBagOpen(false);
  }, [pathname, isAdmin]);

  const bagCount = bag.reduce((s, i) => s + i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        hydrated,
        categories,
        collections,
        products,
        promoRules,
        siteContent,
        visitorId,
        sessionId,
        bag,
        bagCount,
        promo,
        giftNote,
        reserved,
        lastOrder,
        addToBag,
        updateQty,
        removeItem,
        clearBag,
        reservePiece,
        setPromo,
        setGiftNote,
        saveOrder,
        openBag,
        trackEvent,
        refreshStore,
      }}
    >
      {!isAdmin && siteContent.announcement_enabled === "true" && siteContent.announcement_text && (
        <div className="bg-espresso text-paper text-center py-2 px-4 text-xs tracking-widest uppercase border-b border-[var(--hairline-light)]">
          {siteContent.announcement_text}
        </div>
      )}
      {!isAdmin && (
        <Header
          bagCount={bagCount}
          onOpenBag={openBag}
          transparentHero={
            pathname === "/" ||
            pathname === "/about" ||
            Boolean(pathname?.startsWith("/collections/"))
          }
        />
      )}
      {children}
      {!isAdmin && bagOpen && (
        <BagDrawer
          items={bag}
          promo={promo}
          promoRules={promoRules}
          giftNote={giftNote}
          onPromo={setPromo}
          onGiftNote={setGiftNote}
          onQty={updateQty}
          onRemove={removeItem}
          onClose={closeBag}
        />
      )}
    </StoreContext.Provider>
  );
}
