import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionDetailView from "@/components/CollectionDetailView";
import { getAllCollections, getAllProducts, getCollectionById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const col = getCollectionById(id);
  if (!col) {
    return { title: "Collection Not Found | NOKSHA" };
  }
  return {
    title: `${col.shortName} — ${col.title} (${col.bengaliTitle}) | NOKSHA`,
    description: col.description,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const col = getCollectionById(id);

  if (!col) {
    notFound();
  }

  const allCollections = getAllCollections(false);
  const allProducts = getAllProducts(false);
  const products = allProducts.filter((p) => p.collectionId === col.id);
  const otherCollections = allCollections.filter((c) => c.id !== col.id);

  return (
    <CollectionDetailView
      collection={col}
      initialProducts={products}
      otherCollections={otherCollections}
    />
  );
}
