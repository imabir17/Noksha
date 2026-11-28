"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, MessageCircle, Sparkles } from "lucide-react";
import { AdminLead, downloadCsv, formatRelativeTime, toBdWhatsApp } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  EmptyState,
  PageHeader,
  SearchInput,
  SegmentedControl,
  Select,
} from "../ui";

export default function LeadsTab() {
  const { data, postAction, copyText, queryParams, setQueryParam } = useAdmin();

  const segment = queryParams.get("type") || "all";
  const [search, setSearch] = useState("");
  const [convertTarget, setConvertTarget] = useState<AdminLead | null>(null);
  const [converting, setConverting] = useState(false);

  // Phone numbers that have completed at least one non-cancelled order
  const purchaserPhones = useMemo(() => {
    const s = new Set<string>();
    for (const o of data.orders) {
      if (o.status === "cancelled") continue;
      const digits = o.customerPhone.replace(/\D/g, "").slice(-10);
      if (digits) s.add(digits);
    }
    return s;
  }, [data.orders]);

  const hasPurchased = (lead: AdminLead) => {
    if (lead.status === "converted") return true;
    const digits = (lead.phone || "").replace(/\D/g, "").slice(-10);
    return Boolean(digits && purchaserPhones.has(digits));
  };

  const filteredLeads = useMemo(() => {
    return data.leads.filter((l) => {
      if (segment !== "all" && l.type !== segment) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.phone && l.phone.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.product_name && l.product_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data.leads, segment, search]);

  const copyAllPhones = () => {
    const phones = Array.from(
      new Set(
        filteredLeads
          .map((l) => (l.phone || "").trim())
          .filter(Boolean)
      )
    );
    if (phones.length === 0) return;
    copyText(phones.join(", "), `Copied ${phones.length} phone numbers`);
  };

  const exportSegmentCsv = () => {
    downloadCsv(
      `noksha-leads-${segment}.csv`,
      ["ID", "Type", "Name", "Phone", "Email", "Piece / Membership", "Status", "Converted", "Date"],
      filteredLeads.map((l) => [
        l.id,
        l.type,
        l.name,
        l.phone,
        l.email,
        l.product_name,
        l.status,
        hasPurchased(l) ? "Yes" : "No",
        l.created_at,
      ])
    );
  };

  const columns: ColumnDef<AdminLead>[] = [
    {
      key: "contact",
      header: "Contact",
      sortValue: (l) => l.name || l.phone,
      render: (l) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-a-text-1">{l.name || "Collector"}</span>
            {hasPurchased(l) && (
              <Badge tone="success" dot>
                Converted
              </Badge>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 text-[12px] text-a-text-3">
            {l.phone && <span className="font-num">{l.phone}</span>}
            {l.phone && (
              <button
                type="button"
                aria-label={`Copy ${l.phone}`}
                onClick={() => copyText(l.phone, `Copied ${l.phone}`)}
                className="p-0.5 rounded hover:bg-a-subtle text-a-text-3 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
            {l.email && <span>· {l.email}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Segment",
      render: (l) => (
        <Badge tone="neutral" className="capitalize">
          {l.type.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "interest",
      header: "Piece / Circle Interest",
      render: (l) => <span className="text-[13px] text-a-text-1">{l.product_name || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <div className="w-36">
          <Select
            aria-label={`Lead status for ${l.name || l.phone}`}
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
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </Select>
        </div>
      ),
    },
    {
      key: "date",
      header: "Joined",
      sortValue: (l) => new Date(l.created_at).getTime(),
      render: (l) => (
        <span className="font-num text-[12px] text-a-text-3">
          {formatRelativeTime(l.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (l) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          {l.type === "waitlist" && l.product_id && !hasPurchased(l) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-a-accent" />}
              onClick={() => setConvertTarget(l)}
            >
              Mark sold
            </Button>
          )}
          {l.phone && (
            <a
              href={toBdWhatsApp(
                l.phone,
                `আসসালামু আলাইকুম ${l.name || ""}, regarding "${l.product_name || "Noksha Founding Circle"}" at Noksha (নকশা)!`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-press inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] bg-a-success-bg text-a-success text-[12px] font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist & Leads"
        description="Manage Drop piece reservations, Founding Circle invitations, and newsletter subscribers."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Copy className="w-4 h-4" />}
              onClick={copyAllPhones}
            >
              Copy all phones
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={exportSegmentCsv}
            >
              Export CSV
            </Button>
          </>
        }
        toolbar={
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <SegmentedControl
              value={segment}
              onChange={(val) => setQueryParam("type", val)}
              options={[
                { id: "all", label: "All leads", count: data.leads.length },
                {
                  id: "waitlist",
                  label: "Piece Reservations",
                  count: data.leads.filter((l) => l.type === "waitlist").length,
                },
                {
                  id: "founding_circle",
                  label: "Founding Circle",
                  count: data.leads.filter((l) => l.type === "founding_circle").length,
                },
                {
                  id: "newsletter",
                  label: "Newsletter",
                  count: data.leads.filter((l) => l.type === "newsletter").length,
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
                placeholder="Search name, phone, piece…"
              />
            </div>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={filteredLeads}
        getRowId={(l) => String(l.id)}
        emptyState={
          <EmptyState
            icon={<Sparkles className="w-5 h-5" />}
            title="No leads in this segment yet"
            description="Waitlist reservations and Founding Circle sign-ups appear here automatically."
          />
        }
      />

      <ConfirmDialog
        open={Boolean(convertTarget)}
        title={
          convertTarget
            ? `Allocate "${convertTarget.product_name}" to ${convertTarget.name}?`
            : "Mark waitlist piece sold?"
        }
        description={
          convertTarget
            ? `This marks "${convertTarget.product_name}" as Acquired by ${convertTarget.name} and updates the waitlist entry to Converted.`
            : ""
        }
        confirmLabel="Mark sold to collector"
        loading={converting}
        onCancel={() => setConvertTarget(null)}
        onConfirm={async () => {
          if (!convertTarget) return;
          setConverting(true);
          await postAction(
            {
              action: "mark_waitlist_sold",
              leadId: convertTarget.id,
              productId: convertTarget.product_id,
              customerName: convertTarget.name,
            },
            `Allocated "${convertTarget.product_name}" to ${convertTarget.name}`
          );
          setConverting(false);
          setConvertTarget(null);
        }}
      />
    </div>
  );
}
