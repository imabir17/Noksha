"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  HelpCircle,
  Layers,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminPayload, AdminTab, downloadCsv } from "../adminTypes";
import { Kbd } from "../ui";
import { NavItemDef } from "./navConfig";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  sub?: string;
  shortcut?: string;
  icon: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

const RECENT_STORAGE_KEY = "noksha_admin_recent_cmds";

export function CommandPalette({
  open,
  onClose,
  data,
  navItems,
  onNavigate,
  onNewAction,
  onCopyDigest,
  onOpenShortcuts,
  onRequestResetDemo,
}: {
  open: boolean;
  onClose: () => void;
  data: AdminPayload;
  navItems: NavItemDef[];
  onNavigate: (tab: AdminTab, extra?: Record<string, string | null>) => void;
  onNewAction: (tab: AdminTab) => void;
  onCopyDigest: () => void;
  onOpenShortcuts: () => void;
  onRequestResetDemo: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setRecentIds(stored);
    } catch {
      // ignore
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const recordRecent = (id: string) => {
    try {
      const next = [id, ...recentIds.filter((r) => r !== id)].slice(0, 5);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // Quick Actions
    if (navItems.some((n) => n.id === "products")) {
      items.push({
        id: "act:new-product",
        group: "Quick Actions",
        label: "New product",
        sub: "Add a store piece or 1-of-1 Drop piece",
        icon: <Plus className="w-4 h-4 text-a-accent" />,
        onSelect: () => onNewAction("products"),
      });
    }
    if (navItems.some((n) => n.id === "collections")) {
      items.push({
        id: "act:new-drop",
        group: "Quick Actions",
        label: "New Exclusive Drop",
        sub: "Create a numbered 1-of-1 release",
        icon: <Layers className="w-4 h-4 text-a-accent" />,
        onSelect: () => onNewAction("collections"),
      });
    }
    if (navItems.some((n) => n.id === "promos")) {
      items.push({
        id: "act:new-promo",
        group: "Quick Actions",
        label: "New promo code",
        sub: "Create percentage or fixed BDT courtesy code",
        icon: <Tag className="w-4 h-4 text-a-accent" />,
        onSelect: () => onNewAction("promos"),
      });
    }
    items.push({
      id: "act:copy-digest",
      group: "Quick Actions",
      label: "Copy sales digest",
      sub: "Copy formatted studio summary to clipboard",
      icon: <Copy className="w-4 h-4 text-a-text-3" />,
      onSelect: onCopyDigest,
    });
    if (navItems.some((n) => n.id === "audit")) {
      items.push({
        id: "act:export-audit",
        group: "Quick Actions",
        label: "Export audit CSV",
        sub: `Download ${data.auditLogs.length} activity events`,
        icon: <Download className="w-4 h-4 text-a-text-3" />,
        onSelect: () =>
          downloadCsv(
            "noksha-full-audit-log.csv",
            ["ID", "Timestamp", "User Email", "Role", "Action", "Entity Type", "Entity ID", "Details"],
            data.auditLogs.map((l) => [
              l.id,
              new Date(l.created_at).toLocaleString("en-GB"),
              l.user_email,
              l.user_role,
              l.action,
              l.entity_type,
              l.entity_id,
              l.details,
            ])
          ),
      });
    }
    items.push({
      id: "act:shortcuts",
      group: "Quick Actions",
      label: "Keyboard shortcuts",
      shortcut: "?",
      icon: <HelpCircle className="w-4 h-4 text-a-text-3" />,
      onSelect: onOpenShortcuts,
    });
    if (data.user.role === "owner") {
      items.push({
        id: "act:reset-demo",
        group: "Quick Actions",
        label: "Reset demo data",
        sub: "Clear demo orders, leads & analytics counters",
        icon: <Trash2 className="w-4 h-4 text-a-danger" />,
        danger: true,
        onSelect: onRequestResetDemo,
      });
    }

    // Navigation Tabs
    for (const nav of navItems) {
      items.push({
        id: `nav:${nav.id}`,
        group: "Navigation",
        label: nav.label,
        sub: nav.group,
        shortcut: nav.shortcut,
        icon: nav.icon,
        onSelect: () => onNavigate(nav.id),
      });
    }

    // Orders
    if (navItems.some((n) => n.id === "orders")) {
      for (const o of data.orders.slice(0, 50)) {
        items.push({
          id: `order:${o.id}`,
          group: "Orders",
          label: `${o.id} — ${o.customerName}`,
          sub: `${o.customerPhone} · ${formatBDT(o.totalBDT)} · ${o.status}`,
          icon: <ShoppingBag className="w-4 h-4 text-a-text-3" />,
          onSelect: () => onNavigate("orders", { order: o.id }),
        });
      }
    }

    // Products
    if (navItems.some((n) => n.id === "products")) {
      for (const p of data.products) {
        items.push({
          id: `prod:${p.id}`,
          group: "Products",
          label: p.name,
          sub: `${p.sku} · ${formatBDT(p.priceBDT)}`,
          icon: <Package className="w-4 h-4 text-a-text-3" />,
          onSelect: () => onNavigate("products", { edit: p.id }),
        });
      }
    }

    // Customers
    if (navItems.some((n) => n.id === "customers")) {
      for (const c of data.customers.slice(0, 40)) {
        items.push({
          id: `cust:${c.phone}`,
          group: "Customers",
          label: c.name,
          sub: `${c.phone} · ${c.district} · ${formatBDT(c.totalSpentBDT)}`,
          icon: <Users className="w-4 h-4 text-a-text-3" />,
          onSelect: () => onNavigate("customers", { customer: c.phone }),
        });
      }
    }

    return items;
  }, [
    data.auditLogs,
    data.customers,
    data.orders,
    data.products,
    data.user.role,
    navItems,
    onCopyDigest,
    onNavigate,
    onNewAction,
    onOpenShortcuts,
    onRequestResetDemo,
  ]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recents = recentIds
        .map((id) => allItems.find((item) => item.id === id))
        .filter(Boolean)
        .map((it) => ({ ...(it as PaletteItem), group: "Recent" }));
      const base = allItems.filter(
        (it) =>
          (it.group === "Navigation" || it.group === "Quick Actions") &&
          !recentIds.includes(it.id)
      );
      return [...recents, ...base];
    }
    return allItems
      .filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          (it.sub && it.sub.toLowerCase().includes(q)) ||
          it.group.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [allItems, query, recentIds]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (visibleItems.length ? (i + 1) % visibleItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          visibleItems.length ? (i - 1 + visibleItems.length) % visibleItems.length : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const chosen = visibleItems[activeIndex];
        if (chosen) {
          recordRecent(chosen.id);
          onClose();
          chosen.onSelect();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Emil Kowalski rule: Command palette toggles 100+ times/day -> NO animation ever.
  if (!open) return null;

  const grouped: { group: string; entries: { item: PaletteItem; globalIdx: number }[] }[] = [];
  visibleItems.forEach((item, globalIdx) => {
    let g = grouped.find((x) => x.group === item.group);
    if (!g) {
      g = { group: item.group, entries: [] };
      grouped.push(g);
    }
    g.entries.push({ item, globalIdx });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 print:hidden">
      <div className="fixed inset-0 bg-a-overlay" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-[560px] bg-a-surface border border-a-border rounded-[14px] shadow-[var(--a-shadow-pop)] overflow-hidden"
      >
        <div className="h-12 px-4 border-b border-a-border flex items-center gap-3">
          <Search className="w-4 h-4 text-a-text-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to tab, search orders, products, phones, or run an action…"
            className="flex-1 bg-transparent text-[14px] text-a-text-1 placeholder:text-a-text-3 focus:outline-none focus:shadow-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="admin-scroll max-h-[380px] overflow-y-auto p-2 space-y-2">
          {grouped.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-a-text-3">
              No matching studio tabs, orders, products, or customers.
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.group} className="space-y-0.5">
                <p className="px-2.5 py-1 text-[12px] uppercase tracking-[0.04em] text-a-text-3">
                  {g.group}
                </p>
                {g.entries.map(({ item, globalIdx }) => {
                  const active = globalIdx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      onClick={() => {
                        recordRecent(item.id);
                        onClose();
                        item.onSelect();
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[8px] text-left cursor-pointer ${
                        active ? "bg-a-subtle" : ""
                      } ${item.danger ? "text-a-danger" : "text-a-text-1"}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate font-num">{item.label}</p>
                          {item.sub && (
                            <p className="text-[12px] text-a-text-3 truncate font-num">
                              {item.sub}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-a-subtle border-t border-a-border flex items-center justify-between text-[12px] text-a-text-3">
          <span>↑↓ to navigate · ↵ to select</span>
          <span>Noksha Studio Command</span>
        </div>
      </div>
    </div>
  );
}
