"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyThCls } from "./_legacyShared";

export default function AbandonedTab() {
  const { data } = useAdmin();

  return (
    <div className={`${legacyCardCls} overflow-hidden`}>
      <div className="p-5 border-b border-a-border bg-a-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-a-text-1">
          Abandoned Checkouts &amp; Drop-Off Recovery
        </h2>
        <p className="text-[13px] text-a-text-2 mt-0.5">
          Tracks visitors who opened checkout or started filling their details, showing the exact step where they stopped and a 1-click WhatsApp recovery link.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr>
              <th className={legacyThCls}>Visitor / Contact</th>
              <th className={legacyThCls}>Last Step Reached</th>
              <th className={legacyThCls}>Pieces in Bag</th>
              <th className={legacyThCls}>Bag Value</th>
              <th className={legacyThCls}>Status</th>
              <th className={`${legacyThCls} text-right`}>Recovery Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {data.abandonedCheckouts.map((a) => (
              <tr key={a.sessionId} className="admin-row-hover">
                <td className="py-3.5 px-4">
                  <p className="font-medium text-a-text-1">
                    {a.customerName || `Visitor ${a.visitorId.slice(0, 10)}`}
                  </p>
                  <p className="font-num text-a-text-2">
                    {a.customerPhone || "No phone entered yet"} · {a.district}
                  </p>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded bg-a-danger-bg text-a-danger font-mono font-medium text-[12px]">
                    {a.lastStep}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {a.items.map((i, idx) => (
                    <p key={idx} className="text-a-text-1">
                      • {i.name} × <span className="font-num">{i.quantity}</span>
                    </p>
                  ))}
                </td>
                <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">
                  {formatBDT(a.subtotalBDT)}
                </td>
                <td className="py-3.5 px-4">
                  {a.recovered ? (
                    <span className="text-a-success font-medium">Recovered ✓</span>
                  ) : (
                    <span className="text-a-warning font-medium">Unrecovered</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {a.customerPhone ? (
                    <a
                      href={toBdWhatsApp(
                        a.customerPhone,
                        `আসসালামু আলাইকুম ${a.customerName || ""}, we noticed you were inspecting ${
                          a.items[0]?.name || "a Noksha piece"
                        }. Let us know if we can assist with your order!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-a-success-bg text-a-success font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Recover via WhatsApp
                    </a>
                  ) : (
                    <span className="text-a-text-3">Exited before phone step</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
