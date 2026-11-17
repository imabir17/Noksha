import type { Metadata } from "next";
import AdminCommandCentre from "@/components/admin/AdminCommandCentre";

export const metadata: Metadata = {
  title: "Admin Command Centre & CRM | NOKSHA",
  robots: { index: false },
};

export default function AdminPage() {
  return <AdminCommandCentre />;
}
