"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { LegacyStatusBadge, legacyCardCls, legacyThCls } from "./_legacyShared";

export default function CancellationsTab() {
  const { data, postAction } = useAdmin();

  const pendingCancels = data.orders.filter((o) => o.cancellationRequested);
  const cancelledHistory = data.orders.filter(
    (o) => o.status === "cancelled" && !o.cancellationRequested
  );

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-a-text-2">
        Review customer order cancellation requests submitted before shipment. Approving a cancellation marks the order as <strong>Cancelled</strong> and automatically restores product stock.
      </p>

      <div className="space-y-8">
        <div className={`${legacyCardCls} overflow-hidden`}>
          <div className="px-5 py-3.5 bg-a-subtle border-b border-a-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-danger">
              Pending Cancellation Requests (<span className="font-num">{pendingCancels.length}</span>)
            </h2>
          </div>

          {pendingCancels.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-a-text-2">
              No pending cancellation requests 🎉
            </div>
          ) : (
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr>
                  <th className={legacyThCls}>Order</th>
                  <th className={legacyThCls}>Customer</th>
                  <th className={legacyThCls}>Pieces &amp; Total</th>
                  <th className={legacyThCls}>Current Stage</th>
                  <th className={legacyThCls}>Customer Reason</th>
                  <th className={`${legacyThCls} text-right`}>Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-a-border">
                {pendingCancels.map((o) => (
                  <tr key={o.id} className="admin-row-hover">
                    <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">
                      <p>{o.id}</p>
                      <p className="text-[12px] font-normal text-a-text-3">
                        {new Date(o.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-a-text-1">{o.customerName}</p>
                      <p className="font-num text-a-text-2">{o.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-a-text-1">
                        {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                      </p>
                      <p className="font-num font-semibold text-a-text-1 mt-0.5">
                        {formatBDT(o.totalBDT)} ({o.paymentMethod.toUpperCase()})
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <LegacyStatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-a-danger font-medium">
                        “{o.cancellationReason || "Requested by customer"}”
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <a
                        href={toBdWhatsApp(
                          o.customerPhone,
                          `আসসালামু আলাইকুম ${o.customerName}, we received your cancellation request for Noksha order ${o.id}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-press px-2.5 py-1.5 rounded-lg bg-a-success-bg text-a-success text-[12px] font-medium inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          postAction(
                            { action: "resolve_cancellation", id: o.id, decision: "approve" },
                            `Approved cancellation for ${o.id}`
                          )
                        }
                        className="admin-press px-3 py-1.5 rounded-lg bg-a-danger text-a-on-ink text-[12px] font-medium cursor-pointer"
                      >
                        Approve &amp; Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          postAction(
                            { action: "resolve_cancellation", id: o.id, decision: "dismiss" },
                            `Dismissed cancellation request for ${o.id}`
                          )
                        }
                        className="admin-press px-3 py-1.5 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border text-[12px] font-medium cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {cancelledHistory.length > 0 && (
          <div className={`${legacyCardCls} overflow-hidden`}>
            <div className="px-5 py-3.5 bg-a-subtle border-b border-a-border">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1">
                Cancelled Orders History (<span className="font-num">{cancelledHistory.length}</span>)
              </h3>
            </div>
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr>
                  <th className={legacyThCls}>Order</th>
                  <th className={legacyThCls}>Customer</th>
                  <th className={legacyThCls}>Total</th>
                  <th className={legacyThCls}>Reason</th>
                  <th className={legacyThCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-a-border">
                {cancelledHistory.map((o) => (
                  <tr key={o.id} className="admin-row-hover">
                    <td className="py-3 px-4 font-num font-semibold text-a-text-1">{o.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-a-text-1">{o.customerName}</span> ·{" "}
                      <span className="font-num text-a-text-2">{o.customerPhone}</span>
                    </td>
                    <td className="py-3 px-4 font-num font-semibold text-a-text-1">
                      {formatBDT(o.totalBDT)}
                    </td>
                    <td className="py-3 px-4 text-a-text-2">
                      {o.cancellationReason || "Cancelled by staff"}
                    </td>
                    <td className="py-3 px-4">
                      <LegacyStatusBadge status="cancelled" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
