"use client";

import React from "react";
import { Download } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { downloadCsv } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { LegacyKpiCard, legacyCardCls, legacyThCls } from "./_legacyShared";

export default function AnalyticsTab() {
  const { data } = useAdmin();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LegacyKpiCard
          label="Unique Visitors"
          value={String(data.analytics.totalVisitors)}
          sub="Tracked via persistent visitor ID"
        />
        <LegacyKpiCard
          label="Total Sessions"
          value={String(data.analytics.totalSessions)}
          sub="Across desktop & mobile"
        />
        <LegacyKpiCard
          label="Total Page & Piece Views"
          value={String(data.analytics.totalPageViews)}
          sub={`Avg. Time on Page: ${data.analytics.avgDurationSec}s`}
        />
        <LegacyKpiCard
          label="Top Exit Step"
          value={
            [...data.analytics.funnel].sort((a, b) => b.exitsHere - a.exitsHere)[0]?.key ??
            "product_detail"
          }
          sub="Highest single drop-off stage"
        />
      </div>

      <div className={`${legacyCardCls} overflow-hidden`}>
        <div className="p-5 border-b border-a-border bg-a-subtle">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-a-text-1">
            Full Customer Journey Funnel &amp; Step-by-Step Exit Analysis
          </h2>
          <p className="text-[13px] text-a-text-2 mt-0.5">
            Tracks how many sessions reach each step, step-to-step conversion, and from which step customers exit the site.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr>
                <th className={legacyThCls}>Funnel Stage</th>
                <th className={legacyThCls}>Sessions Reached</th>
                <th className={legacyThCls}>% of Total Traffic</th>
                <th className={legacyThCls}>Step Conversion</th>
                <th className={legacyThCls}>Step Drop-off %</th>
                <th className={`${legacyThCls} text-right`}>Exited Site at This Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {data.analytics.funnel.map((f) => (
                <tr key={f.key} className="admin-row-hover">
                  <td className="py-3.5 px-4 font-medium text-a-text-1">{f.label}</td>
                  <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">{f.sessions}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-28 h-2.5 bg-a-subtle rounded-full overflow-hidden border border-a-border">
                        <div
                          className="h-full bg-a-accent"
                          style={{ width: `${Math.max(4, f.pctOfTotal)}%` }}
                        />
                      </div>
                      <span className="font-num font-medium text-a-text-1">{f.pctOfTotal}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-num text-a-success font-medium">
                    {f.stepConversionPct}%
                  </td>
                  <td className="py-3.5 px-4 font-num text-a-danger font-medium">
                    {f.dropOffPct}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-num font-medium text-a-danger">
                    {f.exitsHere} exits
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-6 ${legacyCardCls} overflow-hidden`}>
          <div className="p-4 border-b border-a-border bg-a-subtle">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1">
              Most Visited Pages &amp; Page Exit Rates
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr>
                  <th className={legacyThCls}>Page Path</th>
                  <th className={legacyThCls}>Views</th>
                  <th className={legacyThCls}>Visitors</th>
                  <th className={legacyThCls}>Avg Time</th>
                  <th className={`${legacyThCls} text-right`}>Exit Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-a-border">
                {data.analytics.topPages.map((pg) => (
                  <tr key={pg.path} className="admin-row-hover">
                    <td className="py-3 px-4 font-mono font-medium text-a-text-1">{pg.path}</td>
                    <td className="py-3 px-4 font-num font-medium text-a-text-1">{pg.views}</td>
                    <td className="py-3 px-4 font-num text-a-text-2">{pg.uniqueVisitors}</td>
                    <td className="py-3 px-4 font-num text-a-text-2">{pg.avgDurationSec}s</td>
                    <td className="py-3 px-4 text-right font-num text-a-danger font-medium">
                      {pg.exitRate}% ({pg.exits})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className={`${legacyCardCls} p-5 space-y-4`}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1 border-b border-a-border pb-2.5">
              Acquisition Channels &amp; Devices
            </h2>
            <div className="grid grid-cols-2 gap-6 text-[13px]">
              <div>
                <p className="text-a-text-3 uppercase text-[12px] font-medium mb-2">
                  Traffic Referrers
                </p>
                <div className="space-y-2">
                  {data.analytics.referrers.map((r) => (
                    <div
                      key={r.referrer}
                      className="flex justify-between border-b border-a-border pb-1.5"
                    >
                      <span className="text-a-text-1 font-medium">{r.referrer}</span>
                      <span className="font-num text-a-text-2 font-medium">
                        {r.sessions} sessions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-a-text-3 uppercase text-[12px] font-medium mb-2">
                  Device Breakdown
                </p>
                <div className="space-y-2">
                  {data.analytics.devices.map((d) => (
                    <div
                      key={d.device}
                      className="flex justify-between border-b border-a-border pb-1.5"
                    >
                      <span className="text-a-text-1 uppercase font-medium">{d.device}</span>
                      <span className="font-num text-a-text-2 font-medium">
                        {d.sessions} sessions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`${legacyCardCls} overflow-hidden`}>
            <div className="p-4 border-b border-a-border bg-a-subtle">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1">
                Daily Traffic &amp; Page Views Trend
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={legacyThCls}>Date</th>
                    <th className={legacyThCls}>Unique Visitors</th>
                    <th className={legacyThCls}>Sessions</th>
                    <th className={`${legacyThCls} text-right`}>Page Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-a-border">
                  {data.analytics.daily.map((d) => (
                    <tr key={d.day} className="admin-row-hover">
                      <td className="py-2.5 px-4 font-num font-medium text-a-text-1">{d.day}</td>
                      <td className="py-2.5 px-4 font-num text-a-text-1">{d.visitors}</td>
                      <td className="py-2.5 px-4 font-num text-a-text-2">{d.sessions}</td>
                      <td className="py-2.5 px-4 font-num text-right text-a-text-1">
                        {d.page_views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className={`${legacyCardCls} overflow-hidden`}>
        <div className="p-5 border-b border-a-border bg-a-subtle flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-a-text-1">
              Product Conversion &amp; Interest Matrix
            </h2>
            <p className="text-[13px] text-a-text-2">
              Ranked by views, bag additions, view-to-bag rate, orders, and revenue generated.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "noksha-product-analytics.csv",
                [
                  "SKU",
                  "Name",
                  "Category",
                  "Price BDT",
                  "Stock",
                  "Views",
                  "Added to Bag",
                  "Orders",
                  "Revenue BDT",
                ],
                data.products.map((p) => [
                  p.sku,
                  p.name,
                  p.category,
                  p.priceBDT,
                  p.stockQty,
                  p.viewsCount,
                  p.addToBagCount,
                  p.ordersCount,
                  p.ordersCount * p.priceBDT,
                ])
              )
            }
            className="admin-press px-3.5 py-2 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr>
                <th className={legacyThCls}>Piece</th>
                <th className={legacyThCls}>Category</th>
                <th className={legacyThCls}>Price</th>
                <th className={legacyThCls}>Page Views</th>
                <th className={legacyThCls}>Added to Bag</th>
                <th className={legacyThCls}>View → Bag %</th>
                <th className={legacyThCls}>Orders</th>
                <th className={`${legacyThCls} text-right`}>Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {[...data.products]
                .sort((a, b) => b.viewsCount - a.viewsCount)
                .map((p) => {
                  const bagRate =
                    p.viewsCount > 0
                      ? ((p.addToBagCount / p.viewsCount) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr key={p.id} className="admin-row-hover">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-a-text-1">{p.name}</p>
                        <p className="font-mono text-[12px] text-a-text-3">{p.sku}</p>
                      </td>
                      <td className="py-3.5 px-4 text-a-text-2">{p.category}</td>
                      <td className="py-3.5 px-4 font-num font-medium text-a-text-1">
                        {formatBDT(p.priceBDT)}
                      </td>
                      <td className="py-3.5 px-4 font-num text-a-text-1">{p.viewsCount}</td>
                      <td className="py-3.5 px-4 font-num text-a-text-2">{p.addToBagCount}</td>
                      <td className="py-3.5 px-4 font-num text-a-text-2">{bagRate}%</td>
                      <td className="py-3.5 px-4 font-num font-medium text-a-success">
                        {p.ordersCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-num font-semibold text-a-text-1">
                        {formatBDT(p.ordersCount * p.priceBDT)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
