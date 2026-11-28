"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
} from "lucide-react";
import { AdminTab, SessionUser } from "../adminTypes";
import { Drawer, IconButton, Kbd, Tooltip } from "../ui";
import { NavGroupDef } from "./navConfig";

const COLLAPSE_STORAGE_KEY = "noksha_admin_sidebar_collapsed";

export function Sidebar({
  groups,
  activeTab,
  onSelectTab,
  onOpenSearch,
  user,
  refreshing,
  onRefresh,
  onLogout,
}: {
  groups: NavGroupDef[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenSearch: () => void;
  user: SessionUser;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <aside
      className={`hidden lg:flex ${
        collapsed ? "lg:w-[64px]" : "lg:w-[248px]"
      } lg:h-screen lg:overflow-hidden bg-a-sidebar border-r border-a-border shrink-0 flex-col justify-between select-none print:hidden`}
    >
      <div className="space-y-2">
        {/* Brand Header (56px) */}
        <div
          className={`h-14 border-b border-a-border flex items-center ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <img
                src="/brand/noksha-logo.png"
                alt="NOKSHA"
                className="h-7 w-auto object-contain"
              />
            </Link>
          )}
          <div className="flex items-center gap-1">
            {!collapsed && (
              <Tooltip content="Open live storefront" side="bottom">
                <Link
                  href="/"
                  target="_blank"
                  aria-label="Open live storefront"
                  className="admin-press inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-a-text-3 hover:text-a-text-1 hover:bg-a-subtle"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                </Link>
              </Tooltip>
            )}
            <IconButton
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              )}
            </IconButton>
          </div>
        </div>

        {/* Search Trigger */}
        <div className="px-2.5 pt-1">
          {collapsed ? (
            <div className="flex justify-center">
              <IconButton
                aria-label="Search studio (⌘K)"
                tooltip="Search studio"
                kbd="⌘K"
                variant="secondary"
                onClick={onOpenSearch}
              >
                <Search className="w-4 h-4" />
              </IconButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSearch}
              className="admin-press w-full h-9 px-3 rounded-[8px] bg-a-surface hover:bg-a-subtle border border-a-border text-[13px] font-normal text-a-text-3 flex items-center justify-between gap-2 cursor-pointer shadow-[var(--a-shadow-card)]"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 shrink-0 text-a-text-3" />
                <span>Search…</span>
              </span>
              <Kbd>⌘K</Kbd>
            </button>
          )}
        </div>

        {/* Grouped Navigation — Regular Weight (font-normal), Fixed Without Scrolling */}
        <nav className="px-2.5 space-y-3" aria-label="Studio navigation">
          {groups.map((group) => (
            <div key={group.group} className="space-y-0.5">
              {!collapsed && (
                <p className="px-2.5 pb-1 text-[12px] leading-4 font-normal uppercase tracking-[0.04em] text-a-text-3">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const active = activeTab === item.id;
                const buttonEl = (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`admin-press relative w-full flex items-center ${
                      collapsed ? "justify-center px-0" : "justify-between px-2.5"
                    } gap-2 h-[34px] rounded-[8px] text-[14px] font-normal whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-a-surface text-a-text-1 shadow-[var(--a-shadow-card)] ring-1 ring-a-border"
                        : "text-a-text-2 hover:text-a-text-1 hover:bg-a-subtle"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className={active ? "text-a-accent" : "text-a-text-3"}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate font-normal">{item.label}</span>}
                    </span>
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`font-num px-2 py-0.5 rounded-full text-[12px] leading-none font-normal shrink-0 ${
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
                    {collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                          item.alertBadge ? "bg-a-danger" : "bg-a-accent"
                        }`}
                      />
                    )}
                  </button>
                );

                return collapsed ? (
                  <Tooltip key={item.id} content={item.label} kbd={item.shortcut} side="right">
                    {buttonEl}
                  </Tooltip>
                ) : (
                  buttonEl
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Pinned Profile Strip */}
      <div className="p-3 border-t border-a-border space-y-2.5">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <Tooltip content={`${user.name} (${user.role})`} side="right">
              <div className="w-8 h-8 rounded-full bg-a-ink-btn text-a-on-ink flex items-center justify-center text-[12px] font-normal">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            </Tooltip>
            <IconButton aria-label="Sync studio data" tooltip="Sync data" side-tooltip="right" onClick={onRefresh}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </IconButton>
            <IconButton aria-label="Sign out" tooltip="Sign out" onClick={onLogout}>
              <LogOut className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-a-ink-btn text-a-on-ink flex items-center justify-center text-[12px] font-normal shrink-0">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-normal text-a-text-1 truncate">{user.name}</p>
                <p className="text-[12px] text-a-text-3 font-normal truncate capitalize">
                  {user.role}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onRefresh}
                className="admin-press flex-1 h-8 px-2.5 rounded-[8px] bg-a-surface hover:bg-a-subtle text-a-text-1 border border-a-border text-[12px] font-normal flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-a-text-3 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="admin-press h-8 px-2.5 rounded-[8px] bg-a-surface hover:bg-a-danger-bg text-a-text-2 hover:text-a-danger border border-a-border text-[12px] font-normal flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
  groups,
  activeTab,
  onSelectTab,
  user,
  onRefresh,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroupDef[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  user: SessionUser;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      widthCls="max-w-[300px]"
      title={
        <img
          src="/brand/noksha-logo.png"
          alt="NOKSHA"
          className="h-7 w-auto object-contain"
        />
      }
      subtitle="Studio Console & CRM"
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-a-text-1 truncate">{user.name}</p>
            <p className="text-[12px] text-a-text-3 capitalize">{user.role}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="admin-press min-h-[44px] px-3 rounded-[8px] bg-a-surface border border-a-border text-[13px] text-a-text-1 cursor-pointer"
            >
              Sync
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="admin-press min-h-[44px] px-3 rounded-[8px] bg-a-danger-bg text-a-danger text-[13px] font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      }
    >
      <nav className="space-y-4" aria-label="Mobile studio navigation">
        {groups.map((group) => (
          <div key={group.group} className="space-y-1">
            <p className="px-2.5 text-[12px] uppercase tracking-[0.04em] text-a-text-3">
              {group.group}
            </p>
            {group.items.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`admin-press w-full min-h-[44px] px-3 rounded-[8px] text-[14px] font-normal flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? "bg-a-subtle text-a-text-1 ring-1 ring-a-border"
                      : "text-a-text-2 hover:bg-a-subtle"
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <span className={active ? "text-a-accent" : "text-a-text-3"}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`font-num px-2 py-0.5 rounded-full text-[12px] ${
                        item.alertBadge
                          ? "bg-a-danger-bg text-a-danger"
                          : "bg-a-surface text-a-text-2 border border-a-border"
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
    </Drawer>
  );
}
