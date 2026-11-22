"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Reveal } from "./Reveal";
import { availabilityNote } from "./Shop";
import { Footer } from "./Sections";
import { StoreCategory, useStore } from "@/context/StoreContext";
import { NokshaProduct, formatBDT } from "@/data/nokshaData";

type EditionFilter = "all" | "store" | "drops";
type AvailabilityFilter = "all" | "available" | "prebook" | "sold";
type SortOption = "featured" | "price-asc" | "price-desc" | "hours-desc" | "name-asc";

interface ShopPageViewProps {
  initialProducts: NokshaProduct[];
  initialCategories: StoreCategory[];
}

export default function ShopPageView({
  initialProducts,
  initialCategories,
}: ShopPageViewProps) {
  const { products, categories, addToBag, siteContent } = useStore();
  const allProducts = products.length > 0 ? products : initialProducts;
  const allCategories = categories.length > 0 ? categories : initialCategories;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editionFilter, setEditionFilter] = useState<EditionFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  const getCategoryName = (catId: string) => {
    const found = allCategories.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = allProducts.filter((p) => {
      const isCol = Boolean(p.collectionId && p.collectionId.trim() !== "");
      const stock = p.stockQty ?? 5;
      const isSold = p.status === "sold" || (!isCol && stock <= 0);
      const isPrebook =
        (isCol && (p.dropStatus === "prebooking" || p.dropStatus === "upcoming")) ||
        p.status === "waitlist";

      if (q) {
        const hay = `${p.name} ${p.bengaliName} ${p.materials} ${p.collectionName || ""} ${p.dropNumber || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }

      if (editionFilter === "store" && isCol) return false;
      if (editionFilter === "drops" && !isCol) return false;

      if (availabilityFilter === "available" && (isSold || isPrebook)) return false;
      if (availabilityFilter === "prebook" && !isPrebook) return false;
      if (availabilityFilter === "sold" && !isSold) return false;

      return true;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.priceBDT - b.priceBDT);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceBDT - a.priceBDT);
        break;
      case "hours-desc":
        sorted.sort((a, b) => (b.artisanHours || 0) - (a.artisanHours || 0));
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        break;
    }

    return sorted;
  }, [allProducts, search, categoryFilter, editionFilter, availabilityFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    editionFilter !== "all" ||
    availabilityFilter !== "all" ||
    sortBy !== "featured";

  const clearAll = () => {
    setSearch("");
    setCategoryFilter("all");
    setEditionFilter("all");
    setAvailabilityFilter("all");
    setSortBy("featured");
  };

  return (
    <>
      <main className="kantha-bg bg-paper pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
          {/* Editorial Header */}
          <div className="border-b border-[var(--hairline)] pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-gold">
                {siteContent.shop_page_eyebrow || "Complete Noksha Archive & Store"}
              </p>
              <h1 className="font-display mt-4 text-5xl font-light leading-none sm:text-7xl">
                {siteContent.shop_page_title || <>Shop <em>All Pieces</em></>}
              </h1>
              <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
                {siteContent.shop_page_description ||
                  "Every creation from our atelier in one place—browse multi-stock signature store pieces alongside singular one-of-one collector works from our numbered Drops."}
              </p>
            </div>
            <p className="eyebrow !text-[0.62rem] text-mute shrink-0">
              Showing <span className="font-num text-ink">{filteredProducts.length}</span> of{" "}
              <span className="font-num text-ink">{allProducts.length}</span> pieces
            </p>
          </div>

          {/* Search, Filter & Sort Toolbar */}
          <div className="mt-8 border border-[var(--hairline)] bg-cream/70 p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-center">
              {/* Search */}
              <div className="relative md:col-span-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pieces, materials, or Drop..."
                  className="w-full border border-[var(--hairline)] bg-paper py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                  aria-label="Search pieces"
                />
              </div>

              {/* Category Filter */}
              <div className="md:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-[var(--hairline)] bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none cursor-pointer"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Edition / Type Filter */}
              <div className="md:col-span-2">
                <select
                  value={editionFilter}
                  onChange={(e) => setEditionFilter(e.target.value as EditionFilter)}
                  className="w-full border border-[var(--hairline)] bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none cursor-pointer"
                  aria-label="Filter by edition"
                >
                  <option value="all">All Editions</option>
                  <option value="store">Store (Multi-Stock)</option>
                  <option value="drops">Exclusive Drops (1 of 1)</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div className="md:col-span-3">
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
                  className="w-full border border-[var(--hairline)] bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none cursor-pointer"
                  aria-label="Filter by availability"
                >
                  <option value="all">All Availability</option>
                  <option value="available">Available Now</option>
                  <option value="prebook">Pre-Booking / Upcoming</option>
                  <option value="sold">Sold Out / Acquired</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Quick Category Pills + Sort Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow !text-[0.56rem] text-mute mr-1 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3 w-3" /> Quick Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`eyebrow px-3 py-1.5 !text-[0.56rem] border cursor-pointer transition-colors ${
                    categoryFilter === "all"
                      ? "bg-ink text-paper border-ink"
                      : "bg-paper text-ink-soft border-[var(--hairline)] hover:border-ink"
                  }`}
                >
                  All
                </button>
                {allCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryFilter(c.id)}
                    className={`eyebrow px-3 py-1.5 !text-[0.56rem] border cursor-pointer transition-colors ${
                      categoryFilter === c.id
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper text-ink-soft border-[var(--hairline)] hover:border-ink"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="eyebrow inline-flex items-center gap-1 px-2.5 py-1.5 !text-[0.56rem] text-alta hover:underline cursor-pointer"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <label htmlFor="shop-sort" className="eyebrow !text-[0.56rem] text-mute">
                  Sort by
                </label>
                <select
                  id="shop-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-[var(--hairline)] bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="hours-desc">Most Artisan Hours</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center border-b border-[var(--hairline)]">
              <p className="font-display text-3xl font-light text-ink-soft">
                No pieces match your current filters.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="press btn-solid mt-8 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
              {filteredProducts.map((p, i) => {
                const isCollectionPiece = Boolean(
                  p.collectionId && p.collectionId.trim() !== ""
                );
                const stock = p.stockQty ?? 5;
                const isSold = p.status === "sold" || (!isCollectionPiece && stock <= 0);
                const isPrebook =
                  (isCollectionPiece && p.dropStatus === "prebooking") ||
                  p.status === "waitlist";
                const isUpcoming = isCollectionPiece && p.dropStatus === "upcoming";

                return (
                  <Reveal key={p.id} as="article" delay={(i % 3) * 60} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                      <Link
                        href={`/pieces/${p.id}`}
                        className="block h-full w-full"
                        aria-label={`View ${p.name}`}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="media-zoom h-full w-full object-cover"
                        />
                      </Link>

                      <span className="eyebrow pointer-events-none absolute left-4 top-4 bg-paper/92 px-3 py-1.5 !text-[0.58rem] text-ink backdrop-blur-sm">
                        <span className="font-num">{availabilityNote(p)}</span>
                      </span>

                      {isCollectionPiece && (
                        <Link
                          href={`/collections/${p.collectionId}`}
                          className="eyebrow absolute right-4 top-4 bg-espresso/90 px-3 py-1.5 !text-[0.56rem] text-gold-soft backdrop-blur-sm hover:bg-espresso transition-colors"
                        >
                          <span className="font-num">{p.dropNumber || "Drop"}</span> · 1 of 1
                        </Link>
                      )}

                      {isSold ? (
                        <span className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/85 py-4 text-center text-paper/85 backdrop-blur-sm md:block">
                          {isCollectionPiece
                            ? p.acquiredBy
                              ? `Acquired by ${p.acquiredBy}`
                              : "Acquired"
                            : "Sold out"}
                        </span>
                      ) : isUpcoming ? (
                        <Link
                          href={`/pieces/${p.id}`}
                          className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-center text-paper backdrop-blur-sm hover:bg-ink md:block"
                        >
                          Upcoming Drop · View Piece
                        </Link>
                      ) : isPrebook ? (
                        <Link
                          href={`/pieces/${p.id}`}
                          className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-center text-paper backdrop-blur-sm hover:bg-ink md:block"
                        >
                          Pre-Book This Piece
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToBag(p)}
                          className="quick-add eyebrow absolute inset-x-0 bottom-0 hidden bg-ink/90 py-4 text-paper backdrop-blur-sm hover:bg-ink md:block cursor-pointer"
                        >
                          {isCollectionPiece ? "Acquire 1-of-1 Piece" : "Add to bag"}
                        </button>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="eyebrow !text-[0.55rem] text-mute">
                          {getCategoryName(p.category)}
                        </span>
                        {isCollectionPiece ? (
                          <Link
                            href={`/collections/${p.collectionId}`}
                            className="eyebrow !text-[0.55rem] text-gold hover:underline"
                          >
                            <span className="font-num">{p.dropNumber || "Drop"}</span>
                            {p.collectionName ? ` — ${p.collectionName}` : ""}
                          </Link>
                        ) : (
                          <span className="eyebrow !text-[0.55rem] text-mute">
                            {isSold ? (
                              <span className="text-alta">Sold out</span>
                            ) : (
                              <>
                                <span className="font-num">{stock}</span> in stock
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <Link href={`/pieces/${p.id}`} className="block w-full text-left">
                        <div className="flex items-start justify-between gap-6">
                          <div>
                            <h2 className="font-display text-[1.45rem] font-light leading-tight">
                              {p.name}
                            </h2>
                            <p className="font-bengali mt-1.5 text-sm text-mute">{p.bengaliName}</p>
                          </div>
                          <p className="shrink-0 pt-1 text-sm tabular-nums text-ink-soft">
                            {formatBDT(p.priceBDT)}
                          </p>
                        </div>

                        {isCollectionPiece && isSold && p.acquiredBy ? (
                          <p className="eyebrow mt-3 !text-[0.58rem] text-gold">
                            Acquired by {p.acquiredBy}
                          </p>
                        ) : (
                          <p className="eyebrow mt-3 !text-[0.58rem] text-mute">
                            <span className="font-num">{p.artisanHours}</span> hours by hand
                            {isCollectionPiece && " · One of One"}
                          </p>
                        )}
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
