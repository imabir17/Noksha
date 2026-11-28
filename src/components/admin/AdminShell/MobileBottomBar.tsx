"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import { AdminTab } from "../adminTypes";
import { NavItemDef } from "./navConfig";

const PRIMARY_MOBILE_IDS: AdminTab[] = ["overview", "orders", "products", "customers"];

export function MobileBottomBar({
  navItems,
  activeTab,
  onSelectTab,
  onOpenMore,
}: {
  navItems: NavItemDef[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenMore: () => void;
}) {
  const primaryTabs = PRIMARY_MOBILE_IDS.map((id) => navItems.find((n) => n.id === id)).filter(
    Boolean
  ) as NavItemDef[];

  const isMoreActive = !PRIMARY_MOBILE_IDS.includes(activeTab);

  return (
    <nav
      aria-label="Primary mobile tabs"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-a-surface/95 backdrop-blur-md border-t border-a-border grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      {primaryTabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`admin-press relative min-h-[52px] py-1.5 flex flex-col items-center justify-center gap-1 text-[12px] cursor-pointer ${
              active ? "text-a-text-1 font-medium" : "text-a-text-3 font-normal"
            }`}
          >
            <span className={active ? "text-a-accent" : "text-a-text-3"}>{tab.icon}</span>
            <span className="truncate max-w-full px-1">{tab.shortLabel}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="font-num absolute top-1.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-a-accent-soft text-a-accent-text text-[12px] leading-4 text-center">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        className={`admin-press min-h-[52px] py-1.5 flex flex-col items-center justify-center gap-1 text-[12px] cursor-pointer ${
          isMoreActive ? "text-a-text-1 font-medium" : "text-a-text-3 font-normal"
        }`}
      >
        <MoreHorizontal className={`w-4 h-4 ${isMoreActive ? "text-a-accent" : "text-a-text-3"}`} />
        <span>More</span>
      </button>
    </nav>
  );
}
