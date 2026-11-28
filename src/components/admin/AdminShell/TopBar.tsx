"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Menu,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatRelativeTime } from "../adminTypes";
import { IconButton, Select } from "../ui";
import { NavItemDef } from "./navConfig";

export function TopBar({
  currentNav,
  subBreadcrumb,
  onClearSubBreadcrumb,
  showDateRange,
  dateRange,
  onDateRangeChange,
  lastSyncedAt,
  refreshing,
  supabaseEnabled,
  onRefresh,
  onOpenMobileNav,
  onOpenSearch,
  onOpenShortcuts,
}: {
  currentNav?: NavItemDef;
  subBreadcrumb?: string | null;
  onClearSubBreadcrumb?: () => void;
  showDateRange: boolean;
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  lastSyncedAt: string | null;
  refreshing: boolean;
  supabaseEnabled?: boolean;
  onRefresh: () => void;
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 h-14 bg-a-canvas/90 backdrop-blur-md border-b border-a-border px-4 sm:px-6 flex items-center justify-between gap-3 print:hidden">
      {/* Left: Mobile Hamburger + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="lg:hidden -ml-1">
          <IconButton aria-label="Open navigation menu" onClick={onOpenMobileNav}>
            <Menu className="w-5 h-5" />
          </IconButton>
        </div>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-[13px]">
          {currentNav && (
            <span className="hidden sm:inline text-a-text-3">{currentNav.group}</span>
          )}
          {currentNav && (
            <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-a-text-3 shrink-0" />
          )}
          {subBreadcrumb ? (
            <>
              <button
                type="button"
                onClick={onClearSubBreadcrumb}
                className="text-a-text-2 hover:text-a-text-1 font-medium truncate cursor-pointer"
              >
                {currentNav?.label || "Studio"}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-a-text-3 shrink-0" />
              <span className="font-num font-semibold text-a-text-1 truncate">
                {subBreadcrumb}
              </span>
            </>
          ) : (
            <span className="font-semibold text-a-text-1 text-[15px] sm:text-[14px] truncate">
              {currentNav?.label || "Studio"}
            </span>
          )}
        </nav>

        <span className="hidden xl:inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-a-surface border border-a-border text-[12px] text-a-text-3">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              supabaseEnabled ? "bg-a-success" : "bg-a-accent"
            }`}
          />
          {supabaseEnabled ? "Cloud Synced" : "Local SQLite"}
        </span>
      </div>

      {/* Right: Date Range (Overview/Analytics), Last Synced, Shortcuts, Storefront, Mobile Search */}
      <div className="flex items-center gap-2 shrink-0">
        {showDateRange && (
          <div className="hidden sm:block w-[136px]">
            <Select
              aria-label="Date range"
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
          </div>
        )}

        <button
          type="button"
          onClick={onRefresh}
          className="admin-press hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] text-[12px] text-a-text-3 hover:text-a-text-1 hover:bg-a-subtle cursor-pointer"
          title="Refresh studio data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-a-accent" : ""}`} />
          <span className="font-num">
            {lastSyncedAt ? `Synced ${formatRelativeTime(lastSyncedAt)}` : "Sync"}
          </span>
        </button>

        <div className="hidden lg:inline-flex">
          <IconButton
            aria-label="Keyboard shortcuts"
            tooltip="Keyboard shortcuts"
            kbd="?"
            onClick={onOpenShortcuts}
          >
            <HelpCircle className="w-4 h-4" />
          </IconButton>
        </div>

        <Link
          href="/"
          target="_blank"
          className="admin-press hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-surface hover:bg-a-subtle border border-a-border text-[13px] font-medium text-a-text-1"
        >
          <span>View store</span>
          <ExternalLink className="w-3.5 h-3.5 text-a-text-3" />
        </Link>

        <div className="lg:hidden">
          <IconButton aria-label="Search studio" onClick={onOpenSearch}>
            <Search className="w-5 h-5" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
