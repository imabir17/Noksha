"use client";

import React from "react";
import Link from "next/link";

export default function PrintInvoiceControls({ orderId }: { orderId: string }) {
  return (
    <div className="mb-6 flex items-center justify-between print:hidden">
      <Link
        href="/admin"
        className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline"
      >
        ← Back to Admin Command Centre
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider rounded cursor-pointer hover:bg-neutral-700"
      >
        Print Invoice / Save PDF ({orderId})
      </button>
    </div>
  );
}
