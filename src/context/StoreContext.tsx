"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import BagDrawer, { CartItem } from "@/components/BagDrawer";
import { NokshaProduct } from "@/data/nokshaData";

interface StoreContextValue {
  bag: CartItem[];
  bagCount: number;
  promo: string | null;
  reserved: string[];
  addToBag: (product: NokshaProduct, quantity?: number, color?: string) => void;
  reservePiece: (id: string) => void;
  setPromo: (code: string | null) => void;
  openBag: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [bag, setBag] = useState<CartItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [promo, setPromoState] = useState<string | null>(null);
  const [reserved, setReserved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedBag = localStorage.getItem("noksha_bag");
      const savedPromo = localStorage.getItem("noksha_promo");
      const savedReserved = localStorage.getItem("noksha_reserved");
      if (savedBag) setBag(JSON.parse(savedBag));
      if (savedPromo) setPromoState(savedPromo);
      if (savedReserved) setReserved(JSON.parse(savedReserved));
    } catch {
      // Ignore storage errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("noksha_bag", JSON.stringify(bag));
      if (promo) localStorage.setItem("noksha_promo", promo);
      else localStorage.removeItem("noksha_promo");
      localStorage.setItem("noksha_reserved", JSON.stringify(reserved));
    } catch {
      // Ignore storage errors
    }
  }, [bag, promo, reserved, hydrated]);

  const addToBag = useCallback(
    (product: NokshaProduct, quantity = 1, color = product.colors[0]?.name ?? "") => {
      setBag((prev) => {
        const hit = prev.find((i) => i.product.id === product.id && i.selectedColor === color);
        if (hit) {
          if (product.category === "nakshi-kantha") return prev;
          return prev.map((i) => (i === hit ? { ...i, quantity: i.quantity + quantity } : i));
        }
        return [
          ...prev,
          {
            product,
            quantity: product.category === "nakshi-kantha" ? 1 : quantity,
            selectedColor: color,
          },
        ];
      });
      setBagOpen(true);
    },
    []
  );

  const reservePiece = useCallback((id: string) => {
    setReserved((r) => (r.includes(id) ? r : [...r, id]));
  }, []);

  const setPromo = useCallback((code: string | null) => {
    setPromoState(code);
  }, []);

  const openBag = useCallback(() => setBagOpen(true), []);
  const closeBag = useCallback(() => setBagOpen(false), []);

  const bagCount = bag.reduce((s, i) => s + i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{ bag, bagCount, promo, reserved, addToBag, reservePiece, setPromo, openBag }}
    >
      <Header
        bagCount={bagCount}
        onOpenBag={openBag}
        transparentHero={pathname === "/"}
      />
      {children}
      {bagOpen && (
        <BagDrawer
          items={bag}
          promo={promo}
          onPromo={setPromo}
          onQty={(id, color, d) =>
            setBag((prev) =>
              prev
                .map((i) =>
                  i.product.id === id && i.selectedColor === color
                    ? { ...i, quantity: i.quantity + d }
                    : i
                )
                .filter((i) => i.quantity > 0)
            )
          }
          onRemove={(id, color) =>
            setBag((prev) =>
              prev.filter((i) => !(i.product.id === id && i.selectedColor === color))
            )
          }
          onClear={() => setBag([])}
          onClose={closeBag}
        />
      )}
    </StoreContext.Provider>
  );
}
