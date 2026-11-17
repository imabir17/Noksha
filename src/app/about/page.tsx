import type { Metadata } from "next";
import AboutView from "@/components/AboutView";

export const metadata: Metadata = {
  title: "Our Story, Mission & Vision | NOKSHA — Handcrafted in Bangladesh",
  description:
    "Why we started Noksha: preserving Bangladeshi history and craft heritage, inspiring the younger generation, and empowering women and artisans across Bangladesh.",
};

export default function AboutPage() {
  return <AboutView />;
}
