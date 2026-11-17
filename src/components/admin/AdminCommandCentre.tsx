"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  Upload,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { DropStatus, formatBDT, PillarId, ProductStatus } from "@/data/nokshaData";
import { DbCategory, DbCollection, DbProduct } from "@/lib/db";
import {
  AdminCustomer,
  AdminOrder,
  AdminPayload,
  canAccessSection,
  downloadCsv,
  toBdWhatsApp,
} from "./adminTypes";

type AdminTab =
  | "overview"
  | "analytics"
  | "orders"
  | "cancellations"
  | "collections"
  | "products"
  | "customers"
  | "promos"
  | "abandoned"
  | "leads"
  | "content"
  | "staff"
  | "audit";

const ORDER_STATUSES = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];

const EMPTY_CATEGORY: Partial<DbCategory> = {
  id: "",
  shortName: "",
  name: "",
  bengaliName: "",
  subtitle: "",
  sortOrder: 4,
  active: true,
};

const EMPTY_COLLECTION: Partial<DbCollection> = {
  id: "",
  dropNumber: "Drop 04",
  shortName: "Drop 04",
  title: "",
  bengaliTitle: "",
  subtitle: "",
  description: "",
  story: "",
  craftMetric: "Exclusive 1-of-1 Drop · Handcrafted in Bangladesh",
  priceRange: "৳ 6,500 – ৳ 18,000",
  heroImage: "/images/hero-courtyard.png",
  bannerImage: "/images/hero-courtyard.png",
  accentHex: "#B08A4F",
  exclusivity: "one_of_one",
  dropStatus: "upcoming",
  releaseDate: "Upcoming Drop",
  sortOrder: 4,
  active: true,
};

const EMPTY_PRODUCT: Partial<DbProduct> = {
  id: "",
  sku: "",
  name: "",
  bengaliName: "",
  category: "light-shades",
  collectionId: "",
  acquiredBy: "",
  priceBDT: 5500,
  originalPriceBDT: undefined,
  costBDT: 2600,
  stockQty: 8,
  lowStockThreshold: 2,
  status: "ready",
  statusLabel: "In Stock",
  region: "Bangladesh",
  artisanHours: 42,
  artisanHoursLabel: "42 Hours Handcrafted",
  materials: "",
  dimensions: "",
  story: "",
  care: "",
  image: "/images/light-jamdani-pendant.png",
  gallery: ["/images/light-jamdani-pendant.png"],
  accentColor: "#B08A4F",
  colors: [{ name: "Signature", hex: "#B08A4F" }],
};

