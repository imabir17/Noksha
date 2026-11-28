"use client";

import React from "react";

export function Card({
  title,
  description,
  actions,
  padded = true,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  padded?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <section
      className={`bg-a-surface border border-a-border rounded-[14px] shadow-[var(--a-shadow-card)] overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div className="px-5 py-4 border-b border-a-border flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="a-title truncate">{title}</h2>}
            {description && <p className="a-body-sm mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  toolbar,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="a-display">{title}</h1>
          {description && <p className="a-body-sm mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {toolbar && <div>{toolbar}</div>}
    </div>
  );
}

export function Sparkline({
  points,
  stroke = "var(--a-accent)",
}: {
  points: number[];
  stroke?: string;
}) {
  if (!points || points.length < 2) return null;
  const width = 68;
  const height = 26;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline = coords.join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline
        points={polyline}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaPositive,
  sparkline,
  highlight = false,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaPositive?: boolean;
  sparkline?: number[];
  highlight?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`admin-kpi-card w-full text-left bg-a-surface border rounded-[14px] p-5 shadow-[var(--a-shadow-card)] ${
        highlight ? "border-a-accent/40" : "border-a-border"
      } ${onClick ? "admin-press cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] leading-4 font-medium text-a-text-3">{label}</p>
        {delta && (
          <span
            className={`font-num inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] leading-4 font-medium ${
              deltaPositive === false
                ? "bg-a-danger-bg text-a-danger"
                : "bg-a-success-bg text-a-success"
            }`}
          >
            <span>{deltaPositive === false ? "▼" : "▲"}</span>
            <span>{delta}</span>
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-2">
        <p className="font-num text-[24px] xl:text-[26px] leading-8 font-semibold tracking-tight text-a-text-1 whitespace-nowrap">
          {value}
        </p>
        {sparkline && sparkline.length > 1 && <Sparkline points={sparkline} />}
      </div>

      {sub && <p className="font-num text-[12px] leading-4 text-a-text-3 mt-2">{sub}</p>}
    </Tag>
  );
}
