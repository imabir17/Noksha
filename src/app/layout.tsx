import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Noto_Serif_Bengali } from "next/font/google";
import { StoreProvider } from "@/context/StoreContext";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

const notoBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500"],
  variable: "--font-noto-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://itsnoksha.com"),
  title: "NOKSHA — Handcrafted in Bangladesh",
  description:
    "Noksha (নকশা) is a Bangladeshi house of heirloom craft: woven bamboo and Jamdani light, hand-stitched Nakshi Kanthas, and brass-inlaid Chittagong teak jewellery boxes.",
  openGraph: {
    title: "NOKSHA — Handcrafted in Bangladesh",
    description:
      "Noksha (নকশা) is a Bangladeshi house of heirloom craft: woven bamboo and Jamdani light, hand-stitched Nakshi Kanthas, and brass-inlaid Chittagong teak jewellery boxes.",
    url: "https://itsnoksha.com",
    siteName: "NOKSHA",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${notoBengali.variable}`}>
      <body className="min-h-screen bg-paper text-ink">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
