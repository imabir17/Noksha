"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Edit3, Plus, Tag, Trash2 } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import { DbPromoCode } from "@/lib/db";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
} from "../ui";

interface PromoDraft {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderBDT: number;
  maxUses: number;
  label: string;
  active: boolean;
  isEditingExisting?: boolean;
}

function makeEmptyPromo(): PromoDraft {
  return {
    code: "",
    discountType: "percent",
    discountValue: 10,
    minOrderBDT: 5000,
    maxUses: 100,
    label: "",
    active: true,
    isEditingExisting: false,
  };
}

export default function PromosTab() {
  const { data, postAction, copyText, triggerNewCounter } = useAdmin();

  const [draft, setDraft] = useState<PromoDraft | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DbPromoCode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lastTriggerRef = useRef(triggerNewCounter);

  const openDrawer = (p: PromoDraft) => {
    setDraft(p);
    setSnapshot(JSON.stringify(p));
    setErrors({});
  };

  useEffect(() => {
    if (triggerNewCounter !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerNewCounter;
      openDrawer(makeEmptyPromo());
    }
  }, [triggerNewCounter]);

  const isDirty = useMemo(() => {
    if (!draft) return false;
    return JSON.stringify(draft) !== snapshot;
  }, [draft, snapshot]);

  const livePreviewText = useMemo(() => {
    if (!draft) return "";
    const minStr =
      draft.minOrderBDT > 0
        ? `on orders above ${formatBDT(draft.minOrderBDT)}`
        : "with no minimum order";
    if (draft.discountType === "fixed") {
      return `Customer saves ${formatBDT(draft.discountValue || 0)} ${minStr}.`;
    }
    const sampleBase = Math.max(draft.minOrderBDT || 8500, 8500);
    const sampleSave = Math.round((sampleBase * (draft.discountValue || 0)) / 100);
    return `Customer saves ${draft.discountValue || 0}% ${minStr} (e.g. ${formatBDT(sampleSave)} off a ${formatBDT(sampleBase)} order).`;
  }, [draft]);

  const savePromo = async () => {
    if (!draft) return;
    const errs: Record<string, string> = {};
    const cleanCode = draft.code.trim().toUpperCase();
    if (!cleanCode) errs.code = "Promo code is required.";
    if (!draft.discountValue || draft.discountValue <= 0) {
      errs.discountValue = "Discount value must be greater than 0.";
    }
    if (draft.discountType === "percent" && draft.discountValue > 100) {
      errs.discountValue = "Percentage cannot exceed 100%.";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const ok = await postAction(
      {
        action: "save_promo",
        code: cleanCode,
        discountType: draft.discountType,
        discountValue: Number(draft.discountValue),
        minOrderBDT: Number(draft.minOrderBDT || 0),
        maxUses: Number(draft.maxUses || 0),
        label:
          draft.label.trim() ||
          (draft.discountType === "percent"
            ? `${draft.discountValue}% Courtesy`
            : `${formatBDT(draft.discountValue)} Courtesy`),
        active: draft.active,
      },
      `Saved promo code ${cleanCode}`
    );
    setSaving(false);
    if (ok) {
      setSnapshot(JSON.stringify(draft));
      setDraft(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo Codes"
        description="Manage collector courtesy codes, Founding Circle privileges, and seasonal offers."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4 text-a-accent" />}
            kbd="N"
            onClick={() => openDrawer(makeEmptyPromo())}
          >
            New promo code
          </Button>
        }
      />

      {data.promoCodes.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<Tag className="w-5 h-5" />}
            title="No courtesy codes yet"
            description="Create a percentage or fixed-amount promo code for collectors at checkout."
            action={
              <Button variant="secondary" size="sm" onClick={() => openDrawer(makeEmptyPromo())}>
                Create promo code
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.promoCodes.map((p) => {
            const pctUsed =
              p.maxUses > 0 ? Math.min(100, Math.round((p.usedCount / p.maxUses) * 100)) : 0;
            return (
              <Card key={p.code}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[15px] font-semibold tracking-wide px-2.5 py-0.5 rounded-[6px] bg-a-subtle border border-a-border text-a-text-1">
                          {p.code}
                        </span>
                        <IconButton
                          aria-label={`Copy promo code ${p.code}`}
                          tooltip="Copy code"
                          onClick={() => copyText(p.code, `Copied code ${p.code}`)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </IconButton>
                      </div>
                      <p className="text-[13px] text-a-text-2 mt-1.5 truncate">{p.label}</p>
                    </div>

                    {/* Accessible Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(p.active)}
                      aria-label={`Toggle ${p.code} active status`}
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
                          `${p.code} ${!p.active ? "activated" : "paused"}`
                        )
                      }
                      className={`admin-press relative inline-flex h-6 w-10 shrink-0 rounded-full border border-transparent transition-colors cursor-pointer ${
                        p.active ? "bg-a-ink-btn" : "bg-a-border-strong"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-a-surface shadow transition-transform ${
                          p.active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-a-border">
                    <div>
                      <p className="text-[12px] text-a-text-3">Privilege</p>
                      <p className="font-num text-[20px] font-semibold text-a-text-1">
                        {p.discountType === "percent"
                          ? `${p.discountValue}% off`
                          : `${formatBDT(p.discountValue)} off`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-a-text-3">Min. order</p>
                      <p className="font-num text-[14px] font-medium text-a-text-1">
                        {p.minOrderBDT > 0 ? formatBDT(p.minOrderBDT) : "None"}
                      </p>
                    </div>
                  </div>

                  {/* Usage progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-a-text-3">Redemptions</span>
                      <span className="font-num font-medium text-a-text-1">
                        {p.usedCount} / {p.maxUses > 0 ? p.maxUses : "∞"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-a-subtle overflow-hidden">
                      <div
                        className="h-full bg-a-accent rounded-full"
                        style={{ width: p.maxUses > 0 ? `${pctUsed}%` : "12%" }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Badge tone={p.active ? "success" : "neutral"} dot>
                      {p.active ? "Active" : "Paused"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <IconButton
                        aria-label={`Edit ${p.code}`}
                        tooltip="Edit promo"
                        onClick={() =>
                          openDrawer({
                            code: p.code,
                            discountType: p.discountType as "percent" | "fixed",
                            discountValue: p.discountValue,
                            minOrderBDT: p.minOrderBDT,
                            maxUses: p.maxUses,
                            label: p.label,
                            active: Boolean(p.active),
                            isEditingExisting: true,
                          })
                        }
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${p.code}`}
                        tooltip="Delete promo"
                        variant="danger"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Promo Create / Edit Drawer */}
      <Drawer
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        isDirty={isDirty}
        widthCls="sm:max-w-[460px]"
        title={draft?.isEditingExisting ? `Edit ${draft.code}` : "New promo code"}
        subtitle="Codes become redeemable at checkout immediately when active."
        footer={
          <>
            <div />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button variant="primary" loading={saving} onClick={savePromo}>
                Save promo code
              </Button>
            </div>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {/* Live Preview Banner */}
            <div className="p-3.5 rounded-[10px] bg-a-accent-soft border border-a-border text-[13px]">
              <p className="text-[12px] uppercase tracking-[0.04em] font-medium text-a-accent-text">
                Live checkout preview
              </p>
              <p className="font-num text-a-text-1 font-medium mt-0.5">{livePreviewText}</p>
            </div>

            <Field label="Promo code (uppercase)" required error={errors.code}>
              <Input
                error={Boolean(errors.code)}
                disabled={draft.isEditingExisting}
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SHUVO10 or EID500"
                className="font-mono uppercase"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount type">
                <Select
                  value={draft.discountType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      discountType: e.target.value as "percent" | "fixed",
                    })
                  }
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount (৳ BDT)</option>
                </Select>
              </Field>
              <Field
                label={draft.discountType === "percent" ? "Percentage (%)" : "Amount (৳ BDT)"}
                required
                error={errors.discountValue}
              >
                <Input
                  type="number"
                  numeral
                  error={Boolean(errors.discountValue)}
                  value={draft.discountValue}
                  onChange={(e) =>
                    setDraft({ ...draft, discountValue: Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Minimum order (৳ BDT)">
                <Input
                  type="number"
                  numeral
                  min={0}
                  value={draft.minOrderBDT}
                  onChange={(e) => setDraft({ ...draft, minOrderBDT: Number(e.target.value) })}
                />
              </Field>
              <Field label="Maximum redemptions">
                <Input
                  type="number"
                  numeral
                  min={0}
                  value={draft.maxUses}
                  onChange={(e) => setDraft({ ...draft, maxUses: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Display label">
              <Input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. Founding Collector Courtesy"
              />
            </Field>

            <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="w-4 h-4 accent-[var(--a-ink-btn)]"
              />
              <span className="font-medium text-a-text-1">Active immediately</span>
            </label>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete promo code ${deleteTarget.code}?` : "Delete promo code?"}
        description={
          deleteTarget
            ? `This permanently deletes ${deleteTarget.code}. Customers will no longer be able to redeem it at checkout.`
            : ""
        }
        confirmLabel="Delete code"
        danger
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          await postAction(
            { action: "delete_promo", code: deleteTarget.code },
            `Deleted promo code ${deleteTarget.code}`
          );
          setDeleting(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
