"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Gift,
  MessageCircle,
  Phone,
  Printer,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import {
  AdminOrder,
  downloadCsv,
  formatRelativeTime,
  ORDER_STATUSES,
  toBdWhatsApp,
} from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  Drawer,
  DropdownMenu,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  SearchInput,
  SegmentedControl,
  Select,
  StatusBadge,
  Textarea,
  Tooltip,
} from "../ui";

const PIPELINE_STEPS = ["new", "confirmed", "packed", "shipped", "delivered"] as const;

export default function OrdersTab() {
  const {
    data,
    loading,
    error,
    refresh,
    postAction,
    copyText,
    openPrintSlip,
    openMultiplePrintSlips,
    queryParams,
    setQueryParam,
  } = useAdmin();

  const statusFilter = queryParams.get("status") || "all";
  const paymentFilter = queryParams.get("payment") || "all";
  const selectedOrderId = queryParams.get("order") || null;

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Order Drawer state
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState("");
  const [courierDraft, setCourierDraft] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [courierSaveState, setCourierSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeOrder = useMemo(
    () => (selectedOrderId ? data.orders.find((o) => o.id === selectedOrderId) || null : null),
    [data.orders, selectedOrderId]
  );

  const productImgMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of data.products) {
      m.set(p.id, p.image);
      m.set(p.name, p.image);
    }
    return m;
  }, [data.products]);

  useEffect(() => {
    if (!activeOrder) {
      setOptimisticStatus(null);
      return;
    }
    setOptimisticStatus(activeOrder.status);
    setPaymentDraft(activeOrder.paymentStatus);
    setCourierDraft(activeOrder.courierName || "");
    setTrackingDraft(activeOrder.trackingCode || "");
    setInternalNoteDraft(activeOrder.internalNotes || "");
    setCourierSaveState("idle");
  }, [activeOrder]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.orders.length };
    for (const st of ORDER_STATUSES) counts[st] = 0;
    for (const o of data.orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [data.orders]);

  const filteredOrders = useMemo(() => {
    return data.orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q) ||
          (o.trxId && o.trxId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data.orders, statusFilter, paymentFilter, search]);

  const exportOrdersCsv = (ordersToExport: AdminOrder[]) => {
    downloadCsv(
      "noksha-orders.csv",
      [
        "Order ID",
        "Date",
        "Customer",
        "Phone",
        "District",
        "Address",
        "Payment Method",
        "Payment Status",
        "TrxID",
        "Total BDT",
        "Order Status",
        "Courier",
        "Tracking",
      ],
      ordersToExport.map((o) => [
        o.id,
        o.createdAt,
        o.customerName,
        o.customerPhone,
        o.district,
        o.address,
        o.paymentMethod,
        o.paymentStatus,
        o.trxId,
        o.totalBDT,
        o.status,
        o.courierName,
        o.trackingCode,
      ])
    );
  };

  const changeOrderStatus = async (order: AdminOrder, nextStatus: string, noteText?: string) => {
    const prevStatus = order.status;
    if (prevStatus === nextStatus) return;

    if (activeOrder?.id === order.id) {
      setOptimisticStatus(nextStatus);
    }

    await postAction(
      {
        action: "update_order",
        id: order.id,
        status: nextStatus,
        paymentStatus: order.paymentStatus,
        courierName: activeOrder?.id === order.id ? courierDraft : order.courierName,
        trackingCode: activeOrder?.id === order.id ? trackingDraft : order.trackingCode,
        internalNotes: activeOrder?.id === order.id ? internalNoteDraft : order.internalNotes,
        note: noteText || `Moved from ${prevStatus} to ${nextStatus}`,
      },
      `${order.id} marked as ${nextStatus}`,
      {
        undoAction: {
          label: "Undo",
          onClick: () => {
            if (activeOrder?.id === order.id) setOptimisticStatus(prevStatus);
            postAction(
              {
                action: "update_order",
                id: order.id,
                status: prevStatus,
                paymentStatus: order.paymentStatus,
                courierName: order.courierName,
                trackingCode: order.trackingCode,
                internalNotes: order.internalNotes,
                note: `Reverted status back to ${prevStatus}`,
              },
              `Reverted ${order.id} to ${prevStatus}`
            );
          },
        },
      }
    );
  };

  const autoSaveLogistics = async (
    nextPayment = paymentDraft,
    nextCourier = courierDraft,
    nextTracking = trackingDraft,
    nextNotes = internalNoteDraft
  ) => {
    if (!activeOrder) return;
    if (
      nextPayment === activeOrder.paymentStatus &&
      nextCourier === (activeOrder.courierName || "") &&
      nextTracking === (activeOrder.trackingCode || "") &&
      nextNotes === (activeOrder.internalNotes || "")
    ) {
      return;
    }
    setCourierSaveState("saving");
    const ok = await postAction(
      {
        action: "update_order",
        id: activeOrder.id,
        status: optimisticStatus || activeOrder.status,
        paymentStatus: nextPayment,
        courierName: nextCourier,
        trackingCode: nextTracking,
        internalNotes: nextNotes,
        note: "",
      },
      "Saved",
      { silent: true }
    );
    setCourierSaveState(ok ? "saved" : "idle");
    if (ok) {
      setTimeout(() => setCourierSaveState((s) => (s === "saved" ? "idle" : s)), 2200);
    }
  };

  const runBulkStatus = async (targetStatus: string) => {
    const selected = data.orders.filter((o) => selectedIds.has(o.id));
    if (!selected.length) return;
    setBulkBusy(true);
    await Promise.all(
      selected.map((o) =>
        fetch("/api/admin/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_order",
            id: o.id,
            status: targetStatus,
            paymentStatus: o.paymentStatus,
            courierName: o.courierName,
            trackingCode: o.trackingCode,
            internalNotes: o.internalNotes,
            note: `Bulk updated to ${targetStatus}`,
          }),
        })
      )
    );
    await refresh();
    setBulkBusy(false);
    setSelectedIds(new Set());
  };

  const copyTrackingUrl = (orderId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://itsnoksha.com";
    copyText(`${origin}/track-order?order=${encodeURIComponent(orderId)}`, `Copied tracking link for ${orderId}`);
  };

  const columns: ColumnDef<AdminOrder>[] = [
    {
      key: "order",
      header: "Order",
      sortValue: (o) => new Date(o.createdAt).getTime(),
      render: (o) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-num font-semibold text-a-text-1">{o.id}</span>
            {o.cancellationRequested && (
              <Badge tone="danger">Cancel req.</Badge>
            )}
          </div>
          <Tooltip content={new Date(o.createdAt).toLocaleString("en-GB")}>
            <span className="font-num text-[12px] text-a-text-3">
              {formatRelativeTime(o.createdAt)}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (o) => o.customerName,
      render: (o) => (
        <div>
          <p className="font-medium text-a-text-1">{o.customerName}</p>
          <p className="font-num text-[12px] text-a-text-3">
            {o.customerPhone} · {o.district}
          </p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Pieces",
      render: (o) => (
        <div className="max-w-[220px]">
          <p className="text-[13px] text-a-text-1 truncate">
            {o.items[0]?.name || "Piece"}
            {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
          </p>
          <p className="font-num text-[12px] text-a-text-3">
            {o.items.reduce((s, i) => s + i.quantity, 0)} qty
            {o.courierName ? ` · ${o.courierName}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (o) => (
        <div className="space-y-0.5">
          <p className="text-[12px] uppercase font-medium text-a-text-2">{o.paymentMethod}</p>
          <StatusBadge status={o.paymentStatus} />
        </div>
      ),
    },
    {
      key: "status",
      header: "Stage",
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      numeric: true,
      sortValue: (o) => o.totalBDT,
      render: (o) => (
        <span className="font-num font-semibold text-a-text-1">{formatBDT(o.totalBDT)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => {
        const idx = PIPELINE_STEPS.indexOf(o.status as (typeof PIPELINE_STEPS)[number]);
        const nextStage =
          idx >= 0 && idx < PIPELINE_STEPS.length - 1 ? PIPELINE_STEPS[idx + 1] : null;

        return (
          <div className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <IconButton
              aria-label={`Print slip for ${o.id}`}
              tooltip="Print packing slip"
              onClick={() => openPrintSlip(o)}
            >
              <Printer className="w-4 h-4" />
            </IconButton>
            <DropdownMenu
              label={`Actions for ${o.id}`}
              items={[
                {
                  label: "Inspect order",
                  icon: <ExternalLink className="w-3.5 h-3.5" />,
                  onClick: () => setQueryParam("order", o.id),
                },
                ...(nextStage
                  ? [
                      {
                        label: `Mark as ${nextStage}`,
                        icon: <ArrowRight className="w-3.5 h-3.5" />,
                        onClick: () => changeOrderStatus(o, nextStage),
                      },
                    ]
                  : []),
                {
                  label: "Print packing slip",
                  icon: <Printer className="w-3.5 h-3.5" />,
                  onClick: () => openPrintSlip(o),
                },
                {
                  label: "Copy tracking link",
                  icon: <Copy className="w-3.5 h-3.5" />,
                  onClick: () => copyTrackingUrl(o.id),
                },
                ...(o.status !== "cancelled"
                  ? [
                      {
                        label: "Cancel order",
                        icon: <XCircle className="w-3.5 h-3.5" />,
                        danger: true,
                        onClick: () => setCancelTarget(o),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        );
      },
    },
  ];

  const currentStage = optimisticStatus || activeOrder?.status || "new";
  const currentStepIdx = PIPELINE_STEPS.indexOf(currentStage as (typeof PIPELINE_STEPS)[number]);
  const nextStep =
    currentStepIdx >= 0 && currentStepIdx < PIPELINE_STEPS.length - 1
      ? PIPELINE_STEPS[currentStepIdx + 1]
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Pipeline"
        description="Click any order to open its dispatch drawer, advance stages with one click, assign couriers, or print packing slips."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => exportOrdersCsv(filteredOrders)}
          >
            Export CSV
          </Button>
        }
        toolbar={
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <SegmentedControl
              value={statusFilter}
              onChange={(val) => setQueryParam("status", val)}
              options={[
                { id: "all", label: "All", count: statusCounts.all },
                { id: "new", label: "New", count: statusCounts.new },
                { id: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
                { id: "packed", label: "Packed", count: statusCounts.packed },
                { id: "shipped", label: "Shipped", count: statusCounts.shipped },
                { id: "delivered", label: "Delivered", count: statusCounts.delivered },
                { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
              ]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-64">
                <SearchInput
                  inputRef={(el) => {
                    searchInputRef.current = el;
                    if (el) el.setAttribute("data-admin-search", "true");
                  }}
                  value={search}
                  onChange={setSearch}
                  placeholder="Order ID, phone, name…"
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  aria-label="Filter by payment status"
                  value={paymentFilter}
                  onChange={(e) => setQueryParam("payment", e.target.value)}
                >
                  <option value="all">All payments</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                </Select>
              </div>
            </div>
          </div>
        }
      />

      {/* Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="admin-surface-enter sticky top-16 z-20 px-4 py-2.5 rounded-[10px] bg-a-ink-btn text-a-on-ink shadow-[var(--a-shadow-pop)] flex flex-wrap items-center justify-between gap-3">
          <span className="font-num text-[13px] font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "order" : "orders"} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => runBulkStatus("confirmed")}
              className="admin-press px-2.5 py-1.5 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-[12px] font-medium cursor-pointer"
            >
              Mark confirmed
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => runBulkStatus("packed")}
              className="admin-press px-2.5 py-1.5 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-[12px] font-medium cursor-pointer"
            >
              Mark packed
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => runBulkStatus("shipped")}
              className="admin-press px-2.5 py-1.5 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-[12px] font-medium cursor-pointer"
            >
              Mark shipped
            </button>
            <button
              type="button"
              onClick={() => {
                const chosen = data.orders.filter((o) => selectedIds.has(o.id));
                openMultiplePrintSlips(chosen);
              }}
              className="admin-press px-2.5 py-1.5 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-a-accent" />
              Print slips
            </button>
            <button
              type="button"
              onClick={() => {
                const chosen = data.orders.filter((o) => selectedIds.has(o.id));
                exportOrdersCsv(chosen);
              }}
              className="admin-press px-2.5 py-1.5 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-[12px] font-medium cursor-pointer"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="admin-press px-2 py-1.5 text-[12px] text-a-on-ink/70 hover:text-a-on-ink cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredOrders}
        getRowId={(o) => o.id}
        activeRowId={selectedOrderId}
        onRowClick={(o) => setQueryParam("order", o.id)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading && !data.orders.length}
        error={error}
        onRetry={refresh}
        renderMobileCard={(o) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-num font-semibold text-a-text-1">{o.id}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <div>
                <p className="font-medium text-a-text-1">{o.customerName}</p>
                <p className="font-num text-[12px] text-a-text-3">
                  {o.customerPhone} · {o.district}
                </p>
              </div>
              <div className="text-right">
                <p className="font-num font-semibold text-a-text-1">{formatBDT(o.totalBDT)}</p>
                <p className="text-[12px] uppercase text-a-text-3">{o.paymentStatus}</p>
              </div>
            </div>
          </div>
        )}
        emptyState={
          <EmptyState
            icon={<ShoppingBag className="w-5 h-5" />}
            title={
              statusFilter !== "all" || search || paymentFilter !== "all"
                ? "No orders match your current filters"
                : "No orders yet"
            }
            description={
              statusFilter !== "all" || search || paymentFilter !== "all"
                ? "Clear your status, payment, or search filters to view the full pipeline."
                : "Share your latest Drop or storefront link to receive your first collector order."
            }
            action={
              (statusFilter !== "all" || search || paymentFilter !== "all") && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setQueryParam("status", null);
                    setQueryParam("payment", null);
                  }}
                >
                  Reset filters
                </Button>
              )
            }
          />
        }
      />

      {/* Right-Side Order Detail & Dispatch Drawer */}
      <Drawer
        open={Boolean(activeOrder)}
        onClose={() => setQueryParam("order", null)}
        widthCls="sm:max-w-[540px]"
        title={
          activeOrder && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-num">{activeOrder.id}</span>
              <IconButton
                aria-label="Copy order ID"
                tooltip="Copy order ID"
                tooltipSide="bottom"
                onClick={() => copyText(activeOrder.id, `Copied ${activeOrder.id}`)}
              >
                <Copy className="w-3.5 h-3.5" />
              </IconButton>
              <StatusBadge status={currentStage} />
            </div>
          )
        }
        subtitle={
          activeOrder && (
            <Tooltip content={new Date(activeOrder.createdAt).toLocaleString("en-GB")} side="bottom">
              <span className="font-num text-[12px] text-a-text-3 cursor-default">
                Placed {formatRelativeTime(activeOrder.createdAt)} ·{" "}
                {new Date(activeOrder.createdAt).toLocaleDateString("en-GB")}
              </span>
            </Tooltip>
          )
        }
        footer={
          activeOrder && (
            <>
              <div>
                {currentStage !== "cancelled" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-a-danger hover:!bg-a-danger-bg"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => setCancelTarget(activeOrder)}
                  >
                    Cancel order
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => openPrintSlip(activeOrder)}
                >
                  Print slip
                </Button>
                {nextStep && currentStage !== "cancelled" && (
                  <Button
                    variant="primary"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => changeOrderStatus(activeOrder, nextStep)}
                  >
                    Mark {nextStep}
                  </Button>
                )}
              </div>
            </>
          )
        }
      >
        {activeOrder && (
          <div className="space-y-6">
            {/* 1. Interactive Status Stepper */}
            {currentStage !== "cancelled" && (
              <div className="p-3.5 rounded-[10px] bg-a-subtle border border-a-border space-y-2.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-a-text-2 uppercase tracking-[0.04em]">
                    Pipeline stage
                  </span>
                  <span className="text-a-text-3">Click any step to update</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {PIPELINE_STEPS.map((step, idx) => {
                    const reached = idx <= currentStepIdx;
                    const isCurrent = step === currentStage;
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => changeOrderStatus(activeOrder, step)}
                        className={`admin-press py-1.5 px-1 rounded-[6px] text-[12px] font-medium capitalize text-center cursor-pointer border ${
                          isCurrent
                            ? "bg-a-ink-btn text-a-on-ink border-transparent"
                            : reached
                            ? "bg-a-surface text-a-text-1 border-a-border"
                            : "bg-transparent text-a-text-3 border-transparent hover:bg-a-surface/60"
                        }`}
                      >
                        {step}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Customer & Delivery Block */}
            <div className="p-4 rounded-[10px] bg-a-surface border border-a-border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium">
                    Recipient
                  </p>
                  <p className="text-[15px] font-semibold text-a-text-1 mt-0.5">
                    {activeOrder.customerName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-num text-[13px] text-a-text-2">
                      {activeOrder.customerPhone}
                    </span>
                    <button
                      type="button"
                      aria-label="Copy customer phone"
                      onClick={() =>
                        copyText(activeOrder.customerPhone, `Copied ${activeOrder.customerPhone}`)
                      }
                      className="p-1 rounded hover:bg-a-subtle text-a-text-3 hover:text-a-text-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  {activeOrder.customerEmail && (
                    <p className="text-[12px] text-a-text-3">{activeOrder.customerEmail}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={toBdWhatsApp(
                      activeOrder.customerPhone,
                      `আসসালামু আলাইকুম ${activeOrder.customerName}, this is Noksha Client Care regarding your order ${activeOrder.id} (${formatBDT(
                        activeOrder.totalBDT
                      )}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-press inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-success-bg text-a-success text-[12px] font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${activeOrder.customerPhone}`}
                    aria-label="Call customer"
                    className="admin-press inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-a-subtle hover:bg-a-subtle-hover text-a-text-2 border border-a-border"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-2.5 border-t border-a-border text-[13px] text-a-text-1">
                <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium mb-0.5">
                  Delivery address
                </p>
                <p>
                  {activeOrder.address}
                  {activeOrder.district ? ` · ${activeOrder.district}` : ""}
                </p>
              </div>
            </div>

            {/* 3. Gift Note & Customer Notes Highlights */}
            {(activeOrder.giftNote || activeOrder.notes) && (
              <div className="space-y-2">
                {activeOrder.giftNote && (
                  <div className="p-3.5 rounded-[10px] bg-a-accent-soft border border-a-border flex items-start gap-2.5">
                    <Gift className="w-4 h-4 text-a-accent-text shrink-0 mt-0.5" />
                    <div className="text-[13px]">
                      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-a-accent-text">
                        Calligraphy card note
                      </p>
                      <p className="text-a-text-1 italic mt-0.5">“{activeOrder.giftNote}”</p>
                    </div>
                  </div>
                )}
                {activeOrder.notes && (
                  <div className="p-3 rounded-[10px] bg-a-subtle border border-a-border text-[13px]">
                    <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-a-text-3">
                      Customer delivery note:{" "}
                    </span>
                    <span className="text-a-text-1">{activeOrder.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Items + Totals + Payment */}
            <div className="rounded-[10px] border border-a-border overflow-hidden">
              <div className="px-4 py-2.5 bg-a-subtle border-b border-a-border flex items-center justify-between text-[12px]">
                <span className="font-medium uppercase tracking-[0.04em] text-a-text-3">
                  Ordered pieces (<span className="font-num">{activeOrder.items.length}</span>)
                </span>
                <span className="uppercase font-medium text-a-text-2">
                  {activeOrder.paymentMethod}
                </span>
              </div>

              <div className="divide-y divide-a-border bg-a-surface">
                {activeOrder.items.map((item, idx) => {
                  const thumb =
                    item.image ||
                    (item.productId && productImgMap.get(item.productId)) ||
                    productImgMap.get(item.name) ||
                    "/images/light-jamdani-pendant.png";
                  return (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={thumb}
                          alt={item.name}
                          className="w-11 h-13 rounded-[6px] object-cover border border-a-border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-a-text-1 truncate">
                            {item.name}
                          </p>
                          <p className="font-num text-[12px] text-a-text-3">
                            {item.selectedColor} · {formatBDT(item.priceBDT)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-num text-[13px] font-semibold text-a-text-1 shrink-0">
                        {formatBDT(item.priceBDT * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-a-subtle border-t border-a-border space-y-1.5 text-[13px]">
                <div className="flex justify-between text-a-text-2">
                  <span>Subtotal</span>
                  <span className="font-num">{formatBDT(activeOrder.subtotalBDT)}</span>
                </div>
                {activeOrder.discountBDT > 0 && (
                  <div className="flex justify-between text-a-success">
                    <span>Courtesy ({activeOrder.promoCode || "Discount"})</span>
                    <span className="font-num">− {formatBDT(activeOrder.discountBDT)}</span>
                  </div>
                )}
                <div className="flex justify-between text-a-text-2">
                  <span>Delivery</span>
                  <span className="font-num">
                    {activeOrder.deliveryBDT === 0
                      ? "Complimentary"
                      : formatBDT(activeOrder.deliveryBDT)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-a-border text-[14px] font-semibold text-a-text-1">
                  <span>Total</span>
                  <span className="font-num">{formatBDT(activeOrder.totalBDT)}</span>
                </div>
              </div>
            </div>

            {/* 5. Payment & Inline Auto-Saved Courier Dispatch */}
            <div className="p-4 rounded-[10px] bg-a-surface border border-a-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-a-text-1">
                  <Truck className="w-4 h-4 text-a-text-3" />
                  <span>Payment &amp; courier dispatch</span>
                </div>
                {courierSaveState === "saving" && (
                  <span className="text-[12px] text-a-text-3">Saving…</span>
                )}
                {courierSaveState === "saved" && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-a-success font-medium">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>

              {activeOrder.trxId && (
                <div className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-a-subtle border border-a-border text-[12px]">
                  <span className="text-a-text-2">
                    TrxID: <strong className="font-num text-a-text-1">{activeOrder.trxId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(activeOrder.trxId, `Copied TrxID ${activeOrder.trxId}`)}
                    className="inline-flex items-center gap-1 text-a-accent-text font-medium hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment status">
                  <Select
                    value={paymentDraft}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPaymentDraft(next);
                      autoSaveLogistics(next, courierDraft, trackingDraft, internalNoteDraft);
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="refunded">Refunded</option>
                  </Select>
                </Field>
                <Field label="Courier service">
                  <Input
                    value={courierDraft}
                    onChange={(e) => setCourierDraft(e.target.value)}
                    onBlur={() => autoSaveLogistics()}
                    placeholder="e.g. Pathao / Steadfast"
                  />
                </Field>
                <Field label="Tracking code" className="sm:col-span-2">
                  <Input
                    numeral
                    value={trackingDraft}
                    onChange={(e) => setTrackingDraft(e.target.value)}
                    onBlur={() => autoSaveLogistics()}
                    placeholder="Auto-saves when you click out"
                  />
                </Field>
                <Field label="Internal staff notes" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    onBlur={() => autoSaveLogistics()}
                    placeholder="Private packaging or client-care notes…"
                  />
                </Field>
              </div>
            </div>

            {/* 6. Timeline */}
            {activeOrder.timeline && activeOrder.timeline.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium">
                  Activity timeline
                </p>
                <div className="space-y-2 border-l border-a-border pl-3.5">
                  {activeOrder.timeline.map((t, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-[12px]">
                      <div>
                        <span className="uppercase font-medium text-a-text-1">{t.status}</span>
                        {t.note && <span className="text-a-text-2"> — {t.note}</span>}
                        <span className="text-a-text-3"> ({t.by})</span>
                      </div>
                      <span className="font-num text-a-text-3 shrink-0">
                        {formatRelativeTime(t.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Destructive Order Cancellation Confirmation */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={cancelTarget ? `Cancel order ${cancelTarget.id}?` : "Cancel order?"}
        description={
          cancelTarget
            ? `This marks ${cancelTarget.id} (${formatBDT(cancelTarget.totalBDT)}) for ${cancelTarget.customerName} as Cancelled and restores item inventory.`
            : ""
        }
        confirmLabel="Cancel order"
        danger
        loading={cancelling}
        inputLabel="Cancellation reason (optional)"
        inputPlaceholder="e.g. Customer requested change of piece"
        onCancel={() => setCancelTarget(null)}
        onConfirm={async (reason) => {
          if (!cancelTarget) return;
          setCancelling(true);
          await changeOrderStatus(
            cancelTarget,
            "cancelled",
            reason || "Order cancelled by studio staff"
          );
          setCancelling(false);
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
