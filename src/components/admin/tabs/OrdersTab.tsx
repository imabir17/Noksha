"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, MessageCircle, Printer, Search } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminOrder, downloadCsv, ORDER_STATUSES, toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { LegacyStatusBadge, legacyCardCls, legacyInputCls, legacyThCls } from "./_legacyShared";

export default function OrdersTab() {
  const { data, postAction, openPrintSlip, queryParams, setQueryParam } = useAdmin();

  const orderFilter = queryParams.get("status") || "all";
  const selectedOrderId = queryParams.get("order") || null;

  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderStatusDraft, setOrderStatusDraft] = useState("");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState("");
  const [courierDraft, setCourierDraft] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [timelineNoteDraft, setTimelineNoteDraft] = useState("");

  const openOrderInspector = (o: AdminOrder) => {
    setSelectedOrder(o);
    setOrderStatusDraft(o.status);
    setPaymentStatusDraft(o.paymentStatus);
    setCourierDraft(o.courierName);
    setTrackingDraft(o.trackingCode);
    setInternalNoteDraft(o.internalNotes);
    setTimelineNoteDraft("");
    setQueryParam("order", o.id);
  };

  useEffect(() => {
    if (selectedOrderId) {
      const found = data.orders.find((o) => o.id === selectedOrderId);
      if (found && selectedOrder?.id !== found.id) {
        setSelectedOrder(found);
        setOrderStatusDraft(found.status);
        setPaymentStatusDraft(found.paymentStatus);
        setCourierDraft(found.courierName);
        setTrackingDraft(found.trackingCode);
        setInternalNoteDraft(found.internalNotes);
        setTimelineNoteDraft("");
      }
    }
  }, [data.orders, selectedOrder?.id, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    return data.orders.filter((o) => {
      if (orderFilter !== "all" && o.status !== orderFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.orders, orderFilter, orderSearch]);

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 ${legacyCardCls} p-4`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", ...ORDER_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setQueryParam("status", st)}
              className={`admin-press px-3 py-1.5 rounded-lg text-[12px] font-medium uppercase cursor-pointer ${
                orderFilter === st
                  ? "bg-a-ink-btn text-a-on-ink"
                  : "bg-a-subtle text-a-text-2 hover:bg-a-subtle-hover"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-a-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search ID, name, phone, district…"
              className="pl-8 pr-3 py-1.5 bg-a-surface border border-a-border-strong rounded-lg text-[13px] text-a-text-1 focus:outline-none focus:border-a-accent"
            />
          </div>
          <button
            type="button"
            onClick={() =>
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
                filteredOrders.map((o) => [
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
              )
            }
            className="admin-press px-3.5 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`lg:col-span-7 ${legacyCardCls} overflow-hidden`}>
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr>
                <th className={legacyThCls}>Order</th>
                <th className={legacyThCls}>Customer</th>
                <th className={legacyThCls}>Payment</th>
                <th className={legacyThCls}>Total</th>
                <th className={legacyThCls}>Status</th>
                <th className={`${legacyThCls} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => openOrderInspector(o)}
                  className={`cursor-pointer admin-row-hover ${
                    selectedOrder?.id === o.id ? "bg-a-subtle" : ""
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <p className="font-num font-semibold text-a-text-1">{o.id}</p>
                    <p className="font-num text-[12px] text-a-text-3">
                      {new Date(o.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-a-text-1">{o.customerName}</p>
                    <p className="font-num text-a-text-2">
                      {o.customerPhone} · {o.district}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 uppercase">
                    <span className="font-medium text-a-text-1">{o.paymentMethod}</span>
                    <span
                      className={`block text-[12px] font-medium ${
                        o.paymentStatus === "verified" ? "text-a-success" : "text-a-warning"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">
                    {formatBDT(o.totalBDT)}
                  </td>
                  <td className="py-3.5 px-4">
                    <LegacyStatusBadge status={o.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPrintSlip(o);
                      }}
                      className="admin-press inline-flex items-center gap-1 px-2.5 py-1 rounded bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border font-medium cursor-pointer"
                      title="Print Invoice / Packing Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`lg:col-span-5 ${legacyCardCls} p-5 space-y-5`}>
          {!selectedOrder ? (
            <p className="text-[13px] text-a-text-2 py-12 text-center">
              Click any order on the left to inspect items, verify TrxID, update pipeline status, or print its packing slip.
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between border-b border-a-border pb-4">
                <div>
                  <span className="text-[12px] uppercase tracking-widest text-a-accent-text font-medium">
                    Order Inspector
                  </span>
                  <h3 className="font-num text-2xl font-semibold text-a-text-1 mt-0.5">
                    {selectedOrder.id}
                  </h3>
                  <p className="text-[13px] text-a-text-2">
                    {selectedOrder.customerName} ·{" "}
                    <span className="font-num">{selectedOrder.customerPhone}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={toBdWhatsApp(
                      selectedOrder.customerPhone,
                      `আসসালামু আলাইকুম ${selectedOrder.customerName}, this is Noksha Client Care regarding your order ${selectedOrder.id} (${formatBDT(
                        selectedOrder.totalBDT
                      )}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-press px-3 py-1.5 rounded-lg bg-a-success-bg text-a-success text-[13px] font-medium flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => openPrintSlip(selectedOrder)}
                    className="admin-press px-3 py-1.5 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border text-[13px] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Slip
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-[13px]">
                <p className="uppercase text-[12px] text-a-text-3 font-medium">Ordered Pieces</p>
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-a-subtle p-3 rounded-lg border border-a-border"
                  >
                    <div>
                      <p className="font-medium text-a-text-1">
                        {item.name} × <span className="font-num">{item.quantity}</span>
                      </p>
                      <p className="text-a-text-2">{item.selectedColor}</p>
                    </div>
                    <span className="font-num font-semibold text-a-text-1">
                      {formatBDT(item.priceBDT * item.quantity)}
                    </span>
                  </div>
                ))}
                {selectedOrder.giftNote && (
                  <p className="p-3 rounded-lg bg-a-accent-soft text-a-accent-text font-medium">
                    <strong>Calligraphy Card:</strong> “{selectedOrder.giftNote}”
                  </p>
                )}
                <p className="text-a-text-1 pt-1">
                  <strong>Delivery Address:</strong> {selectedOrder.address},{" "}
                  {selectedOrder.district}
                </p>
                {selectedOrder.trxId && (
                  <p className="text-a-success font-num font-medium">
                    <strong>TrxID:</strong> {selectedOrder.trxId}
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t border-a-border pt-4 text-[13px]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-a-text-2 mb-1">
                      Order Pipeline Stage
                    </label>
                    <select
                      value={orderStatusDraft}
                      onChange={(e) => setOrderStatusDraft(e.target.value)}
                      className={`${legacyInputCls} uppercase`}
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-a-text-2 mb-1">Payment Status</label>
                    <select
                      value={paymentStatusDraft}
                      onChange={(e) => setPaymentStatusDraft(e.target.value)}
                      className={`${legacyInputCls} uppercase`}
                    >
                      <option value="pending">pending</option>
                      <option value="verified">verified</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-a-text-2 mb-1">Courier Name</label>
                    <input
                      type="text"
                      value={courierDraft}
                      onChange={(e) => setCourierDraft(e.target.value)}
                      placeholder="e.g. Pathao Prime / Steadfast"
                      className={legacyInputCls}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-a-text-2 mb-1">Tracking Code</label>
                    <input
                      type="text"
                      value={trackingDraft}
                      onChange={(e) => setTrackingDraft(e.target.value)}
                      placeholder="e.g. PTH-BD-99281"
                      className={legacyInputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-a-text-2 mb-1">
                    Status Transition Note (logged to timeline)
                  </label>
                  <input
                    type="text"
                    value={timelineNoteDraft}
                    onChange={(e) => setTimelineNoteDraft(e.target.value)}
                    placeholder="e.g. Dispatched with muslin wrap & calligraphy card"
                    className={legacyInputCls}
                  />
                </div>

                <div>
                  <label className="block font-medium text-a-text-2 mb-1">
                    Internal Staff Notes
                  </label>
                  <textarea
                    rows={2}
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    className={legacyInputCls}
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await postAction(
                      {
                        action: "update_order",
                        id: selectedOrder.id,
                        status: orderStatusDraft,
                        paymentStatus: paymentStatusDraft,
                        courierName: courierDraft,
                        trackingCode: trackingDraft,
                        internalNotes: internalNoteDraft,
                        note: timelineNoteDraft,
                      },
                      `Order ${selectedOrder.id} updated`
                    );
                    if (ok) {
                      setSelectedOrder((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: orderStatusDraft,
                              paymentStatus: paymentStatusDraft,
                              courierName: courierDraft,
                              trackingCode: trackingDraft,
                              internalNotes: internalNoteDraft,
                            }
                          : null
                      );
                    }
                  }}
                  className="admin-press w-full py-2.5 bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium rounded-lg cursor-pointer"
                >
                  Save Order &amp; Pipeline Update
                </button>
              </div>

              <div className="border-t border-a-border pt-4 space-y-2 text-[13px]">
                <p className="uppercase text-[12px] text-a-text-3 font-medium">
                  Order Status Timeline
                </p>
                <div className="space-y-2">
                  {selectedOrder.timeline.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 text-a-text-1"
                    >
                      <div>
                        <span className="uppercase font-medium text-a-accent-text">
                          {t.status}
                        </span>{" "}
                        — <span>{t.note}</span> <span className="text-a-text-3">({t.by})</span>
                      </div>
                      <span className="font-num text-[12px] text-a-text-3 shrink-0">
                        {new Date(t.at).toLocaleString("en-GB")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
