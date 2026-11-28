"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, TrendingDown } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminAbandoned, formatRelativeTime, toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  ColumnDef,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  PageHeader,
  SegmentedControl,
  StatusBadge,
  Textarea,
} from "../ui";

const CONTACTED_STORAGE_KEY = "noksha_admin_contacted_abandoned";

function defaultReminderTemplate(cart: AdminAbandoned): string {
  const firstPiece = cart.items[0]?.name || "your selected Noksha piece";
  const greetingName = cart.customerName ? ` ${cart.customerName}` : "";
  return `আসসালামু আলাইকুম${greetingName}, warm greetings from Noksha (নকশা) Atelier. We noticed you were inspecting "${firstPiece}" at checkout. Please let us know if we can answer any questions about sizing, craftsmanship, or delivery across Bangladesh.`;
}

export default function AbandonedTab() {
  const { data, copyText, notify } = useAdmin();

  const [filter, setFilter] = useState<"unrecovered" | "contacted" | "recovered" | "all">(
    "unrecovered"
  );
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [reminderCart, setReminderCart] = useState<AdminAbandoned | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONTACTED_STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setContactedIds(new Set(saved));
    } catch {
      // ignore
    }
  }, []);

  const persistContacted = (next: Set<string>) => {
    setContactedIds(next);
    try {
      localStorage.setItem(CONTACTED_STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  const toggleContacted = (sessionId: string) => {
    const next = new Set(contactedIds);
    if (next.has(sessionId)) {
      next.delete(sessionId);
      notify("Moved back to unrecovered");
    } else {
      next.add(sessionId);
      notify("Marked cart as contacted");
    }
    persistContacted(next);
  };

  const filtered = useMemo(() => {
    return data.abandonedCheckouts.filter((a) => {
      const isContacted = contactedIds.has(a.sessionId);
      if (filter === "recovered") return a.recovered;
      if (filter === "contacted") return !a.recovered && isContacted;
      if (filter === "unrecovered") return !a.recovered && !isContacted;
      return true;
    });
  }, [data.abandonedCheckouts, filter, contactedIds]);

  const counts = useMemo(() => {
    let unrecovered = 0;
    let contacted = 0;
    let recovered = 0;
    for (const a of data.abandonedCheckouts) {
      if (a.recovered) recovered++;
      else if (contactedIds.has(a.sessionId)) contacted++;
      else unrecovered++;
    }
    return { unrecovered, contacted, recovered, all: data.abandonedCheckouts.length };
  }, [data.abandonedCheckouts, contactedIds]);

  const columns: ColumnDef<AdminAbandoned>[] = [
    {
      key: "visitor",
      header: "Collector / Visitor",
      render: (a) => {
        const isContacted = contactedIds.has(a.sessionId);
        return (
          <div className={isContacted && !a.recovered ? "opacity-65" : ""}>
            <p className="font-medium text-a-text-1">
              {a.customerName || `Visitor ${a.visitorId.slice(0, 8)}`}
            </p>
            {a.customerPhone ? (
              <div className="inline-flex items-center gap-1">
                <span className="font-num text-[12px] text-a-text-2">{a.customerPhone}</span>
                <button
                  type="button"
                  aria-label="Copy phone"
                  onClick={() => copyText(a.customerPhone, `Copied ${a.customerPhone}`)}
                  className="p-0.5 rounded hover:bg-a-subtle text-a-text-3 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-a-text-3">Exited before entering phone</p>
            )}
          </div>
        );
      },
    },
    {
      key: "items",
      header: "Pieces in Bag",
      render: (a) => (
        <div className="space-y-0.5 text-[13px]">
          {a.items.map((it, idx) => (
            <p key={idx} className="text-a-text-1">
              {it.name} × <span className="font-num">{it.quantity}</span>
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "step",
      header: "Last Checkout Step",
      render: (a) => <Badge tone="warning">{a.lastStep}</Badge>,
    },
    {
      key: "when",
      header: "Abandoned",
      sortValue: (a) => new Date(a.updatedAt).getTime(),
      render: (a) => (
        <span className="font-num text-[12px] text-a-text-3">
          {formatRelativeTime(a.updatedAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) =>
        a.recovered ? (
          <StatusBadge status="recovered" />
        ) : contactedIds.has(a.sessionId) ? (
          <StatusBadge status="contacted" />
        ) : (
          <StatusBadge status="unrecovered" />
        ),
    },
    {
      key: "value",
      header: "Bag Value",
      align: "right",
      numeric: true,
      sortValue: (a) => a.subtotalBDT,
      render: (a) => (
        <span className="font-num font-semibold text-a-text-1">{formatBDT(a.subtotalBDT)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => {
        const isContacted = contactedIds.has(a.sessionId);
        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            {a.customerPhone && !a.recovered && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageCircle className="w-3.5 h-3.5 text-a-success" />}
                onClick={() => {
                  setReminderCart(a);
                  setMessageDraft(defaultReminderTemplate(a));
                }}
              >
                Send WhatsApp reminder
              </Button>
            )}
            {!a.recovered && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Check className="w-3.5 h-3.5" />}
                onClick={() => toggleContacted(a.sessionId)}
              >
                {isContacted ? "Unmark" : "Mark contacted"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abandoned Carts"
        description="Follow up thoughtfully with collectors who paused during checkout using an editable WhatsApp message."
        toolbar={
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { id: "unrecovered", label: "Unrecovered", count: counts.unrecovered },
              { id: "contacted", label: "Contacted", count: counts.contacted },
              { id: "recovered", label: "Recovered", count: counts.recovered },
              { id: "all", label: "All", count: counts.all },
            ]}
          />
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={(a) => a.sessionId}
        emptyState={
          <EmptyState
            icon={<TrendingDown className="w-5 h-5" />}
            title="No abandoned carts in this view"
            description="Unrecovered checkout sessions with bag items will appear here automatically."
          />
        }
      />

      {/* Editable WhatsApp Recovery Dialog */}
      <Dialog
        open={Boolean(reminderCart)}
        onClose={() => setReminderCart(null)}
        title="Send WhatsApp reminder"
        description={
          reminderCart
            ? `Review or personalize the message for ${reminderCart.customerName || reminderCart.customerPhone} (${formatBDT(reminderCart.subtotalBDT)}).`
            : ""
        }
        maxWidthCls="max-w-[500px]"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReminderCart(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<MessageCircle className="w-4 h-4 text-a-accent" />}
              onClick={() => {
                if (!reminderCart) return;
                const url = toBdWhatsApp(reminderCart.customerPhone, messageDraft);
                window.open(url, "_blank", "noopener,noreferrer");
                const next = new Set(contactedIds);
                next.add(reminderCart.sessionId);
                persistContacted(next);
                setReminderCart(null);
              }}
            >
              Open WhatsApp &amp; mark contacted
            </Button>
          </>
        }
      >
        <Field label="Message template">
          <Textarea
            rows={4}
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  );
}
