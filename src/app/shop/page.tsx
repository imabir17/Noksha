import type { Metadata } from "next";
import ShopPageView from "@/components/ShopPageView";
import { getAllCategories, getAllProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All Pieces | NOKSHA — নকশা",
  description:
    "Browse all Noksha creations—regular multi-stock Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes alongside one-of-one Exclusive Drop pieces.",
};

export default function ShopPage() {
  const products = getAllProducts(false);
  const categories = getAllCategories(false);

  return <ShopPageView initialProducts={products} initialCategories={categories} />;
}
