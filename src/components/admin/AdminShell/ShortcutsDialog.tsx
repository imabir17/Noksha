"use client";

import React from "react";
import { Dialog, Kbd } from "../ui";

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Open command palette & global search" },
  { keys: ["/"], label: "Focus search bar in current view" },
  { keys: ["G", "O"], label: "Go to Command Overview" },
  { keys: ["G", "R"], label: "Go to Orders Pipeline" },
  { keys: ["G", "P"], label: "Go to Products & Inventory" },
  { keys: ["G", "C"], label: "Go to Customers CRM" },
  { keys: ["N"], label: "Create new item in current tab" },
  { keys: ["Esc"], label: "Close drawer, dialog, or menu" },
  { keys: ["?"], label: "Open keyboard shortcuts sheet" },
];

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      description="Navigate Noksha Studio without lifting your hands from the keyboard."
      maxWidthCls="max-w-[460px]"
    >
      <div className="divide-y divide-a-border">
        {SHORTCUTS.map((s) => (
          <div key={s.label} className="py-2.5 flex items-center justify-between gap-4">
            <span className="text-[13px] text-a-text-1">{s.label}</span>
            <div className="flex items-center gap-1 shrink-0">
              {s.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
