"use client";

import React, { useState } from "react";
import { Download, MessageCircle } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { AdminCustomer, downloadCsv, toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyInputCls, legacyThCls } from "./_legacyShared";

export default function CustomersTab() {
  const { data, postAction } = useAdmin();
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [custTagsDraft, setCustTagsDraft] = useState("");
  const [custNotesDraft, setCustNotesDraft] = useState("");
  const [custVipDraft, setCustVipDraft] = useState(false);

  const openCustomerInspector = (c: AdminCustomer) => {
    setSelectedCustomer(c);
    setCustTagsDraft(c.tags);
    setCustNotesDraft(c.notes);
    setCustVipDraft(c.vip);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className={`lg:col-span-7 ${legacyCardCls} overflow-hidden`}>
        <div className="p-4 border-b border-a-border bg-a-subtle flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1">
            Collector CRM Directory (<span className="font-num">{data.customers.length}</span>)
          </h2>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "noksha-customers-crm.csv",
                ["Name", "Phone", "Email", "District", "Orders", "Lifetime Value BDT", "VIP", "Tags", "Notes"],
                data.customers.map((c) => [
                  c.name,
                  c.phone,
                  c.email,
                  c.district,
                  c.ordersCount,
                  c.totalSpentBDT,
                  c.vip ? "Yes" : "No",
                  c.tags,
                  c.notes,
                ])
              )
            }
            className="admin-press px-3.5 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CRM CSV
          </button>
        </div>
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr>
              <th className={legacyThCls}>Collector</th>
              <th className={legacyThCls}>District</th>
              <th className={legacyThCls}>Orders</th>
              <th className={legacyThCls}>Lifetime Value</th>
              <th className={legacyThCls}>Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {data.customers.map((c) => (
              <tr
                key={c.phone}
                onClick={() => openCustomerInspector(c)}
                className={`cursor-pointer admin-row-hover ${
                  selectedCustomer?.phone === c.phone ? "bg-a-subtle" : ""
                }`}
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-a-text-1">{c.name}</span>
                    {c.vip && (
                      <span className="px-2 py-0.5 rounded bg-a-accent-soft text-a-accent-text text-[12px] font-medium">
                        VIP
                      </span>
                    )}
                    {c.ordersCount > 1 && (
                      <span className="px-2 py-0.5 rounded bg-a-success-bg text-a-success text-[12px] font-medium">
                        Repeat
                      </span>
                    )}
                  </div>
                  <p className="font-num text-a-text-2">{c.phone}</p>
                </td>
                <td className="py-3.5 px-4 text-a-text-2">{c.district}</td>
                <td className="py-3.5 px-4 font-num font-medium text-a-text-1">{c.ordersCount}</td>
                <td className="py-3.5 px-4 font-num font-semibold text-a-success">
                  {formatBDT(c.totalSpentBDT)}
                </td>
                <td className="py-3.5 px-4 text-a-text-2">{c.tags}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`lg:col-span-5 ${legacyCardCls} p-5 space-y-4`}>
        {!selectedCustomer ? (
          <p className="text-[13px] text-a-text-2 py-10 text-center">
            Select any customer to view their order history, lifetime spend, VIP status, and CRM notes.
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-a-border pb-4">
              <div>
                <h3 className="text-lg font-semibold text-a-text-1">{selectedCustomer.name}</h3>
                <p className="font-num text-[13px] font-medium text-a-accent-text">
                  {selectedCustomer.phone}
                </p>
                <p className="text-[13px] text-a-text-2">
                  {selectedCustomer.address}, {selectedCustomer.district}
                </p>
              </div>
              <a
                href={toBdWhatsApp(
                  selectedCustomer.phone,
                  `আসসালামু আলাইকুম ${selectedCustomer.name}, warm greetings from Noksha (নকশা)!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-press px-3 py-1.5 rounded-lg bg-a-success-bg text-a-success text-[13px] font-medium flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="p-3 rounded-lg bg-a-subtle border border-a-border">
                <p className="text-a-text-3 text-[12px]">Lifetime Value</p>
                <p className="font-num text-lg font-semibold text-a-success">
                  {formatBDT(selectedCustomer.totalSpentBDT)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-a-subtle border border-a-border">
                <p className="text-a-text-3 text-[12px]">Orders Placed</p>
                <p className="font-num text-lg font-semibold text-a-text-1">
                  {selectedCustomer.ordersCount}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={custVipDraft}
                  onChange={(e) => setCustVipDraft(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium text-a-text-1">Mark as VIP Collector</span>
              </label>

              <div>
                <label className="block mb-1">CRM Segment Tags</label>
                <input
                  type="text"
                  value={custTagsDraft}
                  onChange={(e) => setCustTagsDraft(e.target.value)}
                  placeholder="e.g. VIP, Kantha Collector, Bridal"
                  className={legacyInputCls}
                />
              </div>

              <div>
                <label className="block mb-1">Collector Preferences &amp; Notes</label>
                <textarea
                  rows={3}
                  value={custNotesDraft}
                  onChange={(e) => setCustNotesDraft(e.target.value)}
                  className={legacyInputCls}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  postAction(
                    {
                      action: "save_customer_note",
                      phone: selectedCustomer.phone,
                      tags: custTagsDraft,
                      notes: custNotesDraft,
                      vip: custVipDraft,
                    },
                    `Updated CRM profile for ${selectedCustomer.name}`
                  )
                }
                className="admin-press w-full py-2.5 bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium rounded-lg cursor-pointer"
              >
                Save CRM Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
