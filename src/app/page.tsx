"use client";

import React, { useState } from "react";
import Hero from "@/components/Hero";
import { Collections, Manifesto } from "@/components/Story";
import Shop, { CategoryFilter } from "@/components/Shop";
import { Atelier, FoundingCircle, Footer } from "@/components/Sections";
import { useStore } from "@/context/StoreContext";

export default function HomePage() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const { addToBag, setPromo } = useStore();

  const explore = (id: CategoryFilter) => {
    setCategory(id);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        <Hero />
        <Manifesto />
        <Collections onExplore={explore} />
        <Shop
          category={category}
          onCategory={setCategory}
          onQuickAdd={(p) => addToBag(p)}
        />
        <Atelier />
        <FoundingCircle onJoined={() => setPromo("SHUVO10")} />
      </main>
      <Footer />
    </>
  );
}
