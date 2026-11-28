"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  FileText,
  Layers,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingDown,
  Users,
  XCircle,
} from "lucide-react";
import { AdminMetrics, AdminPayload, AdminTab, canAccessSection } from "../adminTypes";

export interface NavItemDef {
  id: AdminTab;
  label: string;
  shortLabel: string;
  group: string;
  icon: React.ReactNode;
  badge?: number;
  alertBadge?: boolean;
  shortcut?: string;
}

export interface NavGroupDef {
  group: string;
  items: NavItemDef[];
}

export function buildNavGroups(data: AdminPayload, metrics: AdminMetrics): NavGroupDef[] {
  const raw: NavGroupDef[] = [
    {
      group: "Overview",
      items: [
        {
          id: "overview",
          label: "Command Overview",
          shortLabel: "Overview",
          group: "Overview",
          icon: <Activity className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          shortcut: "G O",
        },
        {
          id: "analytics",
          label: "Analytics & Funnel",
          shortLabel: "Analytics",
          group: "Overview",
          icon: <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
        },
      ],
    },
    {
      group: "Commerce",
      items: [
        {
          id: "orders",
          label: "Orders Pipeline",
          shortLabel: "Orders",
          group: "Commerce",
          icon: <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: metrics.pendingOrdersCount,
          shortcut: "G R",
        },
        {
          id: "cancellations",
          label: "Cancellation Requests",
          shortLabel: "Cancels",
          group: "Commerce",
          icon: <XCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.orders.filter((o) => o.cancellationRequested).length,
          alertBadge: true,
        },
        {
          id: "collections",
          label: "Drops & Categories",
          shortLabel: "Drops",
          group: "Commerce",
          icon: <Layers className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.collections.length,
        },
        {
          id: "products",
          label: "Products & Inventory",
          shortLabel: "Products",
          group: "Commerce",
          icon: <Package className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: metrics.lowStockProducts.length,
          shortcut: "G P",
        },
      ],
    },
    {
      group: "Customers",
      items: [
        {
          id: "customers",
          label: "Customers CRM",
          shortLabel: "Customers",
          group: "Customers",
          icon: <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.customers.length,
          shortcut: "G C",
        },
        {
          id: "abandoned",
          label: "Abandoned Carts",
          shortLabel: "Abandoned",
          group: "Customers",
          icon: <TrendingDown className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: metrics.unrecoveredCarts.length,
        },
        {
          id: "leads",
          label: "Waitlist & Leads",
          shortLabel: "Leads",
          group: "Customers",
          icon: <Sparkles className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
          badge: data.leads.filter((l) => l.status === "new").length,
        },
        {
          id: "promos",
          label: "Promo Codes",
          shortLabel: "Promos",
          group: "Customers",
          icon: <Tag className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
        },
      ],
    },
    {
      group: "Workspace",
      items: [
        {
          id: "content",
          label: "Site Content CMS",
          shortLabel: "Content",
          group: "Workspace",
          icon: <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
        },
        {
          id: "staff",
          label: "Staff & Roles",
          shortLabel: "Staff",
          group: "Workspace",
          icon: <Shield className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
        },
        {
          id: "audit",
          label: "Activity Audit Log",
          shortLabel: "Audit Log",
          group: "Workspace",
          icon: <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />,
        },
      ],
    },
  ];

  return raw
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => canAccessSection(data.user.role, item.id)),
    }))
    .filter((g) => g.items.length > 0);
}
