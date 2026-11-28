import React, { Suspense } from "react";
import type { Metadata } from "next";
import AdminCommandCentre from "@/components/admin/AdminCommandCentre";

export const metadata: Metadata = {
  title: "Admin Command Centre & CRM | NOKSHA",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-ui min-h-screen bg-a-canvas text-a-text-1 flex items-center justify-center gap-2.5 text-[13px]">
          <span className="h-2 w-2 rounded-full bg-a-accent animate-pulse" />
          Loading Noksha Studio Console…
        </div>
      }
    >
      <AdminCommandCentre />
    </Suspense>
  );
}
