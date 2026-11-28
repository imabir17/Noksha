"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Package,
  ShoppingBag,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminOrder, formatRelativeTime } from "../adminTypes";
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
  StatusBadge,
} from "../ui";

function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning";
  if (hr < 17) return "Good afternoon";
  return "Good evening";
}

function rangeDaysFromKey(key: string): number | null {
  if (key === "today") return 1;
  if (key === "7d") return 7;
  if (key === "30d") return 30;
  if (key === "90d") return 90;
  return null;
}

export default function OverviewTab() {
  const { data, metrics, copyText, setActiveTab, queryParams } = useAdmin();

  const rangeKey = queryParams.get("range") || "30d";
  const firstName = data.user.name.split(" ")[0] || data.user.name;

  // Period-filtered KPIs + delta vs previous window
  const periodStats = useMemo(() => {
    const days = rangeDaysFromKey(rangeKey);
    const now = Date.now();
    const valid = data.orders.filter((o) => o.status !== "cancelled");

    if (!days) {
      return {
        revenue: metrics.grossRevenue,
        ordersCount: metrics.validOrdersCount,
        aov: metrics.aov,
        revDelta: undefined as string | undefined,
        revUp: true,
        ordDelta: undefined as string | undefined,
        ordUp: true,
        aovDelta: undefined as string | undefined,
        aovUp: true,
      };
    }

    const windowMs = days * 86_400_000;
    const curr = valid.filter((o) => now - new Date(o.createdAt).getTime() <= windowMs);
    const prev = valid.filter((o) => {
      const age = now - new Date(o.createdAt).getTime();
      return age > windowMs && age <= windowMs * 2;
    });

    const currRev = curr.reduce((s, o) => s + o.totalBDT, 0);
    const prevRev = prev.reduce((s, o) => s + o.totalBDT, 0);
    const currAov = curr.length ? Math.round(currRev / curr.length) : 0;
    const prevAov = prev.length ? Math.round(prevRev / prev.length) : 0;

    const pct = (c: number, p: number) => {
      if (p === 0) return c > 0 ? "100%" : undefined;
      const diff = Math.round(((c - p) / p) * 100);
      return `${Math.abs(diff)}%`;
    };

    // Fallback to all-time totals if demo orders are outside window so cards never look blank
    const useCurr = curr.length > 0 || prev.length > 0;

    return {
      revenue: useCurr ? currRev : metrics.grossRevenue,
      ordersCount: useCurr ? curr.length : metrics.validOrdersCount,
      aov: useCurr ? currAov : metrics.aov,
      revDelta: pct(currRev, prevRev),
      revUp: currRev >= prevRev,
      ordDelta: pct(curr.length, prev.length),
      ordUp: curr.length >= prev.length,
      aovDelta: pct(currAov, prevAov),
      aovUp: currAov >= prevAov,
    };
  }, [data.orders, metrics.aov, metrics.grossRevenue, metrics.validOrdersCount, rangeKey]);

  // 14-point daily revenue series for sparklines and 30-day area chart
  const dailySeries = useMemo(() => {
    const buckets: { label: string; iso: string; revenue: number; orders: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        iso: key,
        revenue: 0,
        orders: 0,
      });
    }

    const map = new Map(buckets.map((b) => [b.iso, b]));
    for (const o of data.orders) {
      if (o.status === "cancelled") continue;
      const key = (o.createdAt || "").slice(0, 10);
      const b = map.get(key);
      if (b) {
        b.revenue += o.totalBDT;
        b.orders += 1;
      }
    }
    return buckets;
  }, [data.orders]);

  const revSpark = useMemo(() => dailySeries.slice(-10).map((d) => d.revenue), [dailySeries]);
  const ordSpark = useMemo(() => dailySeries.slice(-10).map((d) => d.orders), [dailySeries]);

  // Attention items
  const attentionItems = useMemo(() => {
    const list: {
      id: string;
      icon: React.ReactNode;
      tone: "warning" | "danger" | "info";
      title: string;
      sub: string;
      cta: string;
      onClick: () => void;
    }[] = [];

    const newOrders = data.orders.filter((o) => o.status === "new");
    if (newOrders.length > 0) {
      list.push({
        id: "new-orders",
        icon: <ShoppingBag className="w-4 h-4 text-a-info" />,
        tone: "info",
        title: `${newOrders.length} new ${newOrders.length === 1 ? "order" : "orders"} awaiting confirmation`,
        sub: "Verify customer details and move to Confirmed.",
        cta: "Review new orders",
        onClick: () => setActiveTab("orders", { status: "new" }),
      });
    }

    const cancelReqs = data.orders.filter((o) => o.cancellationRequested);
    if (cancelReqs.length > 0) {
      list.push({
        id: "cancels",
        icon: <XCircle className="w-4 h-4 text-a-danger" />,
        tone: "danger",
        title: `${cancelReqs.length} pending cancellation ${cancelReqs.length === 1 ? "request" : "requests"}`,
        sub: "Pre-shipment customer request awaiting studio approval.",
        cta: "Resolve requests",
        onClick: () => setActiveTab("cancellations"),
      });
    }

    const staleUnverified = data.orders.filter(
      (o) =>
        o.status !== "cancelled" &&
        o.paymentStatus === "pending" &&
        Date.now() - new Date(o.createdAt).getTime() > 3_600_000
    );
    if (staleUnverified.length > 0) {
      list.push({
        id: "unverified-pay",
        icon: <Clock className="w-4 h-4 text-a-warning" />,
        tone: "warning",
        title: `${staleUnverified.length} unverified ${staleUnverified.length === 1 ? "payment" : "payments"} older than 1 hour`,
        sub: "Check UddoktaPay or COD status before packing.",
        cta: "Filter pending payments",
        onClick: () => setActiveTab("orders", { payment: "pending" }),
      });
    }

    if (metrics.lowStockProducts.length > 0) {
      list.push({
        id: "low-stock",
        icon: <Package className="w-4 h-4 text-a-warning" />,
        tone: "warning",
        title: `${metrics.lowStockProducts.length} catalog ${metrics.lowStockProducts.length === 1 ? "piece" : "pieces"} low or acquired`,
        sub: "Restock multi-edition pieces or update Drop archive.",
        cta: "Open inventory",
        onClick: () => setActiveTab("products"),
      });
    }

    if (metrics.unrecoveredCarts.length > 0) {
      list.push({
        id: "abandoned",
        icon: <TrendingDown className="w-4 h-4 text-a-warning" />,
        tone: "warning",
        title: `${metrics.unrecoveredCarts.length} abandoned ${metrics.unrecoveredCarts.length === 1 ? "bag" : "bags"} (${formatBDT(metrics.abandonedValue)})`,
        sub: "Send a polite WhatsApp follow-up to assist collectors.",
        cta: "Recover carts",
        onClick: () => setActiveTab("abandoned"),
      });
    }

    return list;
  }, [data.orders, metrics.abandonedValue, metrics.lowStockProducts.length, metrics.unrecoveredCarts.length, setActiveTab]);

  const copyDigest = () => {
    const summary = [
      `NOKSHA — Studio Digest (${new Date().toLocaleDateString("en-GB")})`,
      `• Gross Revenue: ${formatBDT(metrics.grossRevenue)} (Est. Profit: ${formatBDT(metrics.estProfit)})`,
      `• Orders: ${metrics.validOrdersCount} (${metrics.pendingOrdersCount} awaiting dispatch)`,
      `• AOV: ${formatBDT(metrics.aov)}`,
      `• Conversion: ${metrics.convRate}%`,
    ].join("\n");
    copyText(summary, "Copied studio digest");
  };

  // Inline SVG 30-day area chart coordinates
  const chartW = 640;
  const chartH = 180;
  const maxRev = Math.max(...dailySeries.map((d) => d.revenue), 1000);
  const chartPoints = dailySeries.map((d, idx) => {
    const x = (idx / (dailySeries.length - 1)) * chartW;
    const y = chartH - (d.revenue / maxRev) * (chartH - 28) - 14;
    return { x, y, ...d };
  });
  const linePath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${chartW},${chartH} L0,${chartH} Z`;

  const recentColumns: ColumnDef<AdminOrder>[] = [
    {
      key: "id",
      header: "Order",
      render: (o) => (
        <div>
          <span className="font-num font-semibold text-a-text-1">{o.id}</span>
          <p className="font-num text-[12px] text-a-text-3">{formatRelativeTime(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div>
          <p className="font-medium text-a-text-1">{o.customerName}</p>
          <p className="font-num text-[12px] text-a-text-3">{o.district}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Stage",
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      numeric: true,
      render: (o) => (
        <span className="font-num font-semibold text-a-text-1">{formatBDT(o.totalBDT)}</span>
      ),
    },
  ];

  const waitingToPack = data.orders.filter(
    (o) => o.status === "new" || o.status === "confirmed"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description={
          waitingToPack > 0 ? (
            <span>
              <strong className="font-num text-a-text-1">{waitingToPack}</strong>{" "}
              {waitingToPack === 1 ? "order is" : "orders are"} waiting to be confirmed or packed today.
            </span>
          ) : (
            "All active studio orders are packed or in transit."
          )
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<Copy className="w-4 h-4 text-a-accent" />}
            onClick={copyDigest}
          >
            Copy digest
          </Button>
        }
      />

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue"
          value={formatBDT(periodStats.revenue)}
          delta={periodStats.revDelta}
          deltaPositive={periodStats.revUp}
          sparkline={revSpark}
          sub={`Est. net profit ${formatBDT(metrics.estProfit)}`}
          highlight
        />
        <KpiCard
          label="Orders"
          value={String(periodStats.ordersCount)}
          delta={periodStats.ordDelta}
          deltaPositive={periodStats.ordUp}
          sparkline={ordSpark}
          sub={`${metrics.convRate}% session conversion`}
          onClick={() => setActiveTab("orders")}
        />
        <KpiCard
          label="Avg. order value"
          value={formatBDT(periodStats.aov)}
          delta={periodStats.aovDelta}
          deltaPositive={periodStats.aovUp}
          sub="Across verified & COD orders"
        />
        <KpiCard
          label="Pending dispatch"
          value={String(metrics.pendingOrdersCount)}
          sub="Click to open new & confirmed queue"
          onClick={() => setActiveTab("orders", { status: "new" })}
        />
      </div>

      {/* Row 2: Needs Attention */}
      <Card
        title="Needs attention"
        description="Actionable items requiring studio review right now."
        actions={
          attentionItems.length > 0 ? (
            <Badge tone="warning">
              <span className="font-num">{attentionItems.length}</span> active
            </Badge>
          ) : (
            <Badge tone="success">All clear</Badge>
          )
        }
        padded={false}
      >
        {attentionItems.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-5 h-5 text-a-success" />}
            title="Everything is caught up"
            description="No unconfirmed orders, pending cancellations, or urgent stock alerts."
          />
        ) : (
          <div className="divide-y divide-a-border">
            {attentionItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left admin-row-hover cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-a-subtle border border-a-border flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-num text-[14px] font-medium text-a-text-1">{item.title}</p>
                    <p className="text-[12px] text-a-text-3 truncate">{item.sub}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-a-text-2 shrink-0">
                  <span className="hidden sm:inline">{item.cta}</span>
                  <ArrowRight className="w-4 h-4 text-a-accent" />
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Row 3: 30-Day Revenue Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card
          title="Revenue (last 30 days)"
          description="Daily gross order value in BDT across your storefront and Drops."
          className="lg:col-span-6"
        >
          <div className="space-y-3">
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-44 overflow-visible"
                role="img"
                aria-label="30-day revenue area chart"
              >
                <defs>
                  <linearGradient id="nokshaRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--a-accent)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--a-accent)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#nokshaRevFill)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--a-accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center justify-between text-[12px] text-a-text-3 font-num pt-1 border-t border-a-border">
              <span>{dailySeries[0]?.label}</span>
              <span>Peak day: {formatBDT(Math.max(...dailySeries.map((d) => d.revenue), 0))}</span>
              <span>{dailySeries[dailySeries.length - 1]?.label}</span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="a-title">Recent orders</h2>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-a-text-2 hover:text-a-text-1 cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <DataTable
            columns={recentColumns}
            rows={data.orders.slice(0, 6)}
            getRowId={(o) => o.id}
            onRowClick={(o) => setActiveTab("orders", { order: o.id })}
            emptyState={
              <EmptyState
                icon={<AlertTriangle className="w-5 h-5" />}
                title="No orders recorded yet"
                description="Orders placed on the storefront appear here immediately."
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
