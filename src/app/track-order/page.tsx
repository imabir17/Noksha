import type { Metadata } from "next";
import TrackOrderView from "@/components/TrackOrderView";

export const metadata: Metadata = {
  title: "Track & Manage Order | NOKSHA — নকশা",
  description:
    "Track your Noksha order status, download your order details as PDF, or request cancellation before shipment.",
};

export default function TrackOrderPage() {
  return <TrackOrderView />;
}
