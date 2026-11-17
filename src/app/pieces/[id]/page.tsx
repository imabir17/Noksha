import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailView from "@/components/ProductDetailView";
import { NOKSHA_PRODUCTS } from "@/data/nokshaData";
import { getAllProducts, getProductById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id) ?? NOKSHA_PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return { title: "Piece Not Found | NOKSHA" };
  }
  return {
    title: `${product.name} (${product.bengaliName}) | NOKSHA`,
    description: product.story,
  };
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const allProducts = getAllProducts(false);
  const product = getProductById(id) ?? NOKSHA_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  const sameCategory = allProducts.filter(
    (p) => p.category === product.category && p.id !== product.id
  );
  const others = allProducts.filter((p) => p.category !== product.category);
  const related = [...sameCategory, ...others].slice(0, 3);

  return <ProductDetailView product={product} related={related} />;
}
