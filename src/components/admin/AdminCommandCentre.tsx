"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { buildNavGroups } from "./AdminShell/navConfig";
import { MobileNavDrawer, Sidebar } from "./AdminShell/Sidebar";
import { TopBar } from "./AdminShell/TopBar";
import { MobileBottomBar } from "./AdminShell/MobileBottomBar";
import { CommandPalette } from "./AdminShell/CommandPalette";
import { ShortcutsDialog } from "./AdminShell/ShortcutsDialog";
import { Button, ConfirmDialog, Field, Input, KpiSkeleton, TableSkeleton } from "./ui";

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
  const [signingIn, setSigningIn] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [printingSlipOrders, setPrintingSlipOrders] = useState<AdminOrder[]>([]);

  // Shell overlays & shortcut state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [triggerNewCounter, setTriggerNewCounter] = useState(0);

  const chordRef = useRef<{ key: string; at: number } | null>(null);

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

  // Global keyboard shortcuts
  useEffect(() => {
    if (!data) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K always toggles Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (paletteOpen || shortcutsOpen || mobileNavOpen || confirmResetOpen) return;

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key;

      if (k === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (k === "/") {
        const searchEl = document.querySelector<HTMLInputElement>("[data-admin-search]");
        if (searchEl) {
          e.preventDefault();
          searchEl.focus();
        } else {
          e.preventDefault();
          setPaletteOpen(true);
        }
        return;
      }

      if (k.toLowerCase() === "n") {
        if (["products", "collections", "promos", "staff"].includes(activeTab)) {
          e.preventDefault();
          setTriggerNewCounter((c) => c + 1);
        }
        return;
      }

      const lower = k.toLowerCase();
      const now = Date.now();
      if (chordRef.current && chordRef.current.key === "g" && now - chordRef.current.at < 900) {
        chordRef.current = null;
        const map: Record<string, AdminTab> = {
          o: "overview",
          r: "orders",
          p: "products",
          c: "customers",
        };
        const dest = map[lower];
        if (dest && canAccessSection(data.user.role, dest)) {
          e.preventDefault();
          setActiveTab(dest);
        }
        return;
      }

      if (lower === "g") {
        chordRef.current = { key: "g", at: now };
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    activeTab,
    confirmResetOpen,
    data,
    mobileNavOpen,
    paletteOpen,
    setActiveTab,
    shortcutsOpen,
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    await login(email, password);
    setSigningIn(false);
  };

  /* ─── 1. Initial Skeleton Screen ─── */
  if (loading && !data) {
    return (
      <div className="admin-ui min-h-screen bg-a-canvas text-a-text-1 p-6 sm:p-10">
        <div className="max-w-[1280px] mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
          <TableSkeleton rows={6} cols={5} />
        </div>
      </div>
    );
  }

  /* ─── 2. Staff Sign-In Screen ─── */
  if (!data || !metrics) {
    return (
      <div className="admin-ui min-h-screen bg-a-canvas text-a-text-1 flex items-center justify-center p-5">
        <div className="admin-surface-enter w-full max-w-[400px] bg-a-surface border border-a-border rounded-[14px] p-8 shadow-[var(--a-shadow-pop)]">
          <div className="flex flex-col items-center text-center border-b border-a-border pb-6">
            <img
              src="/brand/noksha-logo.png"
              alt="Noksha — Handcrafted in Bangladesh"
              className="h-11 w-auto object-contain"
            />
            <p className="text-[12px] uppercase tracking-[0.16em] text-a-accent-text font-medium mt-4">
              Studio Console &amp; CRM
            </p>
            <h1 className="font-display text-3xl font-normal text-a-text-1 mt-1">
              Staff Sign In
            </h1>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Field label="Staff email" required>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            {authError && (
              <p className="text-[13px] font-medium text-a-danger bg-a-danger-bg border border-a-border rounded-[8px] px-3 py-2">
                {authError}
              </p>
            )}

            <Button type="submit" variant="primary" loading={signingIn} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-a-border">
            <p className="text-[12px] font-medium text-a-text-3 mb-2.5">
              Quick-fill staff account
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[10px] bg-a-subtle border border-a-border">
              <button
                type="button"
                onClick={() => {
                  setEmail("owner@noksha.bd");
                  setPassword("NokshaOwner2026!");
                }}
                className="admin-press min-h-[34px] px-2 py-1.5 rounded-[7px] bg-a-surface text-a-text-1 text-[12px] font-medium cursor-pointer shadow-[var(--a-shadow-card)]"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("manager@noksha.bd");
                  setPassword("NokshaManager2026!");
                }}
                className="admin-press min-h-[34px] px-2 py-1.5 rounded-[7px] bg-a-surface text-a-text-1 text-[12px] font-medium cursor-pointer shadow-[var(--a-shadow-card)]"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("support@noksha.bd");
                  setPassword("NokshaSupport2026!");
                }}
                className="admin-press min-h-[34px] px-2 py-1.5 rounded-[7px] bg-a-surface text-a-text-1 text-[12px] font-medium cursor-pointer shadow-[var(--a-shadow-card)]"
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
    copyText(summary, "Sales digest copied to clipboard");
  };

  const visibleGroups = buildNavGroups(data, metrics);
  const navItems = visibleGroups.flatMap((g) => g.items);
  const currentNav = navItems.find((n) => n.id === activeTab);

  // Active sub-entity breadcrumb (e.g. Orders / NK-KZRST87)
  const subBreadcrumb =
    activeTab === "orders"
      ? queryParams.get("order")
      : activeTab === "customers"
      ? queryParams.get("customer")
      : activeTab === "products"
      ? queryParams.get("edit")
      : null;

  const clearSubBreadcrumb = () => {
    if (activeTab === "orders") setQueryParam("order", null);
    if (activeTab === "customers") setQueryParam("customer", null);
    if (activeTab === "products") setQueryParam("edit", null);
  };

  const dateRange = queryParams.get("range") || "30d";

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
        <Sidebar
          groups={visibleGroups}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenSearch={() => setPaletteOpen(true)}
          user={data.user}
          refreshing={refreshing}
          onRefresh={refresh}
          onLogout={logout}
        />

        <MobileNavDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          groups={visibleGroups}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          user={data.user}
          onRefresh={refresh}
          onLogout={logout}
        />

        <div className="admin-scroll flex-1 min-w-0 lg:h-screen lg:overflow-y-auto">
          <TopBar
            currentNav={currentNav}
            subBreadcrumb={subBreadcrumb}
            onClearSubBreadcrumb={clearSubBreadcrumb}
            showDateRange={activeTab === "overview" || activeTab === "analytics"}
            dateRange={dateRange}
            onDateRangeChange={(val) => setQueryParam("range", val === "30d" ? null : val)}
            lastSyncedAt={lastSyncedAt}
            refreshing={refreshing}
            supabaseEnabled={data.supabaseEnabled}
            onRefresh={refresh}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenSearch={() => setPaletteOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />

          <main
            key={activeTab}
            className="admin-surface-enter p-4 sm:p-6 pb-24 lg:pb-8 max-w-[1280px] mx-auto space-y-6"
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
          </main>
        </div>

        <MobileBottomBar
          navItems={navItems}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenMore={() => setMobileNavOpen(true)}
        />

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          data={data}
          navItems={navItems}
          onNavigate={(tab, extra) => setActiveTab(tab, extra)}
          onNewAction={(tab) => {
            setActiveTab(tab);
            setTimeout(() => setTriggerNewCounter((c) => c + 1), 30);
          }}
          onCopyDigest={copyDailyDigest}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onRequestResetDemo={() => setConfirmResetOpen(true)}
        />

        <ShortcutsDialog
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        <ConfirmDialog
          open={confirmResetOpen}
          title="Reset demo orders, leads & analytics?"
          description="This permanently clears all demo Orders, Customers, Leads, Abandoned Carts, and Analytics counters to 0 while keeping your product catalog intact."
          confirmLabel="Reset demo data"
          danger
          loading={resetLoading}
          onCancel={() => setConfirmResetOpen(false)}
          onConfirm={async () => {
            setResetLoading(true);
            await postAction(
              { action: "clear_demo_data", includeCatalog: false },
              "Demo orders, leads & analytics cleared to 0"
            );
            setResetLoading(false);
            setConfirmResetOpen(false);
          }}
        />

        {/* Sonner-Inspired Stacked Toasts */}
        {toasts.length > 0 && (
          <div className="fixed bottom-16 lg:bottom-5 right-4 lg:right-5 z-50 flex flex-col gap-2 items-end print:hidden">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="admin-toast flex items-center gap-3 px-4 py-2.5 rounded-[10px] bg-a-ink-btn text-a-on-ink border border-a-border text-[13px] font-normal shadow-[var(--a-shadow-pop)]"
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
                <span className="font-num">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      setToasts((prev) => prev.filter((item) => item.id !== t.id));
                    }}
                    className="admin-press ml-1 px-2.5 py-1 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-a-on-ink text-[12px] font-medium cursor-pointer"
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
