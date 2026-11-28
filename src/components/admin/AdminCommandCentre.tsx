"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Copy,
  ExternalLink,
  FileText,
  Layers,
  LogOut,
  Package,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  Users,
  XCircle,
} from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminOrder, AdminTab, canAccessSection } from "./adminTypes";
import {
  AdminContext,
  PostActionOptions,
  ToastAction,
  ToastItem,
  useAdminDataLoader,
} from "./hooks/useAdminData";
import { useAdminTab } from "./hooks/useAdminTab";
import OrderSlipModal from "./print/OrderSlipModal";
import OverviewTab from "./tabs/OverviewTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import OrdersTab from "./tabs/OrdersTab";
import CancellationsTab from "./tabs/CancellationsTab";
import CollectionsTab from "./tabs/CollectionsTab";
import ProductsTab from "./tabs/ProductsTab";
import CustomersTab from "./tabs/CustomersTab";
import AbandonedTab from "./tabs/AbandonedTab";
import LeadsTab from "./tabs/LeadsTab";
import PromosTab from "./tabs/PromosTab";
import ContentTab from "./tabs/ContentTab";
import StaffTab from "./tabs/StaffTab";
import AuditTab from "./tabs/AuditTab";

export default function AdminCommandCentre() {
  const {
    data,
    metrics,
    loading,
    refreshing,
    error,
    authError,
    lastSyncedAt,
    refresh,
    login,
    logout,
  } = useAdminDataLoader();

  const { activeTab, setActiveTab, queryParams, setQueryParam } = useAdminTab(data?.user.role);

  const [email, setEmail] = useState("owner@noksha.bd");
  const [password, setPassword] = useState("NokshaOwner2026!");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [printingSlipOrders, setPrintingSlipOrders] = useState<AdminOrder[]>([]);
  const [triggerNewCounter] = useState(0);

  const notify = useCallback(
    (
      message: string,
      opts?: { variant?: "success" | "error" | "info"; action?: ToastAction }
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: ToastItem = {
        id,
        message,
        variant: opts?.variant || "success",
        action: opts?.action,
      };
      setToasts((prev) => [...prev.slice(-2), item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, opts?.action ? 5500 : 3400);
    },
    []
  );

  const copyText = useCallback(
    (value: string, label = "Copied to clipboard") => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(value);
        notify(label, { variant: "info" });
      }
    },
    [notify]
  );

  const postAction = useCallback(
    async (
      body: Record<string, unknown>,
      successMsg: string,
      opts?: PostActionOptions
    ): Promise<boolean> => {
      try {
        const res = await fetch("/api/admin/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const out = await res.json();
        if (!res.ok) {
          notify(out.error || "Action failed", { variant: "error" });
          return false;
        }
        if (!opts?.silent) {
          notify(successMsg, { variant: "success", action: opts?.undoAction });
        }
        await refresh();
        return true;
      } catch {
        notify("Network error while saving changes", { variant: "error" });
        return false;
      }
    },
    [notify, refresh]
  );

  const openPrintSlip = useCallback((order: AdminOrder) => {
    setPrintingSlipOrders([order]);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.print();
      }
    }, 120);
  }, []);

  const openMultiplePrintSlips = useCallback((orders: AdminOrder[]) => {
    if (!orders.length) return;
    setPrintingSlipOrders(orders);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.print();
      }
    }, 150);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  if (loading && !data) {
    return (
      <div className="admin-ui min-h-screen bg-a-canvas text-a-text-1 flex items-center justify-center gap-2.5 text-[14px]">
        <span className="h-2 w-2 rounded-full bg-a-accent animate-pulse" />
        Loading Noksha Studio Console…
      </div>
    );
  }

  if (!data || !metrics) {
    return (
      <div className="admin-ui min-h-screen bg-a-canvas text-a-text-1 flex items-center justify-center p-5">
        <div className="admin-surface-enter w-full max-w-[400px] bg-a-surface border border-a-border rounded-2xl p-8 shadow-[var(--a-shadow-pop)]">
          <div className="flex flex-col items-center text-center border-b border-a-border pb-6">
            <img
              src="/brand/noksha-logo.png"
              alt="Noksha — Handcrafted in Bangladesh"
              className="h-12 w-auto object-contain"
            />
            <p className="text-[12px] uppercase tracking-[0.18em] text-a-accent-text font-medium mt-4">
              Studio Console &amp; CRM
            </p>
            <h1 className="font-display text-3xl font-normal text-a-text-1 mt-1">
              Staff Sign In
            </h1>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block mb-1.5">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-a-subtle border border-a-border rounded-lg text-[13px] text-a-text-1 focus:outline-none focus:border-a-accent"
              />
            </div>
            <div>
              <label className="block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-a-subtle border border-a-border rounded-lg text-[13px] text-a-text-1 focus:outline-none focus:border-a-accent"
              />
            </div>

            {authError && (
              <p className="text-[13px] font-medium text-a-danger bg-a-danger-bg border border-a-border rounded-lg px-3 py-2">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="admin-press w-full py-2.5 bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium text-[13px] rounded-lg cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-a-border">
            <p className="text-[12px] font-medium text-a-text-3 mb-2.5">
              Quick-fill staff account
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-a-sidebar">
              <button
                type="button"
                onClick={() => {
                  setEmail("owner@noksha.bd");
                  setPassword("NokshaOwner2026!");
                }}
                className="admin-press px-2 py-1.5 rounded-lg bg-a-surface text-a-text-1 text-[12px] font-medium cursor-pointer"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("manager@noksha.bd");
                  setPassword("NokshaManager2026!");
                }}
                className="admin-press px-2 py-1.5 rounded-lg bg-a-surface text-a-text-1 text-[12px] font-medium cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("support@noksha.bd");
                  setPassword("NokshaSupport2026!");
                }}
                className="admin-press px-2 py-1.5 rounded-lg bg-a-surface text-a-text-1 text-[12px] font-medium cursor-pointer"
              >
                Support
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[13px] font-normal text-a-text-2 hover:text-a-text-1 transition-colors"
            >
              ← Return to storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const copyDailyDigest = () => {
    const topPiece = [...data.products].sort((a, b) => b.viewsCount - a.viewsCount)[0];
    const summary = [
      `NOKSHA — Studio Digest (${new Date().toLocaleDateString("en-GB")})`,
      `• Gross Revenue: ${formatBDT(metrics.grossRevenue)} (Est. Profit: ${formatBDT(metrics.estProfit)})`,
      `• Active Orders: ${metrics.validOrdersCount} (${metrics.pendingOrdersCount} awaiting dispatch)`,
      `• Visitors / Sessions: ${data.analytics.totalVisitors} / ${data.analytics.totalSessions} (${metrics.convRate}% conv.)`,
      `• Most Viewed Piece: ${topPiece?.name ?? "N/A"} (${topPiece?.viewsCount ?? 0} views)`,
      `• Unrecovered Carts: ${metrics.unrecoveredCarts.length} (${formatBDT(metrics.abandonedValue)} at risk)`,
    ].join("\n");
    copyText(summary, "Daily digest copied to clipboard");
  };

  const navGroups: {
    group: string;
    items: {
      id: AdminTab;
      label: string;
      icon: React.ReactNode;
      badge?: number;
      alertBadge?: boolean;
    }[];
  }[] = [
    {
      group: "Overview",
      items: [
        { id: "overview", label: "Command Overview", icon: <Activity className="w-4 h-4 shrink-0" strokeWidth={1.75} /> },
        { id: "analytics", label: "Analytics & Funnel", icon: <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.75} /> },
      ],
    },
    {
      group: "Commerce",
      items: [
        {
          id: "orders",
          label: "Orders Pipeline",
          icon: <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: metrics.pendingOrdersCount,
        },
        {
          id: "cancellations",
          label: "Cancellation Requests",
          icon: <XCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.orders.filter((o) => o.cancellationRequested).length,
          alertBadge: true,
        },
        {
          id: "collections",
          label: "Drops & Categories",
          icon: <Layers className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.collections.length,
        },
        {
          id: "products",
          label: "Products & Inventory",
          icon: <Package className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: metrics.lowStockProducts.length,
        },
      ],
    },
    {
      group: "Customers",
      items: [
        { id: "customers", label: "Customers CRM", icon: <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} />, badge: data.customers.length },
        {
          id: "abandoned",
          label: "Abandoned Carts",
          icon: <TrendingDown className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: metrics.unrecoveredCarts.length,
        },
        {
          id: "leads",
          label: "Waitlist & Leads",
          icon: <Sparkles className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.leads.filter((l) => l.status === "new").length,
        },
        { id: "promos", label: "Promo Codes", icon: <Tag className="w-4 h-4 shrink-0" strokeWidth={1.75} /> },
      ],
    },
    {
      group: "Workspace",
      items: [
        { id: "content", label: "Site Content CMS", icon: <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} /> },
        { id: "staff", label: "Staff & Roles", icon: <Shield className="w-4 h-4 shrink-0" strokeWidth={1.75} /> },
        { id: "audit", label: "Activity Audit Log", icon: <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} /> },
      ],
    },
  ];

  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((tab) => canAccessSection(data.user.role, tab.id)),
    }))
    .filter((g) => g.items.length > 0);
  const navItems = visibleGroups.flatMap((g) => g.items);

  return (
    <AdminContext.Provider
      value={{
        data,
        metrics,
        loading,
        refreshing,
        error,
        lastSyncedAt,
        refresh,
        postAction,
        notify,
        copyText,
        openPrintSlip,
        openMultiplePrintSlips,
        activeTab,
        setActiveTab,
        queryParams,
        setQueryParam,
        triggerNewCounter,
      }}
    >
      <OrderSlipModal
        orders={printingSlipOrders}
        onClose={() => setPrintingSlipOrders([])}
      />

      <div
        className={`admin-ui min-h-screen lg:h-screen lg:overflow-hidden bg-a-canvas text-a-text-1 flex flex-col lg:flex-row ${
          printingSlipOrders.length > 0 ? "print:hidden" : ""
        }`}
      >
        {/* Left Studio Sidebar — Fixed / Non-Scrolling on Desktop, Regular Weight */}
        <aside className="w-full lg:w-[248px] lg:h-screen lg:overflow-hidden bg-a-sidebar border-b lg:border-b-0 lg:border-r border-a-border shrink-0 flex flex-col justify-between select-none">
          <div>
            <div className="px-4 h-14 border-b border-a-border flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/brand/noksha-logo.png"
                  alt="NOKSHA"
                  className="h-7 w-auto object-contain"
                />
              </Link>
              <Link
                href="/"
                target="_blank"
                aria-label="Open Live Storefront"
                className="admin-press p-1.5 rounded-lg text-a-text-3 hover:text-a-text-1 hover:bg-a-subtle"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            </div>

            <nav className="p-2.5 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible">
              {visibleGroups.map((group) => (
                <div key={group.group} className="flex lg:flex-col gap-0.5 shrink-0">
                  <p className="hidden lg:block px-2.5 pb-1 text-[12px] font-normal uppercase tracking-[0.04em] text-a-text-3">
                    {group.group}
                  </p>
                  {group.items.map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`admin-press relative flex items-center justify-between gap-2 px-2.5 h-[34px] rounded-lg text-[14px] font-normal whitespace-nowrap cursor-pointer ${
                          active
                            ? "bg-a-surface text-a-text-1 shadow-[var(--a-shadow-card)] ring-1 ring-a-border"
                            : "text-a-text-2 hover:text-a-text-1 hover:bg-a-subtle"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span className={active ? "text-a-accent" : "text-a-text-3"}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`font-num px-2 py-[1px] rounded-full text-[12px] font-normal shrink-0 ${
                              item.alertBadge
                                ? "bg-a-danger-bg text-a-danger"
                                : active
                                ? "bg-a-sidebar text-a-text-1"
                                : "bg-a-subtle text-a-text-3"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          <div className="p-3 border-t border-a-border hidden lg:block space-y-2.5">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-a-ink-btn text-a-on-ink flex items-center justify-center text-[12px] font-normal shrink-0">
                {data.user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-normal text-a-text-1 truncate">{data.user.name}</p>
                <p className="text-[12px] text-a-text-3 font-normal truncate capitalize">
                  {data.user.role}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={refresh}
                className="admin-press flex-1 py-1.5 px-2.5 rounded-lg bg-a-surface hover:bg-a-subtle text-a-text-1 border border-a-border text-[12px] font-normal flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 text-a-text-3 ${refreshing ? "animate-spin" : ""}`} />
                Sync
              </button>
              <button
                type="button"
                onClick={logout}
                className="admin-press py-1.5 px-2.5 rounded-lg bg-a-surface hover:bg-a-danger-bg text-a-text-2 hover:text-a-danger border border-a-border text-[12px] font-normal flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Out
              </button>
            </div>
          </div>
        </aside>

        <div className="admin-scroll flex-1 min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 bg-a-canvas/90 backdrop-blur-md border-b border-a-border px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-[16px] font-semibold tracking-[-0.01em] text-a-text-1 truncate">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-a-surface border border-a-border text-[12px] text-a-text-3">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    data.supabaseEnabled ? "bg-a-success" : "bg-a-accent"
                  }`}
                />
                {data.supabaseEnabled ? "Supabase Cloud Sync" : "Local SQLite"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {data.user.role === "owner" && (
                <button
                  type="button"
                  onClick={() =>
                    postAction(
                      { action: "clear_demo_data", includeCatalog: false },
                      "Demo orders, leads & analytics cleared to 0!"
                    )
                  }
                  className="admin-press px-3 py-1.5 rounded-lg bg-a-surface hover:bg-a-danger-bg text-a-text-2 hover:text-a-danger border border-a-border text-[12px] font-medium hidden md:flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Demo Data
                </button>
              )}
              <button
                type="button"
                onClick={copyDailyDigest}
                className="admin-press px-3 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-a-accent" />
                <span className="hidden sm:inline">Copy Sales Digest</span>
                <span className="sm:hidden">Digest</span>
              </button>
            </div>
          </header>

          <div
            key={activeTab}
            className="admin-surface-enter p-4 sm:p-6 max-w-[1280px] mx-auto space-y-6"
          >
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "cancellations" && <CancellationsTab />}
            {activeTab === "collections" && <CollectionsTab />}
            {activeTab === "products" && <ProductsTab />}
            {activeTab === "customers" && <CustomersTab />}
            {activeTab === "abandoned" && <AbandonedTab />}
            {activeTab === "leads" && <LeadsTab />}
            {activeTab === "promos" && <PromosTab />}
            {activeTab === "content" && <ContentTab />}
            {activeTab === "staff" && <StaffTab />}
            {activeTab === "audit" && <AuditTab />}
          </div>
        </div>

        {/* Stacked Toasts */}
        {toasts.length > 0 && (
          <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="admin-toast flex items-center gap-3 px-4 py-2.5 rounded-xl bg-a-ink-btn text-a-on-ink border border-a-border text-[13px] font-normal shadow-[var(--a-shadow-pop)]"
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    t.variant === "error"
                      ? "bg-a-danger"
                      : t.variant === "info"
                      ? "bg-a-accent"
                      : "bg-a-success"
                  }`}
                />
                <span>{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      setToasts((prev) => prev.filter((item) => item.id !== t.id));
                    }}
                    className="admin-press ml-1 px-2.5 py-0.5 rounded-md bg-a-surface/15 hover:bg-a-surface/25 text-a-on-ink text-[12px] font-medium cursor-pointer"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminContext.Provider>
  );
}
