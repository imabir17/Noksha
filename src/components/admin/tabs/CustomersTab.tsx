"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Copy, Download, MessageCircle, Phone, Users } from "lucide-react";
import { formatBDT } from "@/data/nokshaData";
import {
  AdminCustomer,
  downloadCsv,
  formatRelativeTime,
  toBdWhatsApp,
} from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  ColumnDef,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  SearchInput,
  SegmentedControl,
  StatusBadge,
  Textarea,
} from "../ui";

const HIGH_VALUE_THRESHOLD = 15000;

export default function CustomersTab() {
  const {
    data,
    postAction,
    copyText,
    queryParams,
    setQueryParam,
    setActiveTab,
  } = useAdmin();

  const segment = queryParams.get("segment") || "all";
  const selectedPhone = queryParams.get("customer") || null;

  const [search, setSearch] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [vipDraft, setVipDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  const foundingPhones = useMemo(() => {
    const set = new Set<string>();
    for (const l of data.leads) {
      if (l.type === "founding_circle" && l.phone) {
        set.add(l.phone.replace(/\D/g, "").slice(-10));
      }
    }
    return set;
  }, [data.leads]);

  const isFoundingMember = (c: AdminCustomer) => {
    const norm = c.phone.replace(/\D/g, "").slice(-10);
    return (
      (norm && foundingPhones.has(norm)) ||
      (c.tags && c.tags.toLowerCase().includes("founding"))
    );
  };

  const activeCustomer = useMemo(
    () => (selectedPhone ? data.customers.find((c) => c.phone === selectedPhone) || null : null),
    [data.customers, selectedPhone]
  );

  useEffect(() => {
    if (!activeCustomer) return;
    setTagsDraft(activeCustomer.tags || "");
    setNotesDraft(activeCustomer.notes || "");
    setVipDraft(Boolean(activeCustomer.vip));
  }, [activeCustomer]);

  const isDirty = useMemo(() => {
    if (!activeCustomer) return false;
    return (
      tagsDraft !== (activeCustomer.tags || "") ||
      notesDraft !== (activeCustomer.notes || "") ||
      vipDraft !== Boolean(activeCustomer.vip)
    );
  }, [activeCustomer, notesDraft, tagsDraft, vipDraft]);

  const filteredCustomers = useMemo(() => {
    return data.customers.filter((c) => {
      if (segment === "repeat" && c.ordersCount <= 1) return false;
      if (segment === "high_value" && c.totalSpentBDT < HIGH_VALUE_THRESHOLD) return false;
      if (segment === "founding" && !c.vip && !isFoundingMember(c)) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          (c.tags && c.tags.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data.customers, segment, search, foundingPhones]);

  const customerOrders = useMemo(() => {
    if (!activeCustomer) return [];
    const norm = activeCustomer.phone.replace(/\D/g, "").slice(-10);
    return data.orders.filter(
      (o) =>
        activeCustomer.orderIds.includes(o.id) ||
        (norm && o.customerPhone.replace(/\D/g, "").slice(-10) === norm)
    );
  }, [activeCustomer, data.orders]);

  const customerLeads = useMemo(() => {
    if (!activeCustomer) return [];
    const norm = activeCustomer.phone.replace(/\D/g, "").slice(-10);
    if (!norm) return [];
    return data.leads.filter((l) => l.phone.replace(/\D/g, "").slice(-10) === norm);
  }, [activeCustomer, data.leads]);

  const columns: ColumnDef<AdminCustomer>[] = [
    {
      key: "collector",
      header: "Collector",
      sortValue: (c) => c.name,
      render: (c) => (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-a-text-1">{c.name}</span>
            {c.vip && <Badge tone="accent">VIP</Badge>}
            {c.ordersCount > 1 && <Badge tone="success">Repeat</Badge>}
            {c.totalSpentBDT >= HIGH_VALUE_THRESHOLD && <Badge tone="info">High value</Badge>}
            {isFoundingMember(c) && <Badge tone="neutral">Founding Circle</Badge>}
          </div>
          {c.email && <p className="text-[12px] text-a-text-3">{c.email}</p>}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) => (
        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-num text-[13px] text-a-text-2">{c.phone}</span>
          <button
            type="button"
            aria-label={`Copy ${c.phone}`}
            onClick={() => copyText(c.phone, `Copied ${c.phone}`)}
            className="p-1 rounded hover:bg-a-subtle text-a-text-3 hover:text-a-text-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      key: "district",
      header: "District",
      sortValue: (c) => c.district,
      render: (c) => <span className="text-a-text-2">{c.district}</span>,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      numeric: true,
      sortValue: (c) => c.ordersCount,
      render: (c) => <span className="font-num font-medium">{c.ordersCount}</span>,
    },
    {
      key: "ltv",
      header: "Lifetime Value",
      align: "right",
      numeric: true,
      sortValue: (c) => c.totalSpentBDT,
      render: (c) => (
        <span className="font-num font-semibold text-a-text-1">
          {formatBDT(c.totalSpentBDT)}
        </span>
      ),
    },
    {
      key: "last",
      header: "Last Order",
      align: "right",
      sortValue: (c) => new Date(c.lastOrderAt || 0).getTime(),
      render: (c) => (
        <span className="font-num text-[12px] text-a-text-3">
          {formatRelativeTime(c.lastOrderAt)}
        </span>
      ),
    },
  ];

  const saveCustomer = async () => {
    if (!activeCustomer) return;
    setSaving(true);
    await postAction(
      {
        action: "save_customer_note",
        phone: activeCustomer.phone,
        tags: tagsDraft,
        notes: notesDraft,
        vip: vipDraft,
      },
      `Saved profile for ${activeCustomer.name}`
    );
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers CRM"
        description="Inspect collector profiles, lifetime value, waitlist reservations, and private client-care notes."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() =>
              downloadCsv(
                "noksha-customers-crm.csv",
                ["Name", "Phone", "Email", "District", "Orders", "Lifetime Value BDT", "VIP", "Tags", "Notes"],
                filteredCustomers.map((c) => [
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
          >
            Export CSV
          </Button>
        }
        toolbar={
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <SegmentedControl
              value={segment}
              onChange={(val) => setQueryParam("segment", val)}
              options={[
                { id: "all", label: "All collectors", count: data.customers.length },
                {
                  id: "repeat",
                  label: "Repeat",
                  count: data.customers.filter((c) => c.ordersCount > 1).length,
                },
                {
                  id: "high_value",
                  label: "High value",
                  count: data.customers.filter((c) => c.totalSpentBDT >= HIGH_VALUE_THRESHOLD)
                    .length,
                },
                {
                  id: "founding",
                  label: "VIP & Founding Circle",
                  count: data.customers.filter((c) => c.vip || isFoundingMember(c)).length,
                },
              ]}
            />
            <div className="w-full sm:w-64">
              <SearchInput
                inputRef={(el) => {
                  if (el) el.setAttribute("data-admin-search", "true");
                }}
                value={search}
                onChange={setSearch}
                placeholder="Name, phone, district…"
              />
            </div>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={filteredCustomers}
        getRowId={(c) => c.phone}
        activeRowId={selectedPhone}
        onRowClick={(c) => setQueryParam("customer", c.phone)}
        emptyState={
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No collectors in this segment"
            description="Customer profiles build automatically as orders are placed on the storefront."
          />
        }
      />

      {/* Customer Profile Drawer */}
      <Drawer
        open={Boolean(activeCustomer)}
        onClose={() => setQueryParam("customer", null)}
        isDirty={isDirty}
        widthCls="sm:max-w-[500px]"
        title={activeCustomer?.name || "Collector profile"}
        subtitle={
          activeCustomer && (
            <span className="font-num text-[12px] text-a-text-3">
              {activeCustomer.phone} · {activeCustomer.district}
            </span>
          )
        }
        headerActions={
          activeCustomer && (
            <IconButton
              aria-label="Copy phone number"
              tooltip="Copy phone"
              onClick={() => copyText(activeCustomer.phone, `Copied ${activeCustomer.phone}`)}
            >
              <Copy className="w-3.5 h-3.5" />
            </IconButton>
          )
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setQueryParam("customer", null)}>
              Close
            </Button>
            <Button variant="primary" loading={saving} onClick={saveCustomer}>
              Save CRM profile
            </Button>
          </>
        }
      >
        {activeCustomer && (
          <div className="space-y-6">
            {/* Quick Reach + Stats */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-[10px] bg-a-subtle border border-a-border">
              <div className="text-[13px] text-a-text-2">
                {activeCustomer.address}, {activeCustomer.district}
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={toBdWhatsApp(
                    activeCustomer.phone,
                    `আসসালামু আলাইকুম ${activeCustomer.name}, warm greetings from Noksha (নকশা)!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-press inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-success-bg text-a-success text-[12px] font-medium"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${activeCustomer.phone}`}
                  aria-label="Call customer"
                  className="admin-press inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-a-surface border border-a-border text-a-text-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[10px] bg-a-surface border border-a-border">
                <p className="text-[12px] text-a-text-3">Lifetime value</p>
                <p className="font-num text-[20px] font-semibold text-a-text-1 mt-1">
                  {formatBDT(activeCustomer.totalSpentBDT)}
                </p>
              </div>
              <div className="p-3.5 rounded-[10px] bg-a-surface border border-a-border">
                <p className="text-[12px] text-a-text-3">Total orders</p>
                <p className="font-num text-[20px] font-semibold text-a-text-1 mt-1">
                  {activeCustomer.ordersCount}
                </p>
              </div>
            </div>

            {/* Editable CRM Notes & VIP */}
            <div className="space-y-3 pt-2 border-t border-a-border">
              <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={vipDraft}
                  onChange={(e) => setVipDraft(e.target.checked)}
                  className="w-4 h-4 accent-[var(--a-ink-btn)]"
                />
                <span className="font-medium text-a-text-1">VIP Collector privilege</span>
              </label>

              <Field label="Segment tags">
                <Input
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  placeholder="e.g. VIP, Kantha Collector, Founding Circle"
                />
              </Field>

              <Field label="Client-care notes">
                <Textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Preferred finishes, gifting dates, or delivery preferences…"
                />
              </Field>
            </div>

            {/* Order History Timeline */}
            <div className="space-y-2.5 pt-2 border-t border-a-border">
              <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium">
                Order history (<span className="font-num">{customerOrders.length}</span>)
              </p>
              {customerOrders.length === 0 ? (
                <p className="text-[13px] text-a-text-3">No matching order records.</p>
              ) : (
                <div className="divide-y divide-a-border rounded-[10px] border border-a-border overflow-hidden">
                  {customerOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setActiveTab("orders", { order: o.id })}
                      className="w-full p-3 bg-a-surface admin-row-hover flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div>
                        <p className="font-num text-[13px] font-semibold text-a-text-1">{o.id}</p>
                        <p className="text-[12px] text-a-text-3">
                          {o.items.map((i) => i.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="font-num text-[13px] font-medium text-a-text-1">
                          {formatBDT(o.totalBDT)}
                        </p>
                        <StatusBadge status={o.status} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Waitlist / Lead Entries */}
            {customerLeads.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-a-border">
                <p className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 font-medium">
                  Waitlist &amp; circle entries
                </p>
                <div className="space-y-1.5">
                  {customerLeads.map((l) => (
                    <div
                      key={l.id}
                      className="p-2.5 rounded-[8px] bg-a-subtle border border-a-border flex items-center justify-between text-[12px]"
                    >
                      <span className="text-a-text-1 font-medium">{l.product_name || l.type}</span>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
