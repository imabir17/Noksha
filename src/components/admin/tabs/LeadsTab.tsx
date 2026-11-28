"use client";

import React, { useState } from "react";
import { Download, MessageCircle } from "lucide-react";
import { downloadCsv, toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyThCls } from "./_legacyShared";

export default function LeadsTab() {
  const { data, postAction } = useAdmin();
  const [leadFilter, setLeadFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 ${legacyCardCls} p-4`}>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Leads" },
            { id: "waitlist", label: "Batch #02 Piece Reservations" },
            { id: "founding_circle", label: "Founding Circle Members" },
            { id: "newsletter", label: "Newsletter Subscribers" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setLeadFilter(t.id)}
              className={`admin-press px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer ${
                leadFilter === t.id
                  ? "bg-a-ink-btn text-a-on-ink"
                  : "bg-a-subtle text-a-text-2 hover:bg-a-subtle-hover"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "noksha-leads.csv",
              ["ID", "Type", "Name", "Phone", "Email", "Piece / Membership", "Status", "Notes", "Date"],
              data.leads.map((l) => [
                l.id,
                l.type,
                l.name,
                l.phone,
                l.email,
                l.product_name,
                l.status,
                l.notes,
                l.created_at,
              ])
            )
          }
          className="admin-press px-3.5 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export Leads CSV
        </button>
      </div>

      <div className={`${legacyCardCls} overflow-hidden`}>
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr>
              <th className={legacyThCls}>Type</th>
              <th className={legacyThCls}>Contact</th>
              <th className={legacyThCls}>Piece / Circle No.</th>
              <th className={legacyThCls}>Status</th>
              <th className={legacyThCls}>Date</th>
              <th className={`${legacyThCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {data.leads
              .filter((l) => leadFilter === "all" || l.type === leadFilter)
              .map((l) => (
                <tr key={l.id} className="admin-row-hover">
                  <td className="py-3.5 px-4 uppercase font-medium text-a-accent-text text-[12px]">
                    {l.type.replace("_", " ")}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-a-text-1">{l.name || "—"}</p>
                    <p className="font-num text-a-text-2">
                      {l.phone} {l.email ? `· ${l.email}` : ""}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-a-text-1">{l.product_name}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={l.status}
                      onChange={(e) =>
                        postAction(
                          {
                            action: "update_lead",
                            id: l.id,
                            status: e.target.value,
                            notes: l.notes,
                          },
                          "Lead status updated"
                        )
                      }
                      className="px-2.5 py-1 bg-a-surface border border-a-border-strong rounded text-[12px] uppercase font-medium text-a-text-1"
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="converted">converted</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 font-num text-a-text-2">
                    {new Date(l.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    {l.type === "waitlist" && l.product_id && l.status !== "converted" && (
                      <button
                        type="button"
                        onClick={() =>
                          postAction(
                            {
                              action: "mark_waitlist_sold",
                              leadId: l.id,
                              productId: l.product_id,
                              customerName: l.name,
                            },
                            `Marked "${l.product_name}" sold to ${l.name}`
                          )
                        }
                        className="admin-press inline-flex items-center gap-1 px-2.5 py-1 rounded bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium text-[12px] cursor-pointer"
                      >
                        Mark Sold to Buyer
                      </button>
                    )}
                    {l.phone && (
                      <a
                        href={toBdWhatsApp(
                          l.phone,
                          `আসসালামু আলাইকুম ${l.name}, regarding "${l.product_name}" from Noksha!`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-press inline-flex items-center gap-1 px-2.5 py-1 rounded bg-a-success-bg text-a-success font-medium text-[12px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
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