export default function AdminCommandCentre() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("owner@noksha.bd");
  const [password, setPassword] = useState("NokshaOwner2026!");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [toast, setToast] = useState<string | null>(null);

  // Filters & Selections
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderStatusDraft, setOrderStatusDraft] = useState("");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState("");
  const [courierDraft, setCourierDraft] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [timelineNoteDraft, setTimelineNoteDraft] = useState("");

  // Product, Collection & Category Editor state
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);
  const [editingCollection, setEditingCollection] = useState<Partial<DbCollection> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<DbCategory> | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Customer CRM Inspector state
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [custTagsDraft, setCustTagsDraft] = useState("");
  const [custNotesDraft, setCustNotesDraft] = useState("");
  const [custVipDraft, setCustVipDraft] = useState(false);

  // Promo Editor state
  const [promoCodeDraft, setPromoCodeDraft] = useState("");
  const [promoTypeDraft, setPromoTypeDraft] = useState<"percent" | "fixed">("percent");
  const [promoValDraft, setPromoValDraft] = useState("10");
  const [promoMinDraft, setPromoMinDraft] = useState("0");
  const [promoMaxUsesDraft, setPromoMaxUsesDraft] = useState("100");
  const [promoLabelDraft, setPromoLabelDraft] = useState("");

  // Leads filter
  const [leadFilter, setLeadFilter] = useState("all");

  // Site Content state
  const [contentDraft, setContentDraft] = useState<Record<string, string>>({});

  // Staff Editor state
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"owner" | "manager" | "support">("support");
  const [staffPassword, setStaffPassword] = useState("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" });
      if (res.status === 401) {
        setData(null);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const payload = (await res.json()) as AdminPayload;
      setData(payload);
      setContentDraft(payload.siteContent || {});
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const out = await res.json();
      if (!res.ok) {
        setAuthError(out.error || "Login failed");
        return;
      }
      await fetchDashboard();
    } catch {
      setAuthError("Network error while signing in.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setData(null);
  };

  const postAction = async (body: Record<string, unknown>, successMsg: string) => {
    const res = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json();
    if (!res.ok) {
      notify(out.error || "Action failed");
      return false;
    }
    notify(successMsg);
    await fetchDashboard();
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setEditingProduct((prev) => ({
          ...prev,
          image: out.url,
          gallery: [out.url, ...(prev?.gallery ?? []).filter((g) => g !== out.url)],
        }));
        notify("Image uploaded and attached to piece");
      } else {
        notify(out.error || "Upload failed");
      }
    } catch {
      notify("Upload error");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleCollectionImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: "heroImage" | "bannerImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingCollection) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setEditingCollection((prev) => ({
          ...prev,
          [targetField]: out.url,
          ...(targetField === "heroImage" && !prev?.bannerImage ? { bannerImage: out.url } : {}),
        }));
        notify("Collection image uploaded!");
      } else {
        notify(out.error || "Upload failed");
      }
    } catch {
      notify("Upload error");
    } finally {
      setUploadingImg(false);
    }
  };

  const openOrderInspector = (o: AdminOrder) => {
    setSelectedOrder(o);
    setOrderStatusDraft(o.status);
    setPaymentStatusDraft(o.paymentStatus);
    setCourierDraft(o.courierName);
    setTrackingDraft(o.trackingCode);
    setInternalNoteDraft(o.internalNotes);
    setTimelineNoteDraft("");
  };

  const openCustomerInspector = (c: AdminCustomer) => {
    setSelectedCustomer(c);
    setCustTagsDraft(c.tags);
    setCustNotesDraft(c.notes);
    setCustVipDraft(c.vip);
  };

  // Computed KPIs
  const metrics = useMemo(() => {
    if (!data) return null;
    const validOrders = data.orders.filter((o) => o.status !== "cancelled");
    const grossRevenue = validOrders.reduce((s, o) => s + o.totalBDT, 0);
    const aov = validOrders.length > 0 ? Math.round(grossRevenue / validOrders.length) : 0;

    const costMap = new Map(data.products.map((p) => [p.id, p.costBDT]));
    let totalCost = 0;
    for (const o of validOrders) {
      for (const item of o.items) {
        const unitCost = (item.productId && costMap.get(item.productId)) || Math.round(item.priceBDT * 0.48);
        totalCost += unitCost * item.quantity;
      }
    }
    const estProfit = Math.max(0, grossRevenue - totalCost);

    const lowStockProducts = data.products.filter(
      (p) =>
        p.status !== "waitlist" &&
        (p.status === "sold" || p.stockQty <= p.lowStockThreshold)
    );

    const unrecoveredCarts = data.abandonedCheckouts.filter((a) => !a.recovered);
    const abandonedValue = unrecoveredCarts.reduce((s, a) => s + a.subtotalBDT, 0);

    const convRate =
      data.analytics.totalSessions > 0
        ? ((validOrders.length / data.analytics.totalSessions) * 100).toFixed(1)
        : "0.0";

    return {
      grossRevenue,
      estProfit,
      validOrdersCount: validOrders.length,
      pendingOrdersCount: data.orders.filter((o) => o.status === "new" || o.status === "confirmed").length,
      aov,
      lowStockProducts,
      unrecoveredCarts,
      abandonedValue,
      convRate,
    };
  }, [data]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return data.orders.filter((o) => {
      if (orderFilter !== "all" && o.status !== orderFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, orderFilter, orderSearch]);

  const copyDailyDigest = () => {
    if (!data || !metrics) return;
    const topPiece = [...data.products].sort((a, b) => b.viewsCount - a.viewsCount)[0];
    const summary = [
      `📊 *NOKSHA (নকশা) — Command Digest* (${new Date().toLocaleDateString("en-GB")})`,
      `• Gross Revenue: ${formatBDT(metrics.grossRevenue)} (Est. Net Profit: ${formatBDT(metrics.estProfit)})`,
      `• Active Orders: ${metrics.validOrdersCount} (${metrics.pendingOrdersCount} awaiting dispatch)`,
      `• Visitors / Sessions: ${data.analytics.totalVisitors} visitors / ${data.analytics.totalSessions} sessions (${metrics.convRate}% conv.)`,
      `• Most Viewed Piece: ${topPiece?.name ?? "N/A"} (${topPiece?.viewsCount ?? 0} views)`,
      `• Unrecovered Carts: ${metrics.unrecoveredCarts.length} (${formatBDT(metrics.abandonedValue)} at risk)`,
      `• Low Stock / Sold Alerts: ${metrics.lowStockProducts.length} pieces`,
      `• Leads & Waitlist: ${data.leads.length} total`,
    ].join("\n");
    navigator.clipboard.writeText(summary);
    notify("Daily digest copied to clipboard for WhatsApp / Email!");
  };

  const inputCls =
    "w-full px-3.5 py-2 bg-white border border-[#B8A68E] rounded-lg text-[13.5px] text-[#14110F] font-medium placeholder:text-[#6E5F51] focus:outline-none focus:border-[#2A1F18] focus:ring-1 focus:ring-[#2A1F18]";
  const cardCls = "bg-white border border-[#D4C5B0] rounded-xl shadow-[0_2px_10px_rgba(30,25,21,0.05)]";
  const thCls = "py-3 px-4 text-left text-[13px] font-bold uppercase tracking-wider text-[#1E1915] bg-[#EFE7DA] border-b border-[#D4C5B0]";

  /* ───────────────────────── 1. Loading & Login Screen ───────────────────────── */
  if (loading && !data) {
    return (
      <div className="admin-ui min-h-screen bg-[#F7F3EB] text-[#14110F] flex items-center justify-center text-sm font-semibold">
        Loading Noksha Command Centre…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-ui min-h-screen bg-[#F7F3EB] text-[#14110F] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border-2 border-[#D4C5B0] rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center border-b border-[#E6DDD0] pb-6">
            <img
              src="/brand/noksha-logo.png"
              alt="Noksha — Handcrafted in Bangladesh"
              className="h-14 w-auto object-contain"
            />
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#7A5417] font-bold mt-4">
              Command Centre &amp; CRM
            </p>
            <h1 className="font-display text-3xl font-semibold text-[#14110F] mt-1">
              Staff Sign In
            </h1>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-[#14110F] mb-1.5">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#14110F] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            {authError && (
              <p className="text-[13px] font-bold text-[#8C2F2F] bg-[#FCECEC] border border-[#E5B8B8] rounded-lg px-3 py-2">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2A1F18] hover:bg-[#4B3527] text-white font-bold text-[13px] uppercase tracking-[0.18em] rounded-lg cursor-pointer transition-colors"
            >
              Sign In to Command Centre
            </button>
          </form>

          {/* Quick Role Switcher for Localhost Testing */}
          <div className="mt-6 pt-5 border-t border-[#E6DDD0]">
            <p className="text-[13px] font-bold text-[#1E1915] mb-2.5">
              Quick-fill seeded staff roles:
            </p>
            <div className="grid grid-cols-3 gap-2 text-[13px]">
              <button
                type="button"
                onClick={() => {
                  setEmail("owner@noksha.bd");
                  setPassword("NokshaOwner2026!");
                }}
                className="px-2.5 py-2 rounded-lg bg-[#EFE7DA] hover:bg-[#E4D8C5] text-[#14110F] border border-[#C9B9A3] font-bold cursor-pointer"
              >
                Owner (Full)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("manager@noksha.bd");
                  setPassword("NokshaManager2026!");
                }}
                className="px-2.5 py-2 rounded-lg bg-[#EFE7DA] hover:bg-[#E4D8C5] text-[#144740] border border-[#C9B9A3] font-bold cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("support@noksha.bd");
                  setPassword("NokshaSupport2026!");
                }}
                className="px-2.5 py-2 rounded-lg bg-[#EFE7DA] hover:bg-[#E4D8C5] text-[#6B4710] border border-[#C9B9A3] font-bold cursor-pointer"
              >
                Support
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[13px] font-bold text-[#1E1915] hover:underline"
            >
              ← Return to Live Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allNavItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Command Overview", icon: <Activity className="w-4 h-4 shrink-0" /> },
    { id: "analytics", label: "Analytics & Exit Funnel", icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    {
      id: "orders",
      label: "Orders Pipeline",
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
      badge: metrics?.pendingOrdersCount,
    },
    {
      id: "cancellations",
      label: "Cancellation Requests",
      icon: <XCircle className="w-4 h-4 shrink-0" />,
      badge: data.orders.filter((o) => o.cancellationRequested).length,
    },
    {
      id: "collections",
      label: "Drops & Categories",
      icon: <Layers className="w-4 h-4 shrink-0" />,
      badge: data.collections.length,
    },
    {
      id: "products",
      label: "Products & Inventory",
      icon: <Package className="w-4 h-4 shrink-0" />,
      badge: metrics?.lowStockProducts.length,
    },
    { id: "customers", label: "Customers CRM", icon: <Users className="w-4 h-4 shrink-0" />, badge: data.customers.length },
    {
      id: "abandoned",
      label: "Abandoned Checkouts",
      icon: <TrendingDown className="w-4 h-4 shrink-0" />,
      badge: metrics?.unrecoveredCarts.length,
    },
    {
      id: "leads",
      label: "Waitlist & Circle Leads",
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      badge: data.leads.filter((l) => l.status === "new").length,
    },
    { id: "promos", label: "Promo Codes", icon: <Tag className="w-4 h-4 shrink-0" /> },
    { id: "content", label: "Site Content Editor", icon: <FileText className="w-4 h-4 shrink-0" /> },
    { id: "staff", label: "Staff & Permissions", icon: <Shield className="w-4 h-4 shrink-0" /> },
    { id: "audit", label: "Activity Audit Log", icon: <Settings className="w-4 h-4 shrink-0" /> },
  ];
  const navItems = allNavItems.filter((tab) => canAccessSection(data.user.role, tab.id));

  return (
    <div className="admin-ui min-h-screen lg:h-screen lg:overflow-hidden bg-[#F7F3EB] text-[#14110F] flex flex-col lg:flex-row">
      {/* Left Command Sidebar — Fixed / Non-Scrolling on Desktop */}
      <aside className="w-full lg:w-64 lg:h-screen lg:overflow-hidden bg-[#EFE7DA] border-b lg:border-b-0 lg:border-r border-[#D4C5B0] shrink-0 flex flex-col justify-between">
        <div>
          <div className="px-4 py-3.5 border-b border-[#D4C5B0] flex items-center justify-between bg-[#FBF8F3]">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/brand/noksha-logo.png"
                alt="NOKSHA"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <Link
              href="/"
              target="_blank"
              className="p-1.5 rounded-lg bg-[#EFE7DA] hover:bg-[#E2D5C1] text-[#14110F] border border-[#C9B9A3]"
              title="Open Live Storefront"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="px-4 py-2 bg-[#E5DAC8] border-b border-[#D4C5B0] flex items-center justify-between">
            <span className="text-[11px] font-normal uppercase tracking-[0.14em] text-[#14110F]">
              Command Centre
            </span>
            <span className="px-2 py-0.5 rounded bg-[#2A1F18] text-white text-[10px] font-normal uppercase">
              {data.user.role}
            </span>
          </div>

          <nav className="p-2 flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[13.5px] font-normal whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? "bg-[#2A1F18] text-white shadow-sm"
                      : "text-[#14110F] hover:bg-[#E2D5C1]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`font-num px-1.5 py-0.2 rounded text-[11px] font-normal shrink-0 ${
                        active
                          ? "bg-[#B08A4F] text-white"
                          : "bg-white text-[#14110F] border border-[#B8A68E]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-[#D4C5B0] bg-[#FBF8F3] hidden lg:block space-y-2.5">
          <div className="text-[13px]">
            <p className="font-normal text-[#14110F] truncate">{data.user.name}</p>
            <p className="text-[#2D2620] font-normal truncate">{data.user.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchDashboard}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#EFE7DA] hover:bg-[#E2D5C1] text-[#14110F] border border-[#B8A68E] text-[13px] font-normal flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="py-1.5 px-2.5 rounded-lg bg-[#FCECEC] hover:bg-[#F7D6D6] text-[#8C2F2F] border border-[#E5B8B8] text-[13px] font-normal flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area — Independently Scrollable */}
      <div className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto p-5 sm:p-8 space-y-7">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#DED3C2] pb-5 bg-[#FBF8F3]/90">
          <div className="flex items-center gap-3.5">
            <img src="/brand/noksha-mark.png" alt="" className="w-9 h-9 hidden sm:block" />
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-normal text-[#1E1915]">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
              <p className="text-[13px] text-[#1E1915] font-medium mt-0.5">
                Live SQLite Storefront Sync · Signed in as{" "}
                <strong className="text-[#1E1915]">{data.user.email}</strong> (
                {data.user.role.toUpperCase()})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={copyDailyDigest}
              className="px-4 py-2.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Copy className="w-3.5 h-3.5 text-[#D8BF90]" />
              Copy WhatsApp Sales Digest
            </button>
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F4EDE1] text-[#1E1915] border border-[#C9B9A3] text-[13px] font-bold flex items-center gap-1.5"
            >
              View Live Site <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ───────────────────────── TAB 1: COMMAND OVERVIEW ───────────────────────── */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-8">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label="Gross Revenue (BDT)"
                value={formatBDT(metrics.grossRevenue)}
                sub={`Est. Net Profit: ${formatBDT(metrics.estProfit)}`}
                accent="text-[#1B5E55]"
              />
              <KpiCard
                label="Total Orders"
                value={String(metrics.validOrdersCount)}
                sub={`${metrics.pendingOrdersCount} awaiting dispatch · AOV ${formatBDT(metrics.aov)}`}
                accent="text-[#2A1F18]"
              />
              <KpiCard
                label="Visitors & Sessions"
                value={`${data.analytics.totalVisitors} / ${data.analytics.totalSessions}`}
                sub={`${data.analytics.totalPageViews} page views · ${metrics.convRate}% conversion`}
                accent="text-[#7A5417]"
              />
              <KpiCard
                label="Abandoned Carts at Risk"
                value={formatBDT(metrics.abandonedValue)}
                sub={`${metrics.unrecoveredCarts.length} unrecovered checkouts`}
                accent="text-[#8C2F2F]"
              />
            </div>

            {/* Low-Stock & 1-of-1 Kantha Alerts + Quick Funnel Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inventory Alerts */}
              <div className={`lg:col-span-6 ${cardCls} p-5 space-y-4`}>
                <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#8C2F2F] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Inventory &amp; 1-of-1 Drop Alerts ({metrics.lowStockProducts.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("products")}
                    className="text-[13px] font-bold text-[#2A1F18] hover:underline cursor-pointer"
                  >
                    Manage Catalog →
                  </button>
                </div>

                <div className="divide-y divide-[#E6DDD0] text-[13px]">
                  {metrics.lowStockProducts.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt=""
                          className="w-11 h-13 rounded object-cover shrink-0 border border-[#DED3C2]"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#1E1915] truncate">{p.name}</p>
                          <p className="text-[#1E1915] font-medium">
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
                          className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                            p.status === "sold"
                              ? "bg-[#FCECEC] text-[#8C2F2F] border border-[#E5B8B8]"
                              : "bg-[#FDF3E1] text-[#7A5417] border border-[#E6C98A]"
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

              {/* Where Visitors Exit Snapshot */}
              <div className={`lg:col-span-6 ${cardCls} p-5 space-y-4`}>
                <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#2A1F18] flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-[#8C2F2F]" />
                    Customer Journey &amp; Exit Drop-Off Snapshot
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("analytics")}
                    className="text-[13px] font-bold text-[#2A1F18] hover:underline cursor-pointer"
                  >
                    Full Funnel &amp; Exit Report →
                  </button>
                </div>

                <div className="space-y-3 text-[13px]">
                  {data.analytics.funnel.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#1E1915] font-bold">{f.label}</span>
                        <span className="font-num text-[#1E1915] font-medium">
                          <strong className="text-[#1E1915]">{f.sessions}</strong> sessions ({f.pctOfTotal}%) ·{" "}
                          <span className="text-[#8C2F2F] font-bold">{f.exitsHere} exited here</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#EFE8DC] rounded-full overflow-hidden border border-[#DED3C2]">
                        <div
                          className="h-full bg-[#B08A4F] rounded-full"
                          style={{ width: `${Math.max(4, f.pctOfTotal)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className={`${cardCls} overflow-hidden`}>
              <div className="p-5 border-b border-[#DED3C2] flex items-center justify-between bg-[#FBF8F3]">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915]">
                  Recent Orders
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="text-[13px] font-bold text-[#8C2F2F] hover:underline cursor-pointer"
                >
                  Open Full Order Pipeline →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Order ID</th>
                      <th className={thCls}>Customer</th>
                      <th className={thCls}>District</th>
                      <th className={thCls}>Payment</th>
                      <th className={thCls}>Total</th>
                      <th className={thCls}>Status</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDD0]">
                    {data.orders.slice(0, 6).map((o) => (
                      <tr key={o.id} className="hover:bg-[#FBF8F3]">
                        <td className="py-3.5 px-4 font-num font-bold text-[#2A1F18]">{o.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1E1915]">{o.customerName}</p>
                          <p className="font-num text-[#1E1915] font-medium">{o.customerPhone}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1E1915]">{o.district}</td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-[#1E1915]">
                          {o.paymentMethod} ({o.paymentStatus})
                        </td>
                        <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                          {formatBDT(o.totalBDT)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("orders");
                              openOrderInspector(o);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold cursor-pointer"
                          >
                            Manage
                          </button>
                          <Link
                            href={`/admin/invoice/${o.id}`}
                            className="px-3 py-1.5 rounded-lg bg-[#F4EDE1] hover:bg-[#E8DEC9] text-[#1E1915] border border-[#C9B9A3] font-bold inline-block"
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
        )}

        {/* ───────────────────────── TAB 2: ANALYTICS, FUNNEL & EXIT STEPS ───────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label="Unique Visitors"
                value={String(data.analytics.totalVisitors)}
                sub="Tracked via persistent visitor ID"
                accent="text-[#2A1F18]"
              />
              <KpiCard
                label="Total Sessions"
                value={String(data.analytics.totalSessions)}
                sub="Across desktop & mobile"
                accent="text-[#7A5417]"
              />
              <KpiCard
                label="Total Page & Piece Views"
                value={String(data.analytics.totalPageViews)}
                sub={`Avg. Time on Page: ${data.analytics.avgDurationSec}s`}
                accent="text-[#1B5E55]"
              />
              <KpiCard
                label="Top Exit Step"
                value={
                  [...data.analytics.funnel].sort((a, b) => b.exitsHere - a.exitsHere)[0]?.key ??
                  "product_detail"
                }
                sub="Highest single drop-off stage"
                accent="text-[#8C2F2F]"
              />
            </div>

            {/* Step-by-Step Customer Funnel & Exit Table */}
            <div className={`${cardCls} overflow-hidden`}>
              <div className="p-5 border-b border-[#DED3C2] bg-[#FBF8F3]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E1915]">
                  Full Customer Journey Funnel &amp; Step-by-Step Exit Analysis
                </h2>
                <p className="text-[13px] text-[#1E1915] font-medium mt-0.5">
                  Tracks how many sessions reach each step, step-to-step conversion, and from which step customers exit the site.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Funnel Stage</th>
                      <th className={thCls}>Sessions Reached</th>
                      <th className={thCls}>% of Total Traffic</th>
                      <th className={thCls}>Step Conversion</th>
                      <th className={thCls}>Step Drop-off %</th>
                      <th className={`${thCls} text-right`}>Exited Site at This Step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDD0]">
                    {data.analytics.funnel.map((f) => (
                      <tr key={f.key} className="hover:bg-[#FBF8F3]">
                        <td className="py-3.5 px-4 font-bold text-[#1E1915]">{f.label}</td>
                        <td className="py-3.5 px-4 font-num font-bold text-[#2A1F18]">
                          {f.sessions}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 h-2.5 bg-[#EFE8DC] rounded-full overflow-hidden border border-[#DED3C2]">
                              <div
                                className="h-full bg-[#B08A4F]"
                                style={{ width: `${Math.max(4, f.pctOfTotal)}%` }}
                              />
                            </div>
                            <span className="font-num font-bold text-[#1E1915]">
                              {f.pctOfTotal}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-num text-[#1B5E55] font-bold">
                          {f.stepConversionPct}%
                        </td>
                        <td className="py-3.5 px-4 font-num text-[#8C2F2F] font-semibold">
                          {f.dropOffPct}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-num font-bold text-[#8C2F2F]">
                          {f.exitsHere} exits
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Visited Pages & Acquisition Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Pages & Exit Rates */}
              <div className={`lg:col-span-6 ${cardCls} overflow-hidden`}>
                <div className="p-4 border-b border-[#DED3C2] bg-[#FBF8F3]">
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915]">
                    Most Visited Pages &amp; Page Exit Rates
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] text-left border-collapse">
                    <thead>
                      <tr>
                        <th className={thCls}>Page Path</th>
                        <th className={thCls}>Views</th>
                        <th className={thCls}>Visitors</th>
                        <th className={thCls}>Avg Time</th>
                        <th className={`${thCls} text-right`}>Exit Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DDD0]">
                      {data.analytics.topPages.map((pg) => (
                        <tr key={pg.path} className="hover:bg-[#FBF8F3]">
                          <td className="py-3 px-4 font-mono font-bold text-[#2A1F18]">
                            {pg.path}
                          </td>
                          <td className="py-3 px-4 font-num font-bold text-[#1E1915]">
                            {pg.views}
                          </td>
                          <td className="py-3 px-4 font-num font-medium text-[#1E1915]">
                            {pg.uniqueVisitors}
                          </td>
                          <td className="py-3 px-4 font-num font-medium text-[#1E1915]">
                            {pg.avgDurationSec}s
                          </td>
                          <td className="py-3 px-4 text-right font-num text-[#8C2F2F] font-bold">
                            {pg.exitRate}% ({pg.exits})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Traffic Sources & Device Split */}
              <div className="lg:col-span-6 space-y-6">
                <div className={`${cardCls} p-5 space-y-4`}>
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915] border-b border-[#E6DDD0] pb-2.5">
                    Acquisition Channels &amp; Devices
                  </h2>
                  <div className="grid grid-cols-2 gap-6 text-[13px]">
                    <div>
                      <p className="text-[#1E1915] uppercase font-bold mb-2">Traffic Referrers</p>
                      <div className="space-y-2">
                        {data.analytics.referrers.map((r) => (
                          <div
                            key={r.referrer}
                            className="flex justify-between border-b border-[#E6DDD0] pb-1.5"
                          >
                            <span className="text-[#1E1915] font-bold">{r.referrer}</span>
                            <span className="font-num text-[#7A5417] font-bold">
                              {r.sessions} sessions
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[#1E1915] uppercase font-bold mb-2">Device Breakdown</p>
                      <div className="space-y-2">
                        {data.analytics.devices.map((d) => (
                          <div
                            key={d.device}
                            className="flex justify-between border-b border-[#E6DDD0] pb-1.5"
                          >
                            <span className="text-[#1E1915] uppercase font-bold">{d.device}</span>
                            <span className="font-num text-[#1B5E55] font-bold">
                              {d.sessions} sessions
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Traffic Trend */}
                <div className={`${cardCls} overflow-hidden`}>
                  <div className="p-4 border-b border-[#DED3C2] bg-[#FBF8F3]">
                    <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915]">
                      Daily Traffic &amp; Page Views Trend
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] text-left border-collapse">
                      <thead>
                        <tr>
                          <th className={thCls}>Date</th>
                          <th className={thCls}>Unique Visitors</th>
                          <th className={thCls}>Sessions</th>
                          <th className={`${thCls} text-right`}>Page Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DDD0]">
                        {data.analytics.daily.map((d) => (
                          <tr key={d.day} className="hover:bg-[#FBF8F3]">
                            <td className="py-2.5 px-4 font-num font-semibold text-[#1E1915]">
                              {d.day}
                            </td>
                            <td className="py-2.5 px-4 font-num font-bold text-[#1E1915]">
                              {d.visitors}
                            </td>
                            <td className="py-2.5 px-4 font-num font-bold text-[#7A5417]">
                              {d.sessions}
                            </td>
                            <td className="py-2.5 px-4 font-num text-right font-bold text-[#1B5E55]">
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

            {/* Product Performance Matrix */}
            <div className={`${cardCls} overflow-hidden`}>
              <div className="p-5 border-b border-[#DED3C2] bg-[#FBF8F3] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E1915]">
                    Product Conversion &amp; Interest Matrix
                  </h2>
                  <p className="text-[13px] text-[#1E1915] font-medium">
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
                  className="px-3.5 py-2 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Piece</th>
                      <th className={thCls}>Category</th>
                      <th className={thCls}>Price</th>
                      <th className={thCls}>Page Views</th>
                      <th className={thCls}>Added to Bag</th>
                      <th className={thCls}>View → Bag %</th>
                      <th className={thCls}>Orders</th>
                      <th className={`${thCls} text-right`}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDD0]">
                    {[...data.products]
                      .sort((a, b) => b.viewsCount - a.viewsCount)
                      .map((p) => {
                        const bagRate =
                          p.viewsCount > 0
                            ? ((p.addToBagCount / p.viewsCount) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <tr key={p.id} className="hover:bg-[#FBF8F3]">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-[#1E1915]">{p.name}</p>
                              <p className="font-mono text-[11px] text-[#1E1915] font-semibold">
                                {p.sku}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#1E1915]">{p.category}</td>
                            <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                              {formatBDT(p.priceBDT)}
                            </td>
                            <td className="py-3.5 px-4 font-num font-bold text-[#2A1F18]">
                              {p.viewsCount}
                            </td>
                            <td className="py-3.5 px-4 font-num font-bold text-[#7A5417]">
                              {p.addToBagCount}
                            </td>
                            <td className="py-3.5 px-4 font-num font-semibold text-[#1E1915]">
                              {bagRate}%
                            </td>
                            <td className="py-3.5 px-4 font-num font-bold text-[#1B5E55]">
                              {p.ordersCount}
                            </td>
                            <td className="py-3.5 px-4 text-right font-num font-bold text-[#1E1915]">
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
        )}

        {/* ───────────────────────── TAB 3: ORDERS PIPELINE ───────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-4 ${cardCls} p-4`}>
              <div className="flex flex-wrap items-center gap-1.5">
                {["all", ...ORDER_STATUSES].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-bold uppercase cursor-pointer ${
                      orderFilter === st
                        ? "bg-[#2A1F18] text-[#FBF8F3]"
                        : "bg-[#F4EDE1] text-[#2A1F18] hover:bg-[#E8DEC9]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#1E1915] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search ID, name, phone, district…"
                    className="pl-8 pr-3 py-1.5 bg-white border border-[#C9B9A3] rounded-lg text-[13px] text-[#1E1915] font-medium focus:outline-none focus:border-[#2A1F18]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      "noksha-orders.csv",
                      [
                        "Order ID",
                        "Date",
                        "Customer",
                        "Phone",
                        "District",
                        "Address",
                        "Payment Method",
                        "Payment Status",
                        "TrxID",
                        "Total BDT",
                        "Order Status",
                        "Courier",
                        "Tracking",
                      ],
                      filteredOrders.map((o) => [
                        o.id,
                        o.createdAt,
                        o.customerName,
                        o.customerPhone,
                        o.district,
                        o.address,
                        o.paymentMethod,
                        o.paymentStatus,
                        o.trxId,
                        o.totalBDT,
                        o.status,
                        o.courierName,
                        o.trackingCode,
                      ])
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Orders List */}
              <div className={`lg:col-span-7 ${cardCls} overflow-hidden`}>
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Order</th>
                      <th className={thCls}>Customer</th>
                      <th className={thCls}>Payment</th>
                      <th className={thCls}>Total</th>
                      <th className={thCls}>Status</th>
                      <th className={`${thCls} text-right`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDD0]">
                    {filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => openOrderInspector(o)}
                        className={`cursor-pointer hover:bg-[#FBF8F3] ${
                          selectedOrder?.id === o.id ? "bg-[#F4EDE1]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-num font-bold text-[#2A1F18]">{o.id}</p>
                          <p className="font-num text-[11px] text-[#1E1915] font-medium">
                            {new Date(o.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1E1915]">{o.customerName}</p>
                          <p className="font-num text-[#1E1915] font-medium">
                            {o.customerPhone} · {o.district}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 uppercase">
                          <span className="font-bold text-[#1E1915]">{o.paymentMethod}</span>
                          <span
                            className={`block text-[10px] font-bold ${
                              o.paymentStatus === "verified" ? "text-[#1B5E55]" : "text-[#7A5417]"
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                          {formatBDT(o.totalBDT)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/invoice/${o.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4EDE1] hover:bg-[#E8DEC9] text-[#1E1915] border border-[#C9B9A3] font-bold"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Slip
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Inspector & Pipeline Updater */}
              <div className={`lg:col-span-5 ${cardCls} p-5 space-y-5`}>
                {!selectedOrder ? (
                  <p className="text-[13px] text-[#1E1915] font-medium py-12 text-center">
                    Click any order on the left to inspect items, verify bKash TrxID, update pipeline status, or print its packing slip.
                  </p>
                ) : (
                  <>
                    <div className="flex items-start justify-between border-b border-[#E6DDD0] pb-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-widest text-[#8C6528] font-bold">
                          Order Inspector
                        </span>
                        <h3 className="font-num text-2xl font-bold text-[#1E1915] mt-0.5">
                          {selectedOrder.id}
                        </h3>
                        <p className="text-[13px] text-[#1E1915] font-semibold">
                          {selectedOrder.customerName} ·{" "}
                          <span className="font-num">{selectedOrder.customerPhone}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={toBdWhatsApp(
                            selectedOrder.customerPhone,
                            `আসসালামু আলাইকুম ${selectedOrder.customerName}, this is Noksha Client Care regarding your order ${selectedOrder.id} (${formatBDT(
                              selectedOrder.totalBDT
                            )}).`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#1B5E55] hover:bg-[#144740] text-white text-[13px] font-bold flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                        <Link
                          href={`/admin/invoice/${selectedOrder.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#F4EDE1] hover:bg-[#E8DEC9] text-[#1E1915] border border-[#C9B9A3] text-[13px] font-bold flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Slip
                        </Link>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 text-[13px]">
                      <p className="uppercase text-[#1E1915] font-bold">Ordered Pieces</p>
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#FBF8F3] p-3 rounded-lg border border-[#DED3C2]"
                        >
                          <div>
                            <p className="font-bold text-[#1E1915]">
                              {item.name} × <span className="font-num">{item.quantity}</span>
                            </p>
                            <p className="text-[#1E1915] font-medium">{item.selectedColor}</p>
                          </div>
                          <span className="font-num font-bold text-[#1E1915]">
                            {formatBDT(item.priceBDT * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {selectedOrder.giftNote && (
                        <p className="p-3 rounded-lg bg-[#FDF3E1] border border-[#E6C98A] text-[#7A5417] font-medium">
                          <strong>Calligraphy Card:</strong> “{selectedOrder.giftNote}”
                        </p>
                      )}
                      <p className="text-[#1E1915] pt-1">
                        <strong>Delivery Address:</strong> {selectedOrder.address},{" "}
                        {selectedOrder.district}
                      </p>
                      {selectedOrder.trxId && (
                        <p className="text-[#1B5E55] font-num font-bold">
                          <strong>bKash/Nagad TrxID:</strong> {selectedOrder.trxId}
                        </p>
                      )}
                    </div>

                    {/* Pipeline Form */}
                    <div className="space-y-3 border-t border-[#E6DDD0] pt-4 text-[13px]">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#2A1F18] mb-1">
                            Order Pipeline Stage
                          </label>
                          <select
                            value={orderStatusDraft}
                            onChange={(e) => setOrderStatusDraft(e.target.value)}
                            className={`${inputCls} uppercase`}
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-[#2A1F18] mb-1">
                            Payment Status
                          </label>
                          <select
                            value={paymentStatusDraft}
                            onChange={(e) => setPaymentStatusDraft(e.target.value)}
                            className={`${inputCls} uppercase`}
                          >
                            <option value="pending">pending</option>
                            <option value="verified">verified</option>
                            <option value="refunded">refunded</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#2A1F18] mb-1">Courier Name</label>
                          <input
                            type="text"
                            value={courierDraft}
                            onChange={(e) => setCourierDraft(e.target.value)}
                            placeholder="e.g. Pathao Prime / Steadfast"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#2A1F18] mb-1">Tracking Code</label>
                          <input
                            type="text"
                            value={trackingDraft}
                            onChange={(e) => setTrackingDraft(e.target.value)}
                            placeholder="e.g. PTH-BD-99281"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#2A1F18] mb-1">
                          Status Transition Note (logged to timeline)
                        </label>
                        <input
                          type="text"
                          value={timelineNoteDraft}
                          onChange={(e) => setTimelineNoteDraft(e.target.value)}
                          placeholder="e.g. Dispatched with muslin wrap & calligraphy card"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2A1F18] mb-1">
                          Internal Staff Notes
                        </label>
                        <textarea
                          rows={2}
                          value={internalNoteDraft}
                          onChange={(e) => setInternalNoteDraft(e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await postAction(
                            {
                              action: "update_order",
                              id: selectedOrder.id,
                              status: orderStatusDraft,
                              paymentStatus: paymentStatusDraft,
                              courierName: courierDraft,
                              trackingCode: trackingDraft,
                              internalNotes: internalNoteDraft,
                              note: timelineNoteDraft,
                            },
                            `Order ${selectedOrder.id} updated`
                          );
                          if (ok) {
                            setSelectedOrder((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    status: orderStatusDraft,
                                    paymentStatus: paymentStatusDraft,
                                    courierName: courierDraft,
                                    trackingCode: trackingDraft,
                                    internalNotes: internalNoteDraft,
                                  }
                                : null
                            );
                          }
                        }}
                        className="w-full py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold rounded-lg cursor-pointer"
                      >
                        Save Order &amp; Pipeline Update
                      </button>
                    </div>

                    {/* Timeline */}
                    <div className="border-t border-[#E6DDD0] pt-4 space-y-2 text-[13px]">
                      <p className="uppercase text-[#1E1915] font-bold">Order Status Timeline</p>
                      <div className="space-y-2">
                        {selectedOrder.timeline.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-start justify-between gap-2 text-[#1E1915]"
                          >
                            <div>
                              <span className="uppercase font-bold text-[#8C2F2F]">{t.status}</span> —{" "}
                              <span className="font-medium">{t.note}</span>{" "}
                              <span className="text-[#1E1915]">({t.by})</span>
                            </div>
                            <span className="font-num text-[11px] text-[#1E1915] shrink-0">
                              {new Date(t.at).toLocaleString("en-GB")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 3A: CANCELLATION REQUESTS ───────────────────────── */}
        {activeTab === "cancellations" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[13px] text-[#14110F] font-medium">
                Review customer order cancellation requests submitted before shipment. Approving a cancellation marks the order as <strong>Cancelled</strong> and automatically restores product stock.
              </p>
            </div>

            {(() => {
              const pendingCancels = data.orders.filter((o) => o.cancellationRequested);
              const cancelledHistory = data.orders.filter((o) => o.status === "cancelled" && !o.cancellationRequested);

              return (
                <div className="space-y-8">
                  <div className={`${cardCls} overflow-hidden`}>
                    <div className="px-5 py-3.5 bg-[#EFE7DA] border-b border-[#D4C5B0] flex items-center justify-between">
                      <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#8C2F2F]">
                        Pending Cancellation Requests ({pendingCancels.length})
                      </h2>
                    </div>

                    {pendingCancels.length === 0 ? (
                      <div className="p-8 text-center text-[13px] text-[#2D2620] font-medium">
                        No pending cancellation requests right now.
                      </div>
                    ) : (
                      <table className="w-full text-[13px] text-left border-collapse">
                        <thead>
                          <tr>
                            <th className={thCls}>Order</th>
                            <th className={thCls}>Customer</th>
                            <th className={thCls}>Pieces &amp; Total</th>
                            <th className={thCls}>Current Stage</th>
                            <th className={thCls}>Customer Reason</th>
                            <th className={`${thCls} text-right`}>Decision</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6DDD0]">
                          {pendingCancels.map((o) => (
                            <tr key={o.id} className="hover:bg-[#FBF8F3]">
                              <td className="py-3.5 px-4 font-num font-bold text-[#14110F]">
                                <p>{o.id}</p>
                                <p className="text-[11px] font-normal text-[#2D2620]">
                                  {new Date(o.createdAt).toLocaleDateString("en-GB")}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-[#14110F]">{o.customerName}</p>
                                <p className="font-num text-[#1E1915]">{o.customerPhone}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="text-[#14110F] font-medium">
                                  {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                                </p>
                                <p className="font-num font-bold text-[#14110F] mt-0.5">
                                  {formatBDT(o.totalBDT)} ({o.paymentMethod.toUpperCase()})
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <StatusBadge status={o.status} />
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                <p className="text-[#8C2F2F] font-medium">
                                  “{o.cancellationReason || "Requested by customer"}”
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                <a
                                  href={toBdWhatsApp(
                                    o.customerPhone,
                                    `আসসালামু আলাইকুম ${o.customerName}, we received your cancellation request for Noksha order ${o.id}.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-[#1B5E55] hover:bg-[#144740] text-white text-[12px] font-bold inline-flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  WhatsApp
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Approve cancellation for order ${o.id} and restore stock?`)) {
                                      postAction(
                                        { action: "resolve_cancellation", id: o.id, decision: "approve" },
                                        `Approved cancellation for ${o.id}`
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#8C2F2F] hover:bg-[#702222] text-white text-[12px] font-bold cursor-pointer"
                                >
                                  Approve &amp; Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    postAction(
                                      { action: "resolve_cancellation", id: o.id, decision: "dismiss" },
                                      `Dismissed cancellation request for ${o.id}`
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#EFE7DA] hover:bg-[#E2D5C1] text-[#14110F] border border-[#B8A68E] text-[12px] font-bold cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {cancelledHistory.length > 0 && (
                    <div className={`${cardCls} overflow-hidden`}>
                      <div className="px-5 py-3.5 bg-[#EFE7DA] border-b border-[#D4C5B0]">
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#14110F]">
                          Cancelled Orders History ({cancelledHistory.length})
                        </h3>
                      </div>
                      <table className="w-full text-[13px] text-left border-collapse">
                        <thead>
                          <tr>
                            <th className={thCls}>Order</th>
                            <th className={thCls}>Customer</th>
                            <th className={thCls}>Total</th>
                            <th className={thCls}>Reason</th>
                            <th className={thCls}>Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6DDD0]">
                          {cancelledHistory.map((o) => (
                            <tr key={o.id} className="hover:bg-[#FBF8F3]">
                              <td className="py-3 px-4 font-num font-bold text-[#14110F]">{o.id}</td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-[#14110F]">{o.customerName}</span> ·{" "}
                                <span className="font-num text-[#2D2620]">{o.customerPhone}</span>
                              </td>
                              <td className="py-3 px-4 font-num font-bold text-[#14110F]">
                                {formatBDT(o.totalBDT)}
                              </td>
                              <td className="py-3 px-4 text-[#2D2620]">
                                {o.cancellationReason || "Cancelled by staff"}
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status="cancelled" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ───────────────────────── TAB 3B: EXCLUSIVE DROPS (COLLECTIONS) & STORE CATEGORIES ───────────────────────── */}
        {activeTab === "collections" && (
          <div className="space-y-10">
            {/* PART A: EXCLUSIVE COLLECTION DROPS (Drop 01, Drop 02, Drop 03...) */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#14110F]">
                    1. Exclusive Collections &amp; Numbered Drops (1-of-1 Pieces)
                  </h2>
                  <p className="text-[13px] text-[#1E1915] font-medium mt-0.5">
                    Every Collection is an exclusive Drop (<span className="font-num">Drop 01, Drop 02, Drop 03</span>, etc.) where all pieces are strictly <span className="font-num">1 of 1</span>. Control when each Drop is Upcoming, Open for Pre-Booking, or Live.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCollection({
                      ...EMPTY_COLLECTION,
                      dropNumber: `Drop 0${data.collections.length + 1}`,
                      shortName: `Drop 0${data.collections.length + 1}`,
                      sortOrder: data.collections.length + 1,
                    })
                  }
                  className="px-4 py-2.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#D8BF90]" />
                  Create New Exclusive Drop
                </button>
              </div>

              {editingCollection && (
                <div className="bg-white border-2 border-[#B08A4F] rounded-xl p-6 space-y-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                    <h3 className="text-base font-bold text-[#1E1915]">
                      {editingCollection.id
                        ? `Edit Exclusive Drop: ${editingCollection.dropNumber || editingCollection.shortName} — ${editingCollection.title}`
                        : "Create New Exclusive Drop Collection"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingCollection(null)}
                      className="p-1 text-[#1E1915] hover:opacity-70 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Drop Number (e.g. Drop 01, Drop 02, Drop 03) *
                      </label>
                      <input
                        type="text"
                        value={editingCollection.dropNumber || editingCollection.shortName || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            dropNumber: e.target.value,
                            shortName: e.target.value,
                          })
                        }
                        placeholder="e.g. Drop 04"
                        className={`${inputCls} font-num`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Collection / Drop Title *
                      </label>
                      <input
                        type="text"
                        value={editingCollection.title || ""}
                        onChange={(e) =>
                          setEditingCollection({ ...editingCollection, title: e.target.value })
                        }
                        placeholder="e.g. Winter Nakshi & Brass Collector Drop"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Bengali Title (বাংলা নাম) *
                      </label>
                      <input
                        type="text"
                        value={editingCollection.bengaliTitle || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            bengaliTitle: e.target.value,
                          })
                        }
                        placeholder="e.g. ড্রপ ০৪ — শীতের নকশা"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Drop Release Stage / Availability Control *
                      </label>
                      <select
                        value={editingCollection.dropStatus || "live"}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            dropStatus: e.target.value as DropStatus,
                          })
                        }
                        className={inputCls}
                      >
                        <option value="upcoming">Upcoming Preview (Not Yet Open)</option>
                        <option value="prebooking">Open for Pre-Booking (Reservation Only)</option>
                        <option value="live">Live Drop (Open to Acquire Immediately)</option>
                        <option value="archived">Archived Drop (Completed Release)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Release Date / Timing Label
                      </label>
                      <input
                        type="text"
                        value={editingCollection.releaseDate || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            releaseDate: e.target.value,
                          })
                        }
                        placeholder="e.g. Live Now / Pre-Booking Open / Dec 15, 2026"
                        className={`${inputCls} font-num`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Poetic Subtitle
                      </label>
                      <input
                        type="text"
                        value={editingCollection.subtitle || ""}
                        onChange={(e) =>
                          setEditingCollection({ ...editingCollection, subtitle: e.target.value })
                        }
                        placeholder="e.g. One-of-One Collector Pieces"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Making Time Metric
                      </label>
                      <input
                        type="text"
                        value={editingCollection.craftMetric || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            craftMetric: e.target.value,
                          })
                        }
                        placeholder="e.g. 90–280 Hours Hand-Stitched & Carved"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Price Range (BDT ৳)
                      </label>
                      <input
                        type="text"
                        value={editingCollection.priceRange || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            priceRange: e.target.value,
                          })
                        }
                        placeholder="e.g. ৳ 6,800 – ৳ 19,500"
                        className={`${inputCls} font-num`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#2A1F18] mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={editingCollection.sortOrder ?? 1}
                          onChange={(e) =>
                            setEditingCollection({
                              ...editingCollection,
                              sortOrder: Number(e.target.value),
                            })
                          }
                          className={`${inputCls} font-num`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#2A1F18] mb-1">Accent Hex</label>
                        <input
                          type="text"
                          value={editingCollection.accentHex || "#B08A4F"}
                          onChange={(e) =>
                            setEditingCollection({
                              ...editingCollection,
                              accentHex: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner & Hero Image Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FBF8F3] p-4 rounded-xl border border-[#DED3C2] text-[13px]">
                    <div className="flex items-start gap-3">
                      <img
                        src={editingCollection.heroImage || "/images/hero-courtyard.png"}
                        alt="Card Preview"
                        className="w-20 h-24 object-cover rounded border border-[#C9B9A3] shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <label className="block font-bold text-[#2A1F18]">
                          Drop Card Image (4:5 Portrait)
                        </label>
                        <input
                          type="text"
                          value={editingCollection.heroImage || ""}
                          onChange={(e) =>
                            setEditingCollection({
                              ...editingCollection,
                              heroImage: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] cursor-pointer text-xs font-bold">
                          <Upload className="w-3.5 h-3.5 text-[#D8BF90]" />
                          {uploadingImg ? "Uploading…" : "Upload Card Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCollectionImageUpload(e, "heroImage")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <img
                        src={
                          editingCollection.bannerImage ||
                          editingCollection.heroImage ||
                          "/images/hero-courtyard.png"
                        }
                        alt="Banner Preview"
                        className="w-28 h-20 object-cover rounded border border-[#C9B9A3] shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <label className="block font-bold text-[#2A1F18]">
                          Full-Bleed Drop Banner Image
                        </label>
                        <input
                          type="text"
                          value={editingCollection.bannerImage || ""}
                          onChange={(e) =>
                            setEditingCollection({
                              ...editingCollection,
                              bannerImage: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] cursor-pointer text-xs font-bold">
                          <Upload className="w-3.5 h-3.5 text-[#D8BF90]" />
                          {uploadingImg ? "Uploading…" : "Upload Banner Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCollectionImageUpload(e, "bannerImage")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Summary Description & Full Collection Story */}
                  <div className="space-y-4 text-[13px]">
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Homepage Summary Description (1–2 sentences)
                      </label>
                      <textarea
                        rows={2}
                        value={editingCollection.description || ""}
                        onChange={(e) =>
                          setEditingCollection({
                            ...editingCollection,
                            description: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Dedicated Drop Page Story (Separate paragraphs with a blank line)
                      </label>
                      <textarea
                        rows={4}
                        value={editingCollection.story || ""}
                        onChange={(e) =>
                          setEditingCollection({ ...editingCollection, story: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                      <input
                        type="checkbox"
                        checked={editingCollection.active !== false}
                        onChange={(e) =>
                          setEditingCollection({ ...editingCollection, active: e.target.checked })
                        }
                        className="accent-[#2A1F18] w-4 h-4"
                      />
                      <span className="font-bold text-[#1E1915]">Visible on Storefront</span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingCollection(null)}
                        className="px-4 py-2 rounded-lg bg-[#F4EDE1] text-[#2A1F18] border border-[#C9B9A3] text-[13px] font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await postAction(
                            { action: "save_collection", collection: editingCollection },
                            `Saved drop "${editingCollection.dropNumber} — ${editingCollection.title}"`
                          );
                          if (ok) setEditingCollection(null);
                        }}
                        className="px-5 py-2 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold cursor-pointer"
                      >
                        Save Drop Collection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Collections (Exclusive Drops) Table */}
              <div className={`${cardCls} overflow-hidden`}>
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Drop</th>
                      <th className={thCls}>Collection Title &amp; Page</th>
                      <th className={thCls}>1-of-1 Pieces</th>
                      <th className={thCls}>Live Drop Control (Pre-Booking / Live)</th>
                      <th className={thCls}>Release Timing</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDD0]">
                    {data.collections.map((col) => {
                      const pieceCount = data.products.filter(
                        (p) => p.collectionId === col.id
                      ).length;
                      return (
                        <tr key={col.id} className="hover:bg-[#FBF8F3]">
                          <td className="py-3.5 px-4 font-num font-bold text-[#14110F]">
                            <span className="px-2.5 py-1 rounded bg-[#2A1F18] text-white text-[12px]">
                              {col.dropNumber || col.shortName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <img
                              src={col.heroImage}
                              alt={col.title}
                              className="w-12 h-14 rounded object-cover shrink-0 border border-[#C9B9A3]"
                            />
                            <div>
                              <p className="font-bold text-[#14110F]">{col.title}</p>
                              <p className="text-[#1E1915] font-medium">{col.bengaliTitle}</p>
                              <p className="font-mono text-[11px] font-bold text-[#7A5417]">
                                /collections/{col.id}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-num font-bold text-[#14110F]">
                            {pieceCount} {pieceCount === 1 ? "piece (1 of 1)" : "pieces (1 of 1)"}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={col.dropStatus || "live"}
                              onChange={(e) =>
                                postAction(
                                  {
                                    action: "save_collection",
                                    collection: {
                                      ...col,
                                      dropStatus: e.target.value as DropStatus,
                                    },
                                  },
                                  `Updated ${col.dropNumber} status to ${e.target.value}`
                                )
                              }
                              className="px-3 py-1.5 bg-white border border-[#B8A68E] rounded-lg text-[12.5px] font-bold text-[#14110F] cursor-pointer"
                            >
                              <option value="upcoming">Upcoming Preview</option>
                              <option value="prebooking">Open for Pre-Booking</option>
                              <option value="live">Live Drop (Open to Acquire)</option>
                              <option value="archived">Archived Drop</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 font-num text-[#1E1915] font-medium">
                            {col.releaseDate || "Live Now"}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <Link
                              href={`/collections/${col.id}`}
                              target="_blank"
                              className="px-3 py-1.5 rounded-lg bg-[#EFE7DA] hover:bg-[#E2D5C1] text-[#14110F] border border-[#B8A68E] font-bold inline-flex items-center gap-1"
                            >
                              Drop Page <ExternalLink className="w-3 h-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setEditingCollection(col)}
                              className="px-3 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold cursor-pointer"
                            >
                              Edit Drop
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete collection "${col.title}"? (${pieceCount} pieces will become regular store products)`
                                  )
                                ) {
                                  postAction(
                                    { action: "delete_collection", id: col.id },
                                    `Deleted collection ${col.title}`
                                  );
                                }
                              }}
                              className="p-1.5 rounded-lg bg-[#FCECEC] hover:bg-[#F7D6D6] text-[#8C2F2F] border border-[#E5B8B8] cursor-pointer inline-flex items-center"
                              title="Delete collection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PART B: STORE PRODUCT CATEGORIES (Light Shades, Nakshi Kanthas, Wooden Jewelry Boxes, etc.) */}
            <div className="space-y-5 border-t-2 border-[#D4C5B0] pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#14110F]">
                    2. Store Product Categories (Regular Multi-Stock &amp; Collection Filter Tabs)
                  </h2>
                  <p className="text-[13px] text-[#1E1915] font-medium mt-0.5">
                    Manage product categories like <strong>Light Shades</strong>, <strong>Nakshi Kanthas</strong>, and <strong>Wooden Jewelry Boxes</strong>. Both regular store products (multi-stock) and exclusive Drop products appear under their category in the store.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCategory({
                      ...EMPTY_CATEGORY,
                      sortOrder: (data.categories?.length ?? 3) + 1,
                    })
                  }
                  className="px-4 py-2.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#D8BF90]" />
                  Add New Category
                </button>
              </div>

              {editingCategory && (
                <div className="bg-white border-2 border-[#B08A4F] rounded-xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                    <h3 className="text-base font-bold text-[#14110F]">
                      {editingCategory.id
                        ? `Edit Category: ${editingCategory.name}`
                        : "Create New Store Category"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="p-1 text-[#14110F] hover:opacity-70 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[13px]">
                    <div>
                      <label className="block font-bold text-[#14110F] mb-1">
                        Category Name (e.g. Light Shades) *
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name || ""}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, name: e.target.value })
                        }
                        placeholder="e.g. Terracotta Vessels"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#14110F] mb-1">
                        Short Heritage Label (e.g. Alo, Kantha, Boxes)
                      </label>
                      <input
                        type="text"
                        value={editingCategory.shortName || ""}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, shortName: e.target.value })
                        }
                        placeholder="e.g. Mrittika"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#14110F] mb-1">
                        Bengali Name (বাংলা নাম)
                      </label>
                      <input
                        type="text"
                        value={editingCategory.bengaliName || ""}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, bengaliName: e.target.value })
                        }
                        placeholder="e.g. মৃত্তিকা — পোড়ামাটির পাত্র"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#14110F] mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={editingCategory.sortOrder ?? 1}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            sortOrder: Number(e.target.value),
                          })
                        }
                        className={`${inputCls} font-num`}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block font-bold text-[#14110F] mb-1">
                        Category Subtitle
                      </label>
                      <input
                        type="text"
                        value={editingCategory.subtitle || ""}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, subtitle: e.target.value })
                        }
                        placeholder="Short description of this product category"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 rounded-lg bg-[#EFE7DA] text-[#14110F] border border-[#B8A68E] text-[13px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await postAction(
                          { action: "save_category", category: editingCategory },
                          `Saved category "${editingCategory.name}"`
                        );
                        if (ok) setEditingCategory(null);
                      }}
                      className="px-5 py-2 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-white text-[13px] font-bold cursor-pointer"
                    >
                      Save Category
                    </button>
                  </div>
                </div>
              )}

              <div className={`${cardCls} overflow-hidden`}>
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Order</th>
                      <th className={thCls}>Category Name</th>
                      <th className={thCls}>Bengali Name &amp; Subtitle</th>
                      <th className={thCls}>Regular Store Pieces</th>
                      <th className={thCls}>1-of-1 Drop Pieces</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDD0]">
                    {(data.categories || []).map((cat) => {
                      const catProducts = data.products.filter((p) => p.category === cat.id);
                      const storeCount = catProducts.filter((p) => !p.collectionId).length;
                      const dropCount = catProducts.filter((p) => Boolean(p.collectionId)).length;
                      return (
                        <tr key={cat.id} className="hover:bg-[#FBF8F3]">
                          <td className="py-3.5 px-4 font-num font-bold text-[#14110F]">
                            #{cat.sortOrder}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#14110F]">
                              {cat.name}{" "}
                              <span className="text-[#7A5417]">({cat.shortName})</span>
                            </p>
                            <p className="font-mono text-[11px] text-[#2D2620]">id: {cat.id}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#14110F]">{cat.bengaliName}</p>
                            <p className="text-[#2D2620] line-clamp-1">{cat.subtitle}</p>
                          </td>
                          <td className="py-3.5 px-4 font-num font-bold text-[#144740]">
                            {storeCount} multi-stock {storeCount === 1 ? "piece" : "pieces"}
                          </td>
                          <td className="py-3.5 px-4 font-num font-bold text-[#7A5417]">
                            {dropCount} exclusive drop {dropCount === 1 ? "piece" : "pieces"}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(cat)}
                              className="px-3 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-white font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete category "${cat.name}"?`)) {
                                  postAction(
                                    { action: "delete_category", id: cat.id },
                                    `Deleted category ${cat.name}`
                                  );
                                }
                              }}
                              className="p-1.5 rounded-lg bg-[#FCECEC] hover:bg-[#F7D6D6] text-[#8C2F2F] border border-[#E5B8B8] cursor-pointer inline-flex items-center"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 4: PRODUCTS, INVENTORY & IMAGES ───────────────────────── */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[13px] text-[#14110F] font-medium">
                Add <strong>Regular Store Products</strong> (multi-stock items under a Category) or <strong>Exclusive Collection Drop Pieces</strong> (<span className="font-num">1 of 1</span> items tagged with their Drop &amp; collector name upon delivery).
              </p>
              <button
                type="button"
                onClick={() => setEditingProduct({ ...EMPTY_PRODUCT })}
                className="px-4 py-2.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#D8BF90]" />
                Add New Product
              </button>
            </div>

            {/* Product Editor Modal / Panel */}
            {editingProduct && (
              <div className="bg-white border-2 border-[#B08A4F] rounded-xl p-6 space-y-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                  <h2 className="text-base font-bold text-[#14110F]">
                    {editingProduct.id
                      ? `Edit Product: ${editingProduct.name}`
                      : "Add New Product (Regular Store or Exclusive Drop Piece)"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="p-1 text-[#14110F] hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">English Title *</label>
                    <input
                      type="text"
                      value={editingProduct.name || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      Bengali Title (বাংলা নাম)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.bengaliName || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, bengaliName: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      Store Category (Light Shades, Kanthas, Jewelry Boxes…) *
                    </label>
                    <select
                      value={editingProduct.category || "light-shades"}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as PillarId,
                        })
                      }
                      className={inputCls}
                    >
                      {(data.categories || []).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Collection / Drop Assignment */}
                  <div className="md:col-span-2">
                    <label className="block font-bold text-[#14110F] mb-1">
                      Product Type: Regular Multi-Stock Store vs. Exclusive Collection Drop (1 of 1) *
                    </label>
                    <select
                      value={editingProduct.collectionId || ""}
                      onChange={(e) => {
                        const colId = e.target.value;
                        const isDrop = Boolean(colId);
                        setEditingProduct({
                          ...editingProduct,
                          collectionId: colId,
                          stockQty: isDrop
                            ? editingProduct.status === "sold"
                              ? 0
                              : 1
                            : Math.max(1, editingProduct.stockQty || 8),
                          statusLabel: isDrop
                            ? editingProduct.status === "sold"
                              ? "Acquired"
                              : "One of One"
                            : "In Stock",
                        });
                      }}
                      className={inputCls}
                    >
                      <option value="">
                        Regular Store Product (Multi-Stock in The Pieces / Store — Outside Any Drop)
                      </option>
                      {data.collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          Exclusive Collection: {c.dropNumber || c.shortName} — {c.title} (Strictly 1 of 1 · {c.dropStatus?.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">SKU</label>
                    <input
                      type="text"
                      value={editingProduct.sku || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      placeholder="e.g. NK-STD-009"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      Selling Price (BDT ৳) *
                    </label>
                    <input
                      type="number"
                      value={editingProduct.priceBDT ?? 0}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, priceBDT: Number(e.target.value) })
                      }
                      className={`${inputCls} font-num`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      Unit Cost (BDT ৳ for Profit Calc)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.costBDT ?? 0}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, costBDT: Number(e.target.value) })
                      }
                      className={`${inputCls} font-num`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">Artisan Hours</label>
                    <input
                      type="number"
                      value={editingProduct.artisanHours ?? 40}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          artisanHours: Number(e.target.value),
                          artisanHoursLabel: `${e.target.value} Hours Handcrafted`,
                        })
                      }
                      className={`${inputCls} font-num`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      Availability Status
                    </label>
                    <select
                      value={editingProduct.status || "ready"}
                      onChange={(e) => {
                        const nextSt = e.target.value as ProductStatus;
                        const isDrop = Boolean(editingProduct.collectionId);
                        setEditingProduct({
                          ...editingProduct,
                          status: nextSt,
                          stockQty:
                            nextSt === "sold"
                              ? 0
                              : isDrop
                              ? 1
                              : Math.max(1, editingProduct.stockQty ?? 8),
                        });
                      }}
                      className={inputCls}
                    >
                      <option value="ready">
                        {editingProduct.collectionId
                          ? "Available (1 of 1 in Drop)"
                          : "In Stock (Ready to Ship)"}
                      </option>
                      {!editingProduct.collectionId && (
                        <option value="limited">Low Stock Alert</option>
                      )}
                      <option value="waitlist">Pre-Booking / Reservation</option>
                      <option value="sold">
                        {editingProduct.collectionId
                          ? "Acquired (1-of-1 Collector Archive)"
                          : "Sold Out (0 in Stock)"}
                      </option>
                      <option value="hidden">Hidden (Draft)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      {editingProduct.collectionId
                        ? "Stock Qty (Locked to 1 of 1 for Collection Drop)"
                        : "Store Stock Quantity (Multiple Pieces) *"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={Boolean(editingProduct.collectionId)}
                      value={
                        editingProduct.collectionId
                          ? editingProduct.status === "sold"
                            ? 0
                            : 1
                          : editingProduct.stockQty ?? 8
                      }
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, stockQty: Number(e.target.value) })
                      }
                      className={`${inputCls} font-num disabled:opacity-65 disabled:bg-[#EFE7DA]`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">
                      {editingProduct.collectionId
                        ? "Acquired By (Customer Name when Delivered)"
                        : "Low Stock Alert Threshold"}
                    </label>
                    {editingProduct.collectionId ? (
                      <input
                        type="text"
                        value={editingProduct.acquiredBy || ""}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, acquiredBy: e.target.value })
                        }
                        placeholder="Auto-filled when order is Delivered (e.g. Farhana Chowdhury)"
                        className={inputCls}
                      />
                    ) : (
                      <input
                        type="number"
                        min={1}
                        value={editingProduct.lowStockThreshold ?? 2}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            lowStockThreshold: Number(e.target.value),
                          })
                        }
                        className={`${inputCls} font-num`}
                      />
                    )}
                  </div>
                </div>

                {/* Image Upload & Path */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#FBF8F3] p-4 rounded-xl border border-[#DED3C2] text-[13px]">
                  <div className="md:col-span-2">
                    <img
                      src={editingProduct.image || "/images/hero-courtyard.png"}
                      alt="Preview"
                      className="w-20 h-24 object-cover rounded border border-[#C9B9A3]"
                    />
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <label className="block font-bold text-[#14110F]">Image Path or URL</label>
                    <input
                      type="text"
                      value={editingProduct.image || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, image: e.target.value })
                      }
                      className={inputCls}
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "/images/light-jamdani-pendant.png",
                        "/images/light-terracotta-jali.png",
                        "/images/kantha-crimson-padma.png",
                        "/images/kantha-peacock-emerald.png",
                        "/images/box-teak-brass.png",
                        "/images/box-rosewood-alpona.png",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image: preset })}
                          className="px-2 py-1 rounded bg-[#F4EDE1] hover:bg-[#E8DEC9] text-[10px] font-bold text-[#2A1F18] border border-[#C9B9A3] cursor-pointer"
                        >
                          {preset.replace("/images/", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block font-bold text-[#14110F] mb-1.5">
                      Or Upload New Photo From Computer
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] cursor-pointer font-bold">
                      <Upload className="w-4 h-4 text-[#D8BF90]" />
                      {uploadingImg ? "Uploading…" : "Choose Image File"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Story, Materials, Dimensions, Care */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-[#14110F] mb-1">
                      Piece Story
                    </label>
                    <textarea
                      rows={3}
                      value={editingProduct.story || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, story: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">Materials</label>
                    <input
                      type="text"
                      value={editingProduct.materials || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, materials: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14110F] mb-1">Dimensions</label>
                    <input
                      type="text"
                      value={editingProduct.dimensions || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-[#14110F] mb-1">Care Instructions</label>
                    <input
                      type="text"
                      value={editingProduct.care || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, care: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-lg bg-[#F4EDE1] text-[#2A1F18] border border-[#C9B9A3] text-[13px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await postAction(
                        { action: "save_product", product: editingProduct },
                        `Saved "${editingProduct.name}"`
                      );
                      if (ok) setEditingProduct(null);
                    }}
                    className="px-5 py-2 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold cursor-pointer"
                  >
                    Save Piece to Catalog
                  </button>
                </div>
              </div>
            )}

            {/* Catalog Table */}
            <div className={`${cardCls} overflow-hidden`}>
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Piece</th>
                    <th className={thCls}>Store Category</th>
                    <th className={thCls}>Collection / Drop Tag</th>
                    <th className={thCls}>Price / Cost</th>
                    <th className={thCls}>Stock / Collector</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {data.products.map((p) => {
                    const catObj = (data.categories || []).find((c) => c.id === p.category);
                    const isCollectionPiece = Boolean(p.collectionId && p.collectionId.trim() !== "");
                    return (
                      <tr key={p.id} className="hover:bg-[#FBF8F3]">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-14 rounded object-cover shrink-0 border border-[#C9B9A3]"
                          />
                          <div>
                            <p className="font-bold text-[#14110F]">{p.name}</p>
                            <p className="text-[#1E1915] font-medium">{p.bengaliName}</p>
                            <p className="font-mono text-[10px] font-bold text-[#7A5417]">{p.sku}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#14110F]">
                          {catObj ? `${catObj.name} (${catObj.shortName})` : p.category}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCollectionPiece ? (
                            <span className="inline-block px-2.5 py-1 rounded bg-[#2A1F18] text-white text-[11px] font-bold">
                              <span className="font-num">{p.dropNumber || "Drop"}</span> · 1 of 1
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded bg-[#EFE7DA] text-[#14110F] border border-[#B8A68E] text-[11px] font-bold">
                              Regular Store (Multi-Stock)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-num">
                          <p className="font-bold text-[#14110F]">{formatBDT(p.priceBDT)}</p>
                          <p className="text-[#1E1915] font-medium">Cost: {formatBDT(p.costBDT)}</p>
                        </td>
                        <td className="py-3.5 px-4 font-num">
                          {isCollectionPiece ? (
                            <div>
                              <span className="px-2 py-0.5 rounded bg-[#FDF3E1] text-[#6B4710] border border-[#DEC07A] text-[11px] font-bold">
                                1 of 1 ({p.status === "sold" ? "Acquired" : "Available"})
                              </span>
                              {p.acquiredBy && (
                                <p className="text-[11.5px] font-bold text-[#144740] mt-1">
                                  Acquired by {p.acquiredBy}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="font-bold text-[#14110F]">
                              {p.stockQty} units in stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge
                            status={
                              p.status === "sold"
                                ? isCollectionPiece
                                  ? "acquired"
                                  : "sold_out"
                                : p.status
                            }
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="px-3 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          {p.status !== "sold" && (
                            <button
                              type="button"
                              onClick={() => {
                                const collector = isCollectionPiece
                                  ? prompt(
                                      "Enter collector/customer name (or leave blank if not yet delivered):",
                                      p.acquiredBy || ""
                                    ) ?? ""
                                  : "";
                                postAction(
                                  {
                                    action: "save_product",
                                    product: {
                                      ...p,
                                      status: "sold",
                                      statusLabel: isCollectionPiece ? "Acquired" : "Sold Out",
                                      stockQty: 0,
                                      acquiredBy: collector,
                                    },
                                  },
                                  isCollectionPiece
                                    ? `Marked "${p.name}" as Acquired${collector ? ` by ${collector}` : ""}`
                                    : `Marked "${p.name}" as Sold Out`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#F4EDE1] hover:bg-[#E8DEC9] text-[#6B4710] border border-[#C9B9A3] font-bold cursor-pointer"
                            >
                              {isCollectionPiece ? "Mark Acquired" : "Mark Sold Out"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete "${p.name}" from catalog?`)) {
                                postAction(
                                  { action: "delete_product", id: p.id },
                                  `Deleted ${p.name}`
                                );
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#FCECEC] hover:bg-[#F7D6D6] text-[#8C2F2F] border border-[#E5B8B8] cursor-pointer inline-flex items-center"
                            title="Delete piece"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 5: CUSTOMERS CRM ───────────────────────── */}
        {activeTab === "customers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-7 ${cardCls} overflow-hidden`}>
              <div className="p-4 border-b border-[#DED3C2] bg-[#FBF8F3] flex items-center justify-between">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915]">
                  Collector CRM Directory ({data.customers.length})
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      "noksha-customers-crm.csv",
                      ["Name", "Phone", "Email", "District", "Orders", "Lifetime Value BDT", "VIP", "Tags", "Notes"],
                      data.customers.map((c) => [
                        c.name,
                        c.phone,
                        c.email,
                        c.district,
                        c.ordersCount,
                        c.totalSpentBDT,
                        c.vip ? "Yes" : "No",
                        c.tags,
                        c.notes,
                      ])
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CRM CSV
                </button>
              </div>
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Collector</th>
                    <th className={thCls}>District</th>
                    <th className={thCls}>Orders</th>
                    <th className={thCls}>Lifetime Value</th>
                    <th className={thCls}>Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {data.customers.map((c) => (
                    <tr
                      key={c.phone}
                      onClick={() => openCustomerInspector(c)}
                      className={`cursor-pointer hover:bg-[#FBF8F3] ${
                        selectedCustomer?.phone === c.phone ? "bg-[#F4EDE1]" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E1915]">{c.name}</span>
                          {c.vip && (
                            <span className="px-1.5 py-0.5 rounded bg-[#B08A4F] text-white text-[10px] font-bold">
                              VIP
                            </span>
                          )}
                          {c.ordersCount > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#E6F3F0] text-[#1B5E55] border border-[#A3D4C9] text-[10px] font-bold">
                              Repeat
                            </span>
                          )}
                        </div>
                        <p className="font-num text-[#1E1915] font-medium">{c.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1E1915]">{c.district}</td>
                      <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                        {c.ordersCount}
                      </td>
                      <td className="py-3.5 px-4 font-num font-bold text-[#1B5E55]">
                        {formatBDT(c.totalSpentBDT)}
                      </td>
                      <td className="py-3.5 px-4 text-[#1E1915] font-medium">{c.tags}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Customer CRM Profile Editor */}
            <div className={`lg:col-span-5 ${cardCls} p-5 space-y-4`}>
              {!selectedCustomer ? (
                <p className="text-[13px] text-[#1E1915] font-medium py-10 text-center">
                  Select any customer to view their order history, lifetime spend, VIP status, and CRM notes.
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between border-b border-[#E6DDD0] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1E1915]">{selectedCustomer.name}</h3>
                      <p className="font-num text-[13px] font-bold text-[#8C6528]">
                        {selectedCustomer.phone}
                      </p>
                      <p className="text-[13px] text-[#1E1915] font-medium">
                        {selectedCustomer.address}, {selectedCustomer.district}
                      </p>
                    </div>
                    <a
                      href={toBdWhatsApp(
                        selectedCustomer.phone,
                        `আসসালামু আলাইকুম ${selectedCustomer.name}, warm greetings from Noksha (নকশা)!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#1B5E55] hover:bg-[#144740] text-white text-[13px] font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div className="p-3 rounded-lg bg-[#FBF8F3] border border-[#DED3C2]">
                      <p className="text-[#1E1915] font-semibold">Lifetime Value</p>
                      <p className="font-num text-lg font-bold text-[#1B5E55]">
                        {formatBDT(selectedCustomer.totalSpentBDT)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FBF8F3] border border-[#DED3C2]">
                      <p className="text-[#1E1915] font-semibold">Orders Placed</p>
                      <p className="font-num text-lg font-bold text-[#1E1915]">
                        {selectedCustomer.ordersCount} ({selectedCustomer.orderIds.join(", ")})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-[13px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={custVipDraft}
                        onChange={(e) => setCustVipDraft(e.target.checked)}
                        className="accent-[#2A1F18] w-4 h-4"
                      />
                      <span className="font-bold text-[#2A1F18]">Mark as VIP Collector</span>
                    </label>

                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">CRM Segment Tags</label>
                      <input
                        type="text"
                        value={custTagsDraft}
                        onChange={(e) => setCustTagsDraft(e.target.value)}
                        placeholder="e.g. VIP, Kantha Collector, Bridal"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2A1F18] mb-1">
                        Collector Preferences &amp; Notes
                      </label>
                      <textarea
                        rows={3}
                        value={custNotesDraft}
                        onChange={(e) => setCustNotesDraft(e.target.value)}
                        placeholder="Preferred colors, gifting dates, delivery instructions…"
                        className={inputCls}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        postAction(
                          {
                            action: "save_customer_note",
                            phone: selectedCustomer.phone,
                            tags: custTagsDraft,
                            notes: custNotesDraft,
                            vip: custVipDraft,
                          },
                          `Updated CRM profile for ${selectedCustomer.name}`
                        )
                      }
                      className="w-full py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold rounded-lg cursor-pointer"
                    >
                      Save CRM Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 6: ABANDONED CHECKOUTS ───────────────────────── */}
        {activeTab === "abandoned" && (
          <div className={`${cardCls} overflow-hidden`}>
            <div className="p-5 border-b border-[#DED3C2] bg-[#FBF8F3]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E1915]">
                Abandoned Checkouts &amp; Drop-Off Recovery
              </h2>
              <p className="text-[13px] text-[#1E1915] font-medium mt-0.5">
                Tracks visitors who opened checkout or started filling their details, showing the exact step where they stopped and a 1-click WhatsApp recovery link.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Visitor / Contact</th>
                    <th className={thCls}>Last Step Reached Before Exit</th>
                    <th className={thCls}>Pieces in Bag</th>
                    <th className={thCls}>Bag Value</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Recovery Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {data.abandonedCheckouts.map((a) => (
                    <tr key={a.sessionId} className="hover:bg-[#FBF8F3]">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1E1915]">
                          {a.customerName || `Visitor ${a.visitorId.slice(0, 10)}`}
                        </p>
                        <p className="font-num text-[#1E1915] font-medium">
                          {a.customerPhone || "No phone entered yet"} · {a.district}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded bg-[#FCECEC] text-[#8C2F2F] border border-[#E5B8B8] font-mono font-bold text-[11px]">
                          {a.lastStep}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {a.items.map((i, idx) => (
                          <p key={idx} className="text-[#1E1915] font-medium">
                            • {i.name} × <span className="font-num">{i.quantity}</span>
                          </p>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                        {formatBDT(a.subtotalBDT)}
                      </td>
                      <td className="py-3.5 px-4">
                        {a.recovered ? (
                          <span className="text-[#1B5E55] font-bold">Recovered ✓</span>
                        ) : (
                          <span className="text-[#7A5417] font-bold">Unrecovered</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {a.customerPhone ? (
                          <a
                            href={toBdWhatsApp(
                              a.customerPhone,
                              `আসসালামু আলাইকুম ${a.customerName || ""}, we noticed you were inspecting ${
                                a.items[0]?.name || "a Noksha piece"
                              }. Let us know if we can assist with your order or apply your 10% courtesy code SHUVO10!`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B5E55] hover:bg-[#144740] text-white font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Recover via WhatsApp
                          </a>
                        ) : (
                          <span className="text-[#1E1915] font-medium">Exited before phone step</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 7: WAITLIST, FOUNDING CIRCLE & LEADS ───────────────────────── */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className={`flex flex-wrap items-center justify-between gap-4 ${cardCls} p-4`}>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Leads" },
                  { id: "waitlist", label: "Batch #02 Piece Reservations" },
                  { id: "founding_circle", label: "Founding Circle Members" },
                  { id: "newsletter", label: "Newsletter Subscribers" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLeadFilter(t.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold cursor-pointer ${
                      leadFilter === t.id
                        ? "bg-[#2A1F18] text-[#FBF8F3]"
                        : "bg-[#F4EDE1] text-[#2A1F18] hover:bg-[#E8DEC9]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    "noksha-leads.csv",
                    ["ID", "Type", "Name", "Phone", "Email", "Piece / Membership", "Status", "Notes", "Date"],
                    data.leads.map((l) => [
                      l.id,
                      l.type,
                      l.name,
                      l.phone,
                      l.email,
                      l.product_name,
                      l.status,
                      l.notes,
                      l.created_at,
                    ])
                  )
                }
                className="px-3.5 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Leads CSV
              </button>
            </div>

            <div className={`${cardCls} overflow-hidden`}>
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Type</th>
                    <th className={thCls}>Contact</th>
                    <th className={thCls}>Piece / Circle No.</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Date</th>
                    <th className={`${thCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {data.leads
                    .filter((l) => leadFilter === "all" || l.type === leadFilter)
                    .map((l) => (
                      <tr key={l.id} className="hover:bg-[#FBF8F3]">
                        <td className="py-3.5 px-4 uppercase font-bold text-[#8C6528]">
                          {l.type.replace("_", " ")}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1E1915]">{l.name || "—"}</p>
                          <p className="font-num text-[#1E1915] font-medium">
                            {l.phone} {l.email ? `· ${l.email}` : ""}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1E1915]">{l.product_name}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={l.status}
                            onChange={(e) =>
                              postAction(
                                {
                                  action: "update_lead",
                                  id: l.id,
                                  status: e.target.value,
                                  notes: l.notes,
                                },
                                "Lead status updated"
                              )
                            }
                            className="px-2.5 py-1 bg-white border border-[#C9B9A3] rounded text-[13px] uppercase font-bold text-[#1E1915]"
                          >
                            <option value="new">new</option>
                            <option value="contacted">contacted</option>
                            <option value="converted">converted</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 font-num text-[#1E1915] font-medium">
                          {new Date(l.created_at).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {l.phone && (
                            <a
                              href={toBdWhatsApp(
                                l.phone,
                                `আসসালামু আলাইকুম ${l.name}, thank you for reserving "${l.product_name}" with Noksha!`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1B5E55] hover:bg-[#144740] text-white font-bold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 8: PROMO CODES MANAGER ───────────────────────── */}
        {activeTab === "promos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-5 ${cardCls} p-5 space-y-4`}>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915] border-b border-[#E6DDD0] pb-2.5">
                Create or Update Courtesy / Promo Code
              </h2>
              <div className="space-y-3 text-[13px]">
                <div>
                  <label className="block font-bold text-[#2A1F18] mb-1">Code (Uppercase) *</label>
                  <input
                    type="text"
                    value={promoCodeDraft}
                    onChange={(e) => setPromoCodeDraft(e.target.value.toUpperCase())}
                    placeholder="e.g. EID20 or SHUVO10"
                    className={`${inputCls} uppercase font-mono`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2A1F18] mb-1">Discount Type</label>
                    <select
                      value={promoTypeDraft}
                      onChange={(e) => setPromoTypeDraft(e.target.value as "percent" | "fixed")}
                      className={inputCls}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳ BDT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#2A1F18] mb-1">
                      Value ({promoTypeDraft === "percent" ? "%" : "৳"})
                    </label>
                    <input
                      type="number"
                      value={promoValDraft}
                      onChange={(e) => setPromoValDraft(e.target.value)}
                      className={`${inputCls} font-num`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2A1F18] mb-1">
                      Min. Order (BDT ৳)
                    </label>
                    <input
                      type="number"
                      value={promoMinDraft}
                      onChange={(e) => setPromoMinDraft(e.target.value)}
                      className={`${inputCls} font-num`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2A1F18] mb-1">Max Uses</label>
                    <input
                      type="number"
                      value={promoMaxUsesDraft}
                      onChange={(e) => setPromoMaxUsesDraft(e.target.value)}
                      className={`${inputCls} font-num`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#2A1F18] mb-1">Display Label</label>
                  <input
                    type="text"
                    value={promoLabelDraft}
                    onChange={(e) => setPromoLabelDraft(e.target.value)}
                    placeholder="e.g. 15% Eid Collector Privilege"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await postAction(
                      {
                        action: "save_promo",
                        code: promoCodeDraft,
                        discountType: promoTypeDraft,
                        discountValue: Number(promoValDraft),
                        minOrderBDT: Number(promoMinDraft),
                        maxUses: Number(promoMaxUsesDraft),
                        label:
                          promoLabelDraft ||
                          (promoTypeDraft === "percent"
                            ? `${promoValDraft}% Courtesy`
                            : `৳${promoValDraft} Courtesy`),
                        active: true,
                      },
                      `Saved promo code ${promoCodeDraft}`
                    );
                    if (ok) {
                      setPromoCodeDraft("");
                      setPromoLabelDraft("");
                    }
                  }}
                  className="w-full py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold rounded-lg cursor-pointer"
                >
                  Save Promo Code (Live Immediately)
                </button>
              </div>
            </div>

            <div className={`lg:col-span-7 ${cardCls} overflow-hidden`}>
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Code</th>
                    <th className={thCls}>Discount</th>
                    <th className={thCls}>Min Order</th>
                    <th className={thCls}>Redemptions</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {data.promoCodes.map((p) => (
                    <tr key={p.code} className="hover:bg-[#FBF8F3]">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-[#2A1F18] text-sm">{p.code}</p>
                        <p className="text-[#1E1915] font-medium">{p.label}</p>
                      </td>
                      <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                        {p.discountType === "percent"
                          ? `${p.discountValue}%`
                          : formatBDT(p.discountValue)}
                      </td>
                      <td className="py-3.5 px-4 font-num font-medium text-[#1E1915]">
                        {formatBDT(p.minOrderBDT)}
                      </td>
                      <td className="py-3.5 px-4 font-num font-bold text-[#1E1915]">
                        {p.usedCount} / {p.maxUses || "∞"}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            postAction(
                              {
                                action: "save_promo",
                                code: p.code,
                                discountType: p.discountType,
                                discountValue: p.discountValue,
                                minOrderBDT: p.minOrderBDT,
                                maxUses: p.maxUses,
                                label: p.label,
                                active: !p.active,
                              },
                              `Toggled ${p.code}`
                            )
                          }
                          className={`px-2.5 py-0.5 rounded font-bold cursor-pointer ${
                            p.active
                              ? "bg-[#E6F3F0] text-[#1B5E55] border border-[#A3D4C9]"
                              : "bg-[#EFE8DC] text-[#1E1915]"
                          }`}
                        >
                          {p.active ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            postAction({ action: "delete_promo", code: p.code }, `Deleted ${p.code}`)
                          }
                          className="p-1.5 rounded bg-[#FCECEC] hover:bg-[#F7D6D6] text-[#8C2F2F] border border-[#E5B8B8] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 9: SITE CONTENT EDITOR ───────────────────────── */}
        {activeTab === "content" && (
          <div className={`${cardCls} p-6 space-y-5 max-w-4xl`}>
            <div className="border-b border-[#E6DDD0] pb-3">
              <h2 className="text-base font-bold text-[#1E1915]">
                Live Storefront Copy &amp; Operational Settings
              </h2>
              <p className="text-[13px] text-[#1E1915] font-medium">
                Edit hero copy, top announcement banner, manifesto text, and WhatsApp/bKash numbers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="md:col-span-2 flex items-center gap-3 p-3.5 rounded-lg bg-[#FBF8F3] border border-[#DED3C2]">
                <input
                  type="checkbox"
                  checked={contentDraft.announcement_enabled === "true"}
                  onChange={(e) =>
                    setContentDraft({
                      ...contentDraft,
                      announcement_enabled: e.target.checked ? "true" : "false",
                    })
                  }
                  className="accent-[#2A1F18] w-4 h-4"
                />
                <span className="font-bold text-[#1E1915]">
                  Show Top Announcement Banner on Storefront
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#2A1F18] mb-1">
                  Announcement Banner Text
                </label>
                <input
                  type="text"
                  value={contentDraft.announcement_text || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, announcement_text: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A1F18] mb-1">Hero Eyebrow</label>
                <input
                  type="text"
                  value={contentDraft.hero_eyebrow || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, hero_eyebrow: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-bold text-[#2A1F18] mb-1">Hero Bengali Tagline</label>
                <input
                  type="text"
                  value={contentDraft.hero_bengali || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, hero_bengali: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-bold text-[#2A1F18] mb-1">Hero Headline Line 1</label>
                <input
                  type="text"
                  value={contentDraft.hero_title_line1 || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, hero_title_line1: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-bold text-[#2A1F18] mb-1">
                  Hero Headline Line 2 (Italic)
                </label>
                <input
                  type="text"
                  value={contentDraft.hero_title_line2 || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, hero_title_line2: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#2A1F18] mb-1">Manifesto Eyebrow</label>
                <input
                  type="text"
                  value={contentDraft.manifesto_eyebrow || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, manifesto_eyebrow: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-[#2A1F18] mb-1">Manifesto Statement</label>
                <textarea
                  rows={3}
                  value={contentDraft.manifesto_body || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, manifesto_body: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A1F18] mb-1">
                  WhatsApp Client Care Number
                </label>
                <input
                  type="text"
                  value={contentDraft.whatsapp_number || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, whatsapp_number: e.target.value })
                  }
                  className={`${inputCls} font-num`}
                />
              </div>
              <div>
                <label className="block font-bold text-[#2A1F18] mb-1">
                  bKash / Nagad Merchant Number
                </label>
                <input
                  type="text"
                  value={contentDraft.merchant_number || ""}
                  onChange={(e) =>
                    setContentDraft({ ...contentDraft, merchant_number: e.target.value })
                  }
                  className={`${inputCls} font-num`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                postAction(
                  { action: "save_content", content: contentDraft },
                  "Storefront content updated!"
                )
              }
              className="px-6 py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold text-[13px] rounded-lg cursor-pointer"
            >
              Publish Storefront Content
            </button>
          </div>
        )}

        {/* ───────────────────────── TAB 10: STAFF & ROLES (OWNER ONLY) ───────────────────────── */}
        {activeTab === "staff" && data.user.role === "owner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-5 ${cardCls} p-5 space-y-4`}>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915] flex items-center gap-2 border-b border-[#E6DDD0] pb-2.5">
                <UserCheck className="w-4 h-4 text-[#8C6528]" />
                Add or Update Staff Account
              </h2>
              <div className="space-y-3 text-[13px]">
                <div>
                  <label className="block font-bold text-[#2A1F18] mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Maliha Rahman"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2A1F18] mb-1">Email *</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="maliha@noksha.bd"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2A1F18] mb-1">
                    Role &amp; Permissions
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) =>
                      setStaffRole(e.target.value as "owner" | "manager" | "support")
                    }
                    className={inputCls}
                  >
                    <option value="owner">Owner — Full access + Staff management</option>
                    <option value="manager">
                      Manager — Products, Orders, Promos, Analytics, Content
                    </option>
                    <option value="support">
                      Support — Orders, Customers CRM, Leads, Abandoned Carts
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#2A1F18] mb-1">Password *</label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Set password"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await postAction(
                      {
                        action: "save_staff",
                        name: staffName,
                        email: staffEmail,
                        role: staffRole,
                        password: staffPassword,
                      },
                      `Saved staff account ${staffEmail}`
                    );
                    if (ok) {
                      setStaffName("");
                      setStaffEmail("");
                      setStaffPassword("");
                    }
                  }}
                  className="w-full py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold rounded-lg cursor-pointer"
                >
                  Save Staff Account
                </button>
              </div>
            </div>

            <div className={`lg:col-span-7 ${cardCls} overflow-hidden`}>
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Staff Member</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Last Login</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {data.staff.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FBF8F3]">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1E1915]">{s.name}</p>
                        <p className="text-[#1E1915] font-medium">{s.email}</p>
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-[#8C6528]">{s.role}</td>
                      <td className="py-3.5 px-4 font-num text-[#1E1915] font-medium">
                        {s.last_login_at
                          ? new Date(s.last_login_at).toLocaleString("en-GB")
                          : "Never"}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            postAction(
                              { action: "toggle_staff", id: s.id, active: !s.active },
                              "Updated staff status"
                            )
                          }
                          className={`px-2.5 py-0.5 rounded font-bold cursor-pointer ${
                            s.active
                              ? "bg-[#E6F3F0] text-[#1B5E55] border border-[#A3D4C9]"
                              : "bg-[#FCECEC] text-[#8C2F2F] border border-[#E5B8B8]"
                          }`}
                        >
                          {s.active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.id !== data.user.id && (
                          <button
                            type="button"
                            onClick={() =>
                              postAction({ action: "delete_staff", id: s.id }, "Removed staff")
                            }
                            className="p-1.5 rounded bg-[#FCECEC] hover:bg-[#F7D6D6] text-[#8C2F2F] border border-[#E5B8B8] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────── TAB 11: ACTIVITY AUDIT LOG ───────────────────────── */}
        {activeTab === "audit" && (
          <div className={`${cardCls} overflow-hidden`}>
            <div className="p-4 border-b border-[#DED3C2] bg-[#FBF8F3]">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1E1915]">
                Admin Activity Audit Log (Recent 100 Actions)
              </h2>
            </div>
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Timestamp</th>
                  <th className={thCls}>Staff Actor</th>
                  <th className={thCls}>Action</th>
                  <th className={thCls}>Target</th>
                  <th className={thCls}>Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDD0]">
                {data.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FBF8F3]">
                    <td className="py-3 px-4 font-num text-[#1E1915] font-medium">
                      {new Date(log.created_at).toLocaleString("en-GB")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#1E1915] font-bold">{log.user_email}</span>{" "}
                      <span className="text-[#8C6528] font-bold uppercase text-[10px]">
                        ({log.user_role})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1B5E55]">{log.action}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#1E1915]">
                      {log.entity_type}:{log.entity_id}
                    </td>
                    <td className="py-3 px-4 text-[#1E1915] font-medium">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl bg-[#2A1F18] text-[#FBF8F3] border border-[#B08A4F] text-[13px] font-bold shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-[#D4C5B0] rounded-xl p-4 shadow-[0_2px_10px_rgba(30,25,21,0.05)]">
      <p className="text-[13px] text-[#1E1915] font-bold uppercase tracking-wider">{label}</p>
      <p className={`font-num text-2xl sm:text-3xl font-bold mt-1.5 ${accent}`}>{value}</p>
      <p className="font-num text-[13px] text-[#2D2620] font-semibold mt-1">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-[#E6F3F0] text-[#11423B] border-[#8EC5B9]",
    confirmed: "bg-[#FDF3E1] text-[#61410D] border-[#DEC07A]",
    packed: "bg-[#EFE7DA] text-[#1E1915] border-[#B8A68E]",
    shipped: "bg-[#E6EEF8] text-[#15325C] border-[#9EB8DE]",
    delivered: "bg-[#E6F3F0] text-[#11423B] border-[#8EC5B9]",
    cancelled: "bg-[#FCECEC] text-[#781E1E] border-[#DFA3A3]",
    ready: "bg-[#E6F3F0] text-[#11423B] border-[#8EC5B9]",
    limited: "bg-[#FDF3E1] text-[#61410D] border-[#DEC07A]",
    waitlist: "bg-[#EFE7DA] text-[#1E1915] border-[#B8A68E]",
    sold: "bg-[#FCECEC] text-[#781E1E] border-[#DFA3A3]",
    sold_out: "bg-[#FCECEC] text-[#781E1E] border-[#DFA3A3]",
    acquired: "bg-[#FDF3E1] text-[#61410D] border-[#DEC07A]",
    hidden: "bg-[#E5DEC9] text-[#2D2620] border-[#B8A68E]",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase border ${
        map[status] || "bg-[#EFE7DA] text-[#1E1915] border-[#B8A68E]"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
