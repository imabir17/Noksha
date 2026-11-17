import type { Metadata } from "next";
import DropsView from "@/components/DropsView";
import { getAllCollections, getAllProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exclusive Drops | NOKSHA — নকশা",
  description:
    "Explore Noksha's numbered collector Drops featuring one-of-one Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes.",
};

export default function DropsPage() {
  const collections = getAllCollections(false);
  const products = getAllProducts(false);

  return <DropsView initialCollections={collections} initialProducts={products} />;
}
