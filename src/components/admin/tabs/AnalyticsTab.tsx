"use client";

import React, { useMemo } from "react";
import { BarChart3, Download } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { DbProduct } from "@/lib/db";
import { downloadCsv } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  Card,
  ColumnDef,
  DataTable,
  EmptyState,
  KpiCard,
  PageHeader,
  SegmentedControl,
} from "../ui";

export default function AnalyticsTab() {
  const { data, metrics, queryParams, setQueryParam } = useAdmin();

  const range = queryParams.get("range") || "30d";

  const sparkVisitors = useMemo(
    () => data.analytics.daily.slice(-10).map((d) => d.visitors),
    [data.analytics.daily]
  );
  const sparkViews = useMemo(
    () => data.analytics.daily.slice(-10).map((d) => d.page_views),
    [data.analytics.daily]
  );

  // Aggregate sales by district from real orders
  const districtStats = useMemo(() => {
    const map = new Map<string, { district: string; orders: number; revenue: number }>();
    for (const o of data.orders) {
      if (o.status === "cancelled") continue;
      const key = o.district || "Unspecified";
      const curr = map.get(key) || { district: key, orders: 0, revenue: 0 };
      curr.orders += 1;
      curr.revenue += o.totalBDT;
      map.set(key, curr);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data.orders]);

  const productCols: ColumnDef<DbProduct>[] = [
    {
      key: "piece",
      header: "Piece",
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={p.image}
            alt={p.name}
            className="w-9 h-11 rounded-[6px] object-cover border border-a-border shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium text-a-text-1 truncate">{p.name}</p>
            <p className="font-num text-[12px] text-a-text-3">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "views",
      header: "Views",
      align: "right",
      numeric: true,
      sortValue: (p) => p.viewsCount,
      render: (p) => <span className="font-num">{p.viewsCount}</span>,
    },
    {
      key: "bag",
      header: "Added to Bag",
      align: "right",
      numeric: true,
      sortValue: (p) => p.addToBagCount,
      render: (p) => <span className="font-num">{p.addToBagCount}</span>,
    },
    {
      key: "rate",
      header: "View → Bag",
      align: "right",
      numeric: true,
      sortValue: (p) => (p.viewsCount > 0 ? p.addToBagCount / p.viewsCount : 0),
      render: (p) => {
        const pct =
          p.viewsCount > 0 ? ((p.addToBagCount / p.viewsCount) * 100).toFixed(1) : "0.0";
        return <span className="font-num text-a-text-2">{pct}%</span>;
      },
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      numeric: true,
      sortValue: (p) => p.ordersCount,
      render: (p) => <span className="font-num font-medium text-a-success">{p.ordersCount}</span>,
    },
    {
      key: "revenue",
      header: "Est. Revenue",
      align: "right",
      numeric: true,
      sortValue: (p) => p.ordersCount * p.priceBDT,
      render: (p) => (
        <span className="font-num font-semibold text-a-text-1">
          {formatBDT(p.ordersCount * p.priceBDT)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Funnel"
        description="Track storefront conversion step-by-step, top pieces by collector interest, and regional demand across Bangladesh."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() =>
              downloadCsv(
                "noksha-product-analytics.csv",
                ["SKU", "Name", "Category", "Price BDT", "Stock", "Views", "Added to Bag", "Orders", "Revenue BDT"],
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
          >
            Export CSV
          </Button>
        }
        toolbar={
          <SegmentedControl
            value={range}
            onChange={(val) => setQueryParam("range", val === "30d" ? null : val)}
            options={[
              { id: "today", label: "Today" },
              { id: "7d", label: "7d" },
              { id: "30d", label: "30d" },
              { id: "90d", label: "90d" },
              { id: "all", label: "All time" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Unique visitors"
          value={String(data.analytics.totalVisitors)}
          sparkline={sparkVisitors}
          sub="Persistent visitor sessions"
        />
        <KpiCard
          label="Total sessions"
          value={String(data.analytics.totalSessions)}
          sub={`Avg. duration ${data.analytics.avgDurationSec}s`}
        />
        <KpiCard
          label="Page & piece views"
          value={String(data.analytics.totalPageViews)}
          sparkline={sparkViews}
          sub="Storefront & Drop pages"
        />
        <KpiCard
          label="Session conversion"
          value={`${metrics.convRate}%`}
          sub={`${metrics.validOrdersCount} completed orders`}
          highlight
        />
      </div>

      {/* Horizontal Step-by-Step Conversion Funnel */}
      <Card
        title="Conversion funnel"
        description="Sessions reaching each step, step-to-step conversion rate, and exit volume."
      >
        {data.analytics.funnel.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-5 h-5" />}
            title="No funnel events recorded yet"
            description="Visitor steps appear automatically as shoppers browse pieces and checkout."
          />
        ) : (
          <div className="space-y-4">
            {data.analytics.funnel.map((step, idx) => (
              <div key={step.key} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-num text-[12px] text-a-text-3 w-5">
                      0{idx + 1}
                    </span>
                    <span className="font-medium text-a-text-1">{step.label}</span>
                    {idx > 0 && (
                      <Badge tone="success">
                        <span className="font-num">{step.stepConversionPct}%</span> step conv.
                      </Badge>
                    )}
                  </div>
                  <div className="font-num text-[12px] text-a-text-2 flex items-center gap-3">
                    <span>
                      <strong className="text-a-text-1">{step.sessions}</strong> sessions (
                      {step.pctOfTotal}%)
                    </span>
                    <span className="text-a-danger">{step.exitsHere} exits</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-a-subtle border border-a-border overflow-hidden">
                  <div
                    className="h-full bg-a-accent rounded-full"
                    style={{ width: `${Math.max(3, step.pctOfTotal)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sales by District + Channels & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card
          title="Sales by district"
          description="Order volume and gross revenue ranked by delivery district."
          className="lg:col-span-5"
        >
          {districtStats.length === 0 ? (
            <p className="text-[13px] text-a-text-3 py-6 text-center">
              No district order data yet.
            </p>
          ) : (
            <div className="divide-y divide-a-border">
              {districtStats.slice(0, 8).map((d) => (
                <div key={d.district} className="py-2.5 flex items-center justify-between text-[13px]">
                  <div>
                    <span className="font-medium text-a-text-1">{d.district}</span>
                    <span className="font-num text-[12px] text-a-text-3 ml-2">
                      {d.orders} {d.orders === 1 ? "order" : "orders"}
                    </span>
                  </div>
                  <span className="font-num font-semibold text-a-text-1">
                    {formatBDT(d.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Referrers, devices & top pages"
          description="Where collectors discover Noksha and which pages they visit most."
          className="lg:col-span-7"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-a-border">
            <div>
              <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium mb-2">
                Top referrers
              </p>
              <div className="space-y-1.5 text-[13px]">
                {data.analytics.referrers.map((r) => (
                  <div key={r.referrer} className="flex items-center justify-between">
                    <span className="text-a-text-1 truncate">{r.referrer}</span>
                    <span className="font-num text-a-text-2">{r.sessions}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium mb-2">
                Devices
              </p>
              <div className="space-y-1.5 text-[13px]">
                {data.analytics.devices.map((d) => (
                  <div key={d.device} className="flex items-center justify-between">
                    <span className="capitalize text-a-text-1">{d.device}</span>
                    <span className="font-num text-a-text-2">{d.sessions} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-1.5">
            <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium mb-2">
              Most visited paths
            </p>
            {data.analytics.topPages.slice(0, 5).map((pg) => (
              <div
                key={pg.path}
                className="py-1.5 flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="font-mono text-[12px] text-a-text-1 truncate">{pg.path}</span>
                <span className="font-num text-[12px] text-a-text-2 shrink-0">
                  {pg.views} views · {pg.exitRate}% exit
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Product Conversion Matrix */}
      <div className="space-y-3">
        <h2 className="a-title">Top products &amp; collector interest</h2>
        <DataTable
          columns={productCols}
          rows={[...data.products].sort((a, b) => b.viewsCount - a.viewsCount)}
          getRowId={(p) => p.id}
        />
      </div>
    </div>
  );
}
