"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Download, ShieldAlert } from "lucide-react";
import { downloadCsv, formatRelativeTime } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  Tooltip,
} from "../ui";

function dayHeading(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  const today = new Date();
  const yest = new Date(Date.now() - 86_400_000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isFailedLogin(action: string, details: string): boolean {
  const a = action.toLowerCase();
  const d = details.toLowerCase();
  return a.includes("fail") || d.includes("failed") || d.includes("invalid password");
}

function matchesActionCategory(action: string, cat: string): boolean {
  if (cat === "all") return true;
  const a = action.toLowerCase();
  if (cat === "failed_login") return a.includes("fail");
  if (cat === "auth") return a.includes("login") || a.includes("logout") || a.includes("auth");
  if (cat === "orders") return a.includes("order") || a.includes("cancel");
  if (cat === "catalog") return a.includes("product") || a.includes("collection") || a.includes("category") || a.includes("upload");
  if (cat === "cms") return a.includes("content") || a.includes("promo");
  if (cat === "staff") return a.includes("staff");
  return true;
}

export default function AuditTab() {
  const { data } = useAdmin();

  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const uniqueActors = useMemo(
    () => Array.from(new Set(data.auditLogs.map((l) => l.user_email))).sort(),
    [data.auditLogs]
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const maxAgeMs =
      dateRange === "today"
        ? 86_400_000
        : dateRange === "7d"
        ? 7 * 86_400_000
        : dateRange === "30d"
        ? 30 * 86_400_000
        : null;

    return data.auditLogs.filter((l) => {
      if (actorFilter !== "all" && l.user_email !== actorFilter) return false;
      if (!matchesActionCategory(l.action, actionFilter)) return false;
      if (maxAgeMs !== null) {
        const t = new Date(l.created_at).getTime();
        if (!Number.isNaN(t) && now - t > maxAgeMs) return false;
      }
      if (!q) return true;
      return (
        l.user_email.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q) ||
        l.entity_id.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    });
  }, [actionFilter, actorFilter, data.auditLogs, dateRange, search]);

  const groupedByDay = useMemo(() => {
    const groups: { label: string; items: typeof filteredLogs }[] = [];
    for (const log of filteredLogs) {
      const label = dayHeading(log.created_at);
      let g = groups.find((x) => x.label === label);
      if (!g) {
        g = { label, items: [] };
        groups.push(g);
      }
      g.items.push(log);
    }
    return groups;
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Audit Log"
        description={
          <span>
            Showing <strong className="font-num text-a-text-1">{filteredLogs.length}</strong> of{" "}
            <strong className="font-num text-a-text-1">{data.auditLogs.length}</strong> recorded studio events.
          </span>
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() =>
              downloadCsv(
                "noksha-full-audit-log.csv",
                ["ID", "Timestamp", "User Email", "Role", "Action", "Entity Type", "Entity ID", "Details"],
                filteredLogs.map((l) => [
                  l.id,
                  new Date(l.created_at).toLocaleString("en-GB"),
                  l.user_email,
                  l.user_role,
                  l.action,
                  l.entity_type,
                  l.entity_id,
                  l.details,
                ])
              )
            }
          >
            Export CSV
          </Button>
        }
        toolbar={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <SearchInput
              inputRef={(el) => {
                if (el) el.setAttribute("data-admin-search", "true");
              }}
              value={search}
              onChange={setSearch}
              placeholder="Search actor, target, details…"
            />
            <Select
              aria-label="Filter by staff actor"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            >
              <option value="all">All staff actors</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by action type"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All action types</option>
              <option value="failed_login">Failed logins</option>
              <option value="auth">Sign-ins &amp; sign-outs</option>
              <option value="orders">Orders &amp; cancellations</option>
              <option value="catalog">Products, Drops &amp; media</option>
              <option value="cms">Site content &amp; promos</option>
              <option value="staff">Staff accounts</option>
            </Select>
            <Select
              aria-label="Filter by date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </Select>
          </div>
        }
      />

      {groupedByDay.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<AlertTriangle className="w-5 h-5" />}
            title="No audit events match your filters"
            description="Try broadening your actor, action type, or date range filter."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByDay.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <h2 className="font-num text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3 px-1">
                {group.label}
              </h2>
              <Card padded={false}>
                <div className="divide-y divide-a-border">
                  {group.items.map((log) => {
                    const failed = isFailedLogin(log.action, log.details);
                    return (
                      <div
                        key={log.id}
                        className={`px-5 py-3.5 flex items-start justify-between gap-4 ${
                          failed
                            ? "bg-a-danger-bg/65 border-l-2 border-l-a-danger"
                            : "admin-row-hover"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium shrink-0 mt-0.5 ${
                              failed
                                ? "bg-a-danger text-a-on-ink"
                                : "bg-a-subtle border border-a-border text-a-text-1"
                            }`}
                          >
                            {failed ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              (log.user_email || "S").slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap text-[13px]">
                              <span className="font-medium text-a-text-1">{log.user_email}</span>
                              <Badge tone={failed ? "danger" : "neutral"}>
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                              {log.entity_id && (
                                <span className="font-mono text-[12px] text-a-text-3">
                                  {log.entity_type}:{log.entity_id}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[13px] ${
                                failed ? "text-a-danger font-medium" : "text-a-text-2"
                              }`}
                            >
                              {log.details}
                            </p>
                          </div>
                        </div>

                        <Tooltip content={new Date(log.created_at).toLocaleString("en-GB")}>
                          <span className="font-num text-[12px] text-a-text-3 whitespace-nowrap shrink-0">
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
