"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyInputCls, legacyThCls } from "./_legacyShared";

export default function PromosTab() {
  const { data, postAction } = useAdmin();
  const [promoCodeDraft, setPromoCodeDraft] = useState("");
  const [promoTypeDraft, setPromoTypeDraft] = useState<"percent" | "fixed">("percent");
  const [promoValDraft, setPromoValDraft] = useState("10");
  const [promoMinDraft, setPromoMinDraft] = useState("0");
  const [promoMaxUsesDraft, setPromoMaxUsesDraft] = useState("100");
  const [promoLabelDraft, setPromoLabelDraft] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className={`lg:col-span-5 ${legacyCardCls} p-5 space-y-4`}>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1 border-b border-a-border pb-2.5">
          Create or Update Courtesy / Promo Code
        </h2>
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block mb-1">Code (Uppercase) *</label>
            <input
              type="text"
              value={promoCodeDraft}
              onChange={(e) => setPromoCodeDraft(e.target.value.toUpperCase())}
              placeholder="e.g. EID20 or SHUVO10"
              className={`${legacyInputCls} uppercase font-mono`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Discount Type</label>
              <select
                value={promoTypeDraft}
                onChange={(e) => setPromoTypeDraft(e.target.value as "percent" | "fixed")}
                className={legacyInputCls}
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (৳ BDT)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">
                Value ({promoTypeDraft === "percent" ? "%" : "৳"})
              </label>
              <input
                type="number"
                value={promoValDraft}
                onChange={(e) => setPromoValDraft(e.target.value)}
                className={`${legacyInputCls} font-num`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Min. Order (BDT ৳)</label>
              <input
                type="number"
                value={promoMinDraft}
                onChange={(e) => setPromoMinDraft(e.target.value)}
                className={`${legacyInputCls} font-num`}
              />
            </div>
            <div>
              <label className="block mb-1">Max Uses</label>
              <input
                type="number"
                value={promoMaxUsesDraft}
                onChange={(e) => setPromoMaxUsesDraft(e.target.value)}
                className={`${legacyInputCls} font-num`}
              />
            </div>
          </div>
          <div>
            <label className="block mb-1">Display Label</label>
            <input
              type="text"
              value={promoLabelDraft}
              onChange={(e) => setPromoLabelDraft(e.target.value)}
              placeholder="e.g. 15% Eid Collector Privilege"
              className={legacyInputCls}
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = await postAction(
                {
                  action: "save_promo",
                  code: promoCodeDraft,
                  discountType: promoTypeDraft,
                  discountValue: Number(promoValDraft),
                  minOrderBDT: Number(promoMinDraft),
                  maxUses: Number(promoMaxUsesDraft),
                  label:
                    promoLabelDraft ||
                    (promoTypeDraft === "percent"
                      ? `${promoValDraft}% Courtesy`
                      : `৳${promoValDraft} Courtesy`),
                  active: true,
                },
                `Saved promo code ${promoCodeDraft}`
              );
              if (ok) {
                setPromoCodeDraft("");
                setPromoLabelDraft("");
              }
            }}
            className="admin-press w-full py-2.5 bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium rounded-lg cursor-pointer"
          >
            Save Promo Code
          </button>
        </div>
      </div>

      <div className={`lg:col-span-7 ${legacyCardCls} overflow-hidden`}>
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr>
              <th className={legacyThCls}>Code</th>
              <th className={legacyThCls}>Discount</th>
              <th className={legacyThCls}>Min Order</th>
              <th className={legacyThCls}>Redemptions</th>
              <th className={legacyThCls}>Status</th>
              <th className={`${legacyThCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {data.promoCodes.map((p) => (
              <tr key={p.code} className="admin-row-hover">
                <td className="py-3.5 px-4">
                  <p className="font-mono font-semibold text-a-text-1 text-sm">{p.code}</p>
                  <p className="text-a-text-2">{p.label}</p>
                </td>
                <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">
                  {p.discountType === "percent" ? `${p.discountValue}%` : formatBDT(p.discountValue)}
                </td>
                <td className="py-3.5 px-4 font-num text-a-text-2">
                  {formatBDT(p.minOrderBDT)}
                </td>
                <td className="py-3.5 px-4 font-num font-medium text-a-text-1">
                  {p.usedCount} / {p.maxUses || "∞"}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() =>
                      postAction(
                        {
                          action: "save_promo",
                          code: p.code,
                          discountType: p.discountType,
                          discountValue: p.discountValue,
                          minOrderBDT: p.minOrderBDT,
                          maxUses: p.maxUses,
                          label: p.label,
                          active: !p.active,
                        },
                        `Toggled ${p.code}`
                      )
                    }
                    className={`admin-press px-2.5 py-0.5 rounded text-[12px] font-medium cursor-pointer ${
                      p.active
                        ? "bg-a-success-bg text-a-success"
                        : "bg-a-subtle text-a-text-2"
                    }`}
                  >
                    {p.active ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      postAction({ action: "delete_promo", code: p.code }, `Deleted ${p.code}`)
                    }
                    aria-label={`Delete ${p.code}`}
                    className="admin-press p-1.5 rounded bg-a-danger-bg text-a-danger cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
