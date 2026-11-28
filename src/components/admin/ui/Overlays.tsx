"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, X } from "lucide-react";

/* Renders overlays on document.body so ancestor transforms (page entrance
   animation) can't shrink `position: fixed` to the content area. The
   `admin-ui` wrapper keeps the design tokens in scope. */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<div className="admin-ui">{children}</div>, document.body);
}
import { Button, IconButton } from "./Primitives";
import { Input, Field } from "./Forms";

function useFocusTrap(open: boolean, containerRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }, 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus?.();
    };
  }, [open, containerRef, onClose]);
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  footer,
  side = "right",
  widthCls = "sm:max-w-[500px]",
  isDirty = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
  widthCls?: string;
  isDirty?: boolean;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const attemptClose = () => {
    if (isDirty) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  useFocusTrap(open && !confirmDiscard, panelRef, attemptClose);

  useEffect(() => {
    if (!open) setConfirmDiscard(false);
  }, [open]);

  if (!open) return null;

  const sideCls =
    side === "left"
      ? "left-0 border-r border-a-border admin-drawer-left"
      : "right-0 border-l border-a-border admin-drawer-right";

  return (
    <Portal>
    <div className="fixed inset-0 z-40 flex print:hidden">
      <div
        className="admin-backdrop-enter fixed inset-0 bg-a-overlay"
        onClick={attemptClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 bottom-0 w-full ${widthCls} bg-a-surface text-a-text-1 shadow-[var(--a-shadow-pop)] flex flex-col z-50 ${sideCls}`}
      >
        <div className="px-5 py-4 border-b border-a-border flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="a-title">{title}</div>
            {subtitle && <div className="a-body-sm mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerActions}
            <IconButton
              aria-label="Close panel"
              tooltip="Close"
              tooltipSide="bottom"
              kbd="Esc"
              onClick={attemptClose}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <div className="admin-scroll flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-a-border bg-a-subtle flex flex-wrap items-center justify-between gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>

      {confirmDiscard && (
        <ConfirmDialog
          open={confirmDiscard}
          title="Discard unsaved changes?"
          description="Your edits in this panel have not been saved yet. Closing now will discard them."
          confirmLabel="Discard changes"
          danger
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={() => {
            setConfirmDiscard(false);
            onClose();
          }}
        />
      )}
    </div>
    </Portal>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  maxWidthCls = "max-w-[440px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthCls?: string;
  children?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef, onClose);

  if (!open) return null;

  return (
    <Portal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:hidden">
      <div
        className="admin-backdrop-enter fixed inset-0 bg-a-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={`admin-dialog-enter relative z-10 w-full ${maxWidthCls} bg-a-surface border border-a-border rounded-[14px] shadow-[var(--a-shadow-pop)] overflow-hidden`}
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="a-title">{title}</h2>
            {description && <p className="a-body-sm mt-1">{description}</p>}
          </div>
          <IconButton aria-label="Close dialog" onClick={onClose}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        {children && <div className="px-5 pb-4">{children}</div>}
        {footer && (
          <div className="px-5 py-3.5 bg-a-subtle border-t border-a-border flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
    </Portal>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  inputLabel,
  inputPlaceholder,
  initialInputValue = "",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  initialInputValue?: string;
  onConfirm: (inputValue: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initialInputValue);

  useEffect(() => {
    if (open) setVal(initialInputValue);
  }, [open, initialInputValue]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={loading}
            onClick={() => onConfirm(val)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {inputLabel && (
        <Field label={inputLabel}>
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={inputPlaceholder}
          />
        </Field>
      )}
    </Dialog>
  );
}

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export function DropdownMenu({
  items,
  label = "Row actions",
}: {
  items: DropdownItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) {
          setOpen(false);
          item.onClick();
        }
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, items, activeIndex]);

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        aria-label={label}
        tooltip={label}
        onClick={() => {
          setActiveIndex(0);
          setOpen((o) => !o);
        }}
      >
        <MoreHorizontal className="w-4 h-4" />
      </IconButton>

      {open && (
        <div
          role="menu"
          style={{ ["--popover-origin" as string]: "top right" }}
          className="admin-popover-enter absolute right-0 top-full mt-1 z-30 min-w-[180px] p-1 rounded-[10px] bg-a-surface border border-a-border shadow-[var(--a-shadow-pop)]"
        >
          {items.map((item, idx) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`admin-press w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left cursor-pointer ${
                item.danger
                  ? "text-a-danger hover:bg-a-danger-bg"
                  : idx === activeIndex
                  ? "bg-a-subtle text-a-text-1"
                  : "text-a-text-1 hover:bg-a-subtle"
              }`}
            >
              {item.icon && <span className="w-4 h-4 shrink-0 flex items-center">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
