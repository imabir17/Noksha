"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, MessageCircle, XCircle } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminOrder, formatRelativeTime, toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Button,
  Card,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "../ui";

export default function CancellationsTab() {
  const { data, postAction, copyText, setActiveTab } = useAdmin();

  const [approveTarget, setApproveTarget] = useState<AdminOrder | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminOrder | null>(null);
  const [busy, setBusy] = useState(false);

  const pendingCancels = data.orders.filter((o) => o.cancellationRequested);
  const cancelledHistory = data.orders.filter(
    (o) => o.status === "cancelled" && !o.cancellationRequested
  );

  const historyCols: ColumnDef<AdminOrder>[] = [
    {
      key: "order",
      header: "Order",
      render: (o) => (
        <button
          type="button"
          onClick={() => setActiveTab("orders", { order: o.id })}
          className="font-num font-semibold text-a-text-1 hover:underline cursor-pointer"
        >
          {o.id}
        </button>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div>
          <span className="font-medium text-a-text-1">{o.customerName}</span>
          <span className="font-num text-[12px] text-a-text-3 ml-2">{o.customerPhone}</span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (o) => (
        <span className="text-[13px] text-a-text-2">
          {o.cancellationReason || "Cancelled by studio staff"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      numeric: true,
      render: (o) => (
        <span className="font-num font-medium text-a-text-1">{formatBDT(o.totalBDT)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: () => <StatusBadge status="cancelled" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cancellation Requests"
        description="Review pre-shipment cancellation requests verified by phone number. Approving cancels the order and automatically restores piece inventory."
      />

      {pendingCancels.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<CheckCircle2 className="w-5 h-5 text-a-success" />}
            title="No pending cancellation requests 🎉"
            description="Every customer cancellation request has been reviewed and resolved."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingCancels.map((o) => (
            <Card key={o.id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("orders", { order: o.id })}
                        className="font-num text-[16px] font-semibold text-a-text-1 hover:underline cursor-pointer"
                      >
                        {o.id}
                      </button>
                      <button
                        type="button"
                        aria-label={`Copy ${o.id}`}
                        onClick={() => copyText(o.id, `Copied ${o.id}`)}
                        className="p-1 rounded hover:bg-a-subtle text-a-text-3 hover:text-a-text-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-[13px] text-a-text-2 mt-1">
                      {o.customerName} · <span className="font-num">{o.customerPhone}</span>
                    </p>
                  </div>
                  <span className="font-num text-[12px] text-a-text-3 shrink-0">
                    {formatRelativeTime(o.updatedAt || o.createdAt)}
                  </span>
                </div>

                <div className="p-3 rounded-[8px] bg-a-danger-bg text-[13px]">
                  <p className="text-[12px] uppercase tracking-[0.04em] font-medium text-a-danger">
                    Customer reason
                  </p>
                  <p className="text-a-text-1 mt-0.5">
                    “{o.cancellationReason || "Customer requested pre-shipment cancellation"}”
                  </p>
                </div>

                <div className="flex items-center justify-between text-[13px] pt-1 border-t border-a-border">
                  <span className="text-a-text-2 truncate">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </span>
                  <span className="font-num font-semibold text-a-text-1 shrink-0 ml-3">
                    {formatBDT(o.totalBDT)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={toBdWhatsApp(
                      o.customerPhone,
                      `আসসালামু আলাইকুম ${o.customerName}, we received your cancellation request for Noksha order ${o.id}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-press inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border text-[12px] font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-a-success" />
                    WhatsApp customer
                  </a>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRejectTarget(o)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => setApproveTarget(o)}
                    >
                      Approve &amp; cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cancelledHistory.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="a-title">
            Cancelled orders history (<span className="font-num">{cancelledHistory.length}</span>)
          </h2>
          <DataTable
            columns={historyCols}
            rows={cancelledHistory}
            getRowId={(o) => o.id}
            onRowClick={(o) => setActiveTab("orders", { order: o.id })}
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(approveTarget)}
        title={approveTarget ? `Approve cancellation for ${approveTarget.id}?` : "Approve?"}
        description={
          approveTarget
            ? `This permanently marks ${approveTarget.id} (${formatBDT(approveTarget.totalBDT)}) as Cancelled and restores piece stock.`
            : ""
        }
        confirmLabel="Approve & cancel"
        danger
        loading={busy}
        onCancel={() => setApproveTarget(null)}
        onConfirm={async () => {
          if (!approveTarget) return;
          setBusy(true);
          await postAction(
            { action: "resolve_cancellation", id: approveTarget.id, decision: "approve" },
            `Approved cancellation for ${approveTarget.id}`
          );
          setBusy(false);
          setApproveTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title={rejectTarget ? `Reject cancellation request for ${rejectTarget.id}?` : "Reject?"}
        description="The order will remain active in its current dispatch stage."
        confirmLabel="Reject request"
        loading={busy}
        inputLabel="Optional note"
        inputPlaceholder="e.g. Confirmed with collector by phone to proceed with delivery"
        onCancel={() => setRejectTarget(null)}
        onConfirm={async () => {
          if (!rejectTarget) return;
          setBusy(true);
          await postAction(
            { action: "resolve_cancellation", id: rejectTarget.id, decision: "dismiss" },
            `Rejected cancellation request for ${rejectTarget.id}`
          );
          setBusy(false);
          setRejectTarget(null);
        }}
      />
    </div>
  );
}
