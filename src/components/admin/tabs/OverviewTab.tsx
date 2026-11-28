"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { useAdmin } from "../hooks/useAdminData";
import { LegacyKpiCard, LegacyStatusBadge, legacyCardCls, legacyThCls } from "./_legacyShared";

export default function OverviewTab() {
  const { data, metrics, setActiveTab } = useAdmin();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LegacyKpiCard
          label="Gross Revenue (BDT)"
          value={formatBDT(metrics.grossRevenue)}
          sub={`Est. Net Profit: ${formatBDT(metrics.estProfit)}`}
        />
        <LegacyKpiCard
          label="Total Orders"
          value={String(metrics.validOrdersCount)}
          sub={`${metrics.pendingOrdersCount} awaiting dispatch · AOV ${formatBDT(metrics.aov)}`}
        />
        <LegacyKpiCard
          label="Visitors & Sessions"
          value={`${data.analytics.totalVisitors} / ${data.analytics.totalSessions}`}
          sub={`${data.analytics.totalPageViews} page views · ${metrics.convRate}% conversion`}
        />
        <LegacyKpiCard
          label="Abandoned Carts at Risk"
          value={formatBDT(metrics.abandonedValue)}
          sub={`${metrics.unrecoveredCarts.length} unrecovered checkouts`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-6 ${legacyCardCls} p-5 space-y-4`}>
          <div className="flex items-center justify-between border-b border-a-border pb-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Inventory &amp; 1-of-1 Drop Alerts (<span className="font-num">{metrics.lowStockProducts.length}</span>)
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className="text-[13px] font-medium text-a-text-1 hover:underline cursor-pointer"
            >
              Manage Catalog →
            </button>
          </div>

          <div className="divide-y divide-a-border text-[13px]">
            {metrics.lowStockProducts.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image}
                    alt=""
                    className="w-11 h-13 rounded object-cover shrink-0 border border-a-border"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-a-text-1 truncate">{p.name}</p>
                    <p className="text-a-text-2 font-normal">
                      {p.sku} ·{" "}
                      {p.collectionId
                        ? `${p.dropNumber || "Drop"} · 1-of-1 Exclusive${
                            p.acquiredBy ? ` (Acquired by ${p.acquiredBy})` : ""
                          }`
                        : "Regular Store Edition"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-num px-2.5 py-1 rounded font-medium text-[12px] ${
                      p.status === "sold"
                        ? "bg-a-danger-bg text-a-danger"
                        : "bg-a-warning-bg text-a-warning"
                    }`}
                  >
                    {p.status === "sold"
                      ? p.collectionId
                        ? p.acquiredBy
                          ? `ACQUIRED · ${p.acquiredBy}`
                          : "ACQUIRED (1 OF 1)"
                        : "SOLD OUT"
                      : `Stock: ${p.stockQty}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-6 ${legacyCardCls} p-5 space-y-4`}>
          <div className="flex items-center justify-between border-b border-a-border pb-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-a-danger" />
              Customer Journey &amp; Exit Drop-Off Snapshot
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className="text-[13px] font-medium text-a-text-1 hover:underline cursor-pointer"
            >
              Full Funnel &amp; Exit Report →
            </button>
          </div>

          <div className="space-y-3 text-[13px]">
            {data.analytics.funnel.map((f) => (
              <div key={f.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-a-text-1 font-medium">{f.label}</span>
                  <span className="font-num text-a-text-2">
                    <strong className="text-a-text-1">{f.sessions}</strong> sessions ({f.pctOfTotal}%) ·{" "}
                    <span className="text-a-danger font-medium">{f.exitsHere} exited here</span>
                  </span>
                </div>
                <div className="h-2.5 bg-a-subtle rounded-full overflow-hidden border border-a-border">
                  <div
                    className="h-full bg-a-accent rounded-full"
                    style={{ width: `${Math.max(4, f.pctOfTotal)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${legacyCardCls} overflow-hidden`}>
        <div className="p-5 border-b border-a-border flex items-center justify-between bg-a-subtle">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1">
            Recent Orders
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className="text-[13px] font-medium text-a-text-1 hover:underline cursor-pointer"
          >
            Open Full Order Pipeline →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr>
                <th className={legacyThCls}>Order ID</th>
                <th className={legacyThCls}>Customer</th>
                <th className={legacyThCls}>District</th>
                <th className={legacyThCls}>Payment</th>
                <th className={legacyThCls}>Total</th>
                <th className={legacyThCls}>Status</th>
                <th className={`${legacyThCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {data.orders.slice(0, 6).map((o) => (
                <tr key={o.id} className="admin-row-hover">
                  <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">{o.id}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-a-text-1">{o.customerName}</p>
                    <p className="font-num text-a-text-2">{o.customerPhone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-a-text-2">{o.district}</td>
                  <td className="py-3.5 px-4 uppercase font-medium text-a-text-1">
                    {o.paymentMethod} ({o.paymentStatus})
                  </td>
                  <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">
                    {formatBDT(o.totalBDT)}
                  </td>
                  <td className="py-3.5 px-4">
                    <LegacyStatusBadge status={o.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders", { order: o.id })}
                      className="admin-press px-3 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium cursor-pointer"
                    >
                      Manage
                    </button>
                    <Link
                      href={`/admin/invoice/${o.id}`}
                      className="admin-press px-3 py-1.5 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border font-medium inline-block"
                    >
                      Invoice
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
