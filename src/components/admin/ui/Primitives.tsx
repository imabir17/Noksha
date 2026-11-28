"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/* ─── Global warm-tooltip timer (Emil Kowalski: 400ms first, instant adjacent) ─── */
let lastTooltipClosedAt = 0;

export function Kbd({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-[5px] bg-a-subtle border border-a-border text-[12px] leading-none font-medium text-a-text-2 select-none shrink-0 ${className}`}
    >
      {children}
    </kbd>
  );
}

export function Tooltip({
  content,
  kbd,
  side = "top",
  children,
}: {
  content: string;
  kbd?: string;
  side?: "top" | "bottom" | "right";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const isWarm = Date.now() - lastTooltipClosedAt < 500;
    if (isWarm) {
      setInstant(true);
      setOpen(true);
    } else {
      setInstant(false);
      timerRef.current = setTimeout(() => setOpen(true), 400);
    }
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (open) {
      lastTooltipClosedAt = Date.now();
    }
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const posCls =
    side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-1.5"
      : side === "right"
      ? "left-full top-1/2 -translate-y-1/2 ml-2"
      : "bottom-full left-1/2 -translate-x-1/2 mb-1.5";

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {open && content && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap px-2.5 py-1 rounded-[6px] bg-a-ink-btn text-a-on-ink text-[12px] font-normal shadow-[var(--a-shadow-pop)] flex items-center gap-1.5 ${posCls} ${
            instant ? "" : "admin-popover-enter"
          }`}
        >
          <span>{content}</span>
          {kbd && (
            <span className="px-1 py-0.5 rounded bg-a-surface/15 text-a-on-ink text-[12px] leading-none">
              {kbd}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  kbd?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    kbd,
    disabled,
    className = "",
    children,
    type = "button",
    ...rest
  },
  ref
) {
  const variantCls =
    variant === "primary"
      ? "bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink border border-transparent"
      : variant === "danger"
      ? "bg-a-danger hover:opacity-92 text-a-on-ink border border-transparent"
      : variant === "ghost"
      ? "bg-transparent hover:bg-a-subtle text-a-text-2 hover:text-a-text-1 border border-transparent"
      : "bg-a-surface hover:bg-a-subtle text-a-text-1 border border-a-border-strong shadow-[var(--a-shadow-card)]";

  const sizeCls =
    size === "sm"
      ? "min-h-[44px] lg:min-h-[30px] lg:h-[30px] px-2.5 text-[13px] rounded-[6px] gap-1.5"
      : "min-h-[44px] lg:min-h-[36px] lg:h-[36px] px-3.5 text-[13px] rounded-[8px] gap-2";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`admin-press inline-flex items-center justify-center font-medium whitespace-nowrap select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantCls} ${sizeCls} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
      {kbd && (
        <span
          className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[12px] leading-none ${
            variant === "primary" || variant === "danger"
              ? "bg-a-surface/15 text-a-on-ink"
              : "bg-a-subtle text-a-text-3 border border-a-border"
          }`}
        >
          {kbd}
        </span>
      )}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  tooltip?: string;
  kbd?: string;
  variant?: "ghost" | "secondary" | "danger";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { tooltip, kbd, variant = "ghost", className = "", children, type = "button", ...rest },
  ref
) {
  const variantCls =
    variant === "secondary"
      ? "bg-a-surface hover:bg-a-subtle text-a-text-2 hover:text-a-text-1 border border-a-border"
      : variant === "danger"
      ? "bg-a-danger-bg hover:opacity-90 text-a-danger border border-transparent"
      : "bg-transparent hover:bg-a-subtle text-a-text-2 hover:text-a-text-1 border border-transparent";

  const btn = (
    <button
      ref={ref}
      type={type}
      className={`admin-press inline-flex items-center justify-center min-w-[44px] min-h-[44px] lg:min-w-[32px] lg:min-h-[32px] lg:w-8 lg:h-8 rounded-[8px] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${variantCls} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );

  if (tooltip || rest["aria-label"]) {
    return (
      <Tooltip content={tooltip || rest["aria-label"]} kbd={kbd}>
        {btn}
      </Tooltip>
    );
  }
  return btn;
});

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className = "",
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const map: Record<Tone, { pill: string; dotCls: string }> = {
    neutral: { pill: "bg-a-subtle text-a-text-2", dotCls: "bg-a-text-3" },
    success: { pill: "bg-a-success-bg text-a-success", dotCls: "bg-a-success" },
    warning: { pill: "bg-a-warning-bg text-a-warning", dotCls: "bg-a-warning" },
    danger: { pill: "bg-a-danger-bg text-a-danger", dotCls: "bg-a-danger" },
    info: { pill: "bg-a-info-bg text-a-info", dotCls: "bg-a-info" },
    accent: { pill: "bg-a-accent-soft text-a-accent-text", dotCls: "bg-a-accent" },
  };
  const s = map[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] leading-4 font-medium ${s.pill} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dotCls}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "unknown").toLowerCase();
  const toneMap: Record<string, Tone> = {
    new: "info",
    confirmed: "warning",
    packed: "neutral",
    shipped: "info",
    delivered: "success",
    cancelled: "danger",
    verified: "success",
    pending: "warning",
    refunded: "neutral",
    ready: "success",
    in_stock: "success",
    limited: "warning",
    low_stock: "warning",
    waitlist: "neutral",
    prebooking: "warning",
    upcoming: "neutral",
    live: "success",
    archived: "neutral",
    sold: "danger",
    sold_out: "danger",
    acquired: "accent",
    hidden: "neutral",
    active: "success",
    paused: "neutral",
    disabled: "danger",
    converted: "success",
    contacted: "info",
    recovered: "success",
    unrecovered: "warning",
  };
  const tone = toneMap[normalized] || "neutral";
  const label = normalized.replace(/_/g, " ");
  return (
    <Badge tone={tone} dot className="capitalize">
      {label}
    </Badge>
  );
}

export function Skeleton({ className = "h-4 w-24" }: { className?: string }) {
  return <div className={`admin-skeleton ${className}`} aria-hidden="true" />;
}

export function KpiSkeleton() {
  return (
    <div className="bg-a-surface border border-a-border rounded-[14px] p-5 space-y-3">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3.5 w-44" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-a-surface border border-a-border rounded-[14px] overflow-hidden">
      <div className="bg-a-subtle border-b border-a-border px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-a-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 h-11 flex items-center gap-4">
            {Array.from({ length: cols }).map((__, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
      <div className="w-11 h-11 rounded-full bg-a-subtle border border-a-border flex items-center justify-center text-a-text-3 mb-3">
        {icon}
      </div>
      <p className="text-[15px] font-semibold text-a-text-1">{title}</p>
      <p className="text-[13px] text-a-text-2 max-w-md mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
