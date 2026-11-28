"use client";

import React from "react";

export const legacyInputCls =
  "w-full px-3 py-2 bg-a-surface border border-a-border-strong rounded-lg text-[13px] text-a-text-1 font-normal placeholder:text-a-text-3 focus:outline-none focus:border-a-accent transition-[border-color,box-shadow] duration-150";

export const legacyCardCls =
  "bg-a-surface border border-a-border rounded-xl shadow-[var(--a-shadow-card)]";

export const legacyThCls =
  "py-2.5 px-4 text-left text-[12px] font-medium uppercase tracking-[0.04em] text-a-text-3 bg-a-subtle border-b border-a-border";

export function LegacyKpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="admin-kpi-card bg-a-surface border border-a-border rounded-xl p-4 sm:p-5 shadow-[var(--a-shadow-card)]">
      <p className="text-[12px] text-a-text-3 font-medium tracking-[0.02em]">{label}</p>
      <p className="font-num text-2xl sm:text-[28px] font-semibold tracking-tight mt-2 leading-none text-a-text-1">
        {value}
      </p>
      <p className="font-num text-[12px] text-a-text-3 font-normal mt-2">{sub}</p>
    </div>
  );
}

export function LegacyStatusBadge({ status }: { status: string }) {
  const map: Record<string, { pill: string; dot: string }> = {
    new: { pill: "bg-a-success-bg text-a-success", dot: "bg-a-success" },
    confirmed: { pill: "bg-a-warning-bg text-a-warning", dot: "bg-a-warning" },
    packed: { pill: "bg-a-subtle text-a-text-2", dot: "bg-a-text-3" },
    shipped: { pill: "bg-a-info-bg text-a-info", dot: "bg-a-info" },
    delivered: { pill: "bg-a-success-bg text-a-success", dot: "bg-a-success" },
    cancelled: { pill: "bg-a-danger-bg text-a-danger", dot: "bg-a-danger" },
    ready: { pill: "bg-a-success-bg text-a-success", dot: "bg-a-success" },
    limited: { pill: "bg-a-warning-bg text-a-warning", dot: "bg-a-warning" },
    waitlist: { pill: "bg-a-subtle text-a-text-2", dot: "bg-a-text-3" },
    sold: { pill: "bg-a-danger-bg text-a-danger", dot: "bg-a-danger" },
    sold_out: { pill: "bg-a-danger-bg text-a-danger", dot: "bg-a-danger" },
    acquired: { pill: "bg-a-accent-soft text-a-accent-text", dot: "bg-a-accent" },
    hidden: { pill: "bg-a-subtle text-a-text-3", dot: "bg-a-text-3" },
  };
  const style = map[status] || { pill: "bg-a-subtle text-a-text-2", dot: "bg-a-text-3" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium capitalize ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      {status.replace("_", " ")}
    </span>
  );
}
