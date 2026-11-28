"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, Shield, Trash2 } from "lucide-react";
import {
  ALL_ADMIN_TABS,
  canAccessSection,
  formatRelativeTime,
  StaffRole,
} from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
  Button,
  Card,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from "../ui";

const SECTION_LABELS: Record<string, string> = {
  overview: "Command Overview",
  analytics: "Analytics & Funnel",
  orders: "Orders Pipeline",
  cancellations: "Cancellation Requests",
  collections: "Drops & Categories",
  products: "Products & Inventory",
  customers: "Customers CRM",
  abandoned: "Abandoned Carts",
  leads: "Waitlist & Leads",
  promos: "Promo Codes",
  content: "Site Content CMS",
  staff: "Staff & Roles",
  audit: "Activity Audit Log",
};

const ROLES: StaffRole[] = ["owner", "manager", "support"];

type StaffRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: number;
  last_login_at: string | null;
  created_at: string;
};

export default function StaffTab() {
  const { data, postAction, triggerNewCounter } = useAdmin();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("support");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lastTriggerRef = useRef(triggerNewCounter);

  useEffect(() => {
    if (triggerNewCounter !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerNewCounter;
      setDrawerOpen(true);
    }
  }, [triggerNewCounter]);

  if (data.user.role !== "owner") return null;

  const isDirty = Boolean(name.trim() || email.trim() || password.trim());

  const handleSaveStaff = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!email.trim() || !email.includes("@")) errs.email = "Valid email is required.";
    if (!password.trim() || password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    const ok = await postAction(
      {
        action: "save_staff",
        name: name.trim(),
        email: email.trim(),
        role,
        password,
      },
      `Saved staff account ${email.trim()}`
    );
    setSaving(false);
    if (ok) {
      setName("");
      setEmail("");
      setPassword("");
      setErrors({});
      setDrawerOpen(false);
    }
  };

  const columns: ColumnDef<StaffRow>[] = [
    {
      key: "member",
      header: "Staff Member",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-a-subtle border border-a-border flex items-center justify-center text-[12px] font-semibold text-a-text-1 shrink-0">
            {s.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-a-text-1">{s.name}</p>
            <p className="text-[12px] text-a-text-3">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (s) => (
        <Badge
          tone={s.role === "owner" ? "accent" : s.role === "manager" ? "info" : "neutral"}
          className="capitalize"
        >
          {s.role}
        </Badge>
      ),
    },
    {
      key: "login",
      header: "Last Sign-In",
      render: (s) => (
        <span className="font-num text-[13px] text-a-text-2">
          {formatRelativeTime(s.last_login_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <button
          type="button"
          disabled={s.id === data.user.id}
          onClick={() =>
            postAction(
              { action: "toggle_staff", id: s.id, active: !s.active },
              `Updated ${s.name}`
            )
          }
          className="cursor-pointer disabled:cursor-default"
        >
          <StatusBadge status={s.active ? "active" : "disabled"} />
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) =>
        s.id !== data.user.id ? (
          <IconButton
            aria-label={`Remove ${s.name}`}
            tooltip="Remove staff member"
            variant="danger"
            onClick={() => setDeleteTarget(s)}
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        ) : (
          <span className="text-[12px] text-a-text-3">Current session</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Roles"
        description="Manage studio team accounts and inspect section-by-section access permissions."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4 text-a-accent" />}
            kbd="N"
            onClick={() => setDrawerOpen(true)}
          >
            Invite staff
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={data.staff}
        getRowId={(s) => String(s.id)}
        emptyState={
          <EmptyState
            icon={<Shield className="w-5 h-5" />}
            title="No staff accounts found"
            description="Invite managers or client-care support members to collaborate."
          />
        }
      />

      {/* Read-Only Role Permission Matrix */}
      <Card
        title="Role permission matrix"
        description="Read-only reference showing which studio tabs each staff role can access."
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-a-subtle border-b border-a-border">
              <tr>
                <th className="px-5 py-2.5 text-[12px] uppercase tracking-[0.04em] text-a-text-3">
                  Studio section
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className="px-5 py-2.5 text-center text-[12px] uppercase tracking-[0.04em] text-a-text-3"
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {ALL_ADMIN_TABS.map((tabId) => (
                <tr key={tabId} className="h-10 admin-row-hover">
                  <td className="px-5 py-2 text-[13px] font-medium text-a-text-1">
                    {SECTION_LABELS[tabId] || tabId}
                  </td>
                  {ROLES.map((r) => {
                    const allowed = canAccessSection(r, tabId);
                    return (
                      <td key={r} className="px-5 py-2 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-a-success-bg text-a-success">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center text-a-text-3">
                            <Minus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite / Update Staff Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isDirty={isDirty}
        widthCls="sm:max-w-[440px]"
        title="Invite or update staff"
        subtitle="Using an existing email updates that staff member's role and password."
        footer={
          <>
            <div />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={saving} onClick={handleSaveStaff}>
                Save staff account
              </Button>
            </div>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" required error={errors.name}>
            <Input
              error={Boolean(errors.name)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maliha Rahman"
            />
          </Field>
          <Field label="Staff email" required error={errors.email}>
            <Input
              type="email"
              error={Boolean(errors.email)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maliha@noksha.bd"
            />
          </Field>
          <Field label="Role & permissions">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              <option value="owner">Owner — Full access + Staff management</option>
              <option value="manager">Manager — Catalog, Orders, Promos, Analytics, CMS</option>
              <option value="support">Support — Orders, Cancellations, Customers, Leads</option>
            </Select>
          </Field>
          <Field label="Temporary or new password" required error={errors.password}>
            <Input
              type="password"
              error={Boolean(errors.password)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Remove ${deleteTarget.name}?` : "Remove staff member?"}
        description={
          deleteTarget
            ? `This permanently revokes studio access for ${deleteTarget.name} (${deleteTarget.email}).`
            : ""
        }
        confirmLabel="Remove staff"
        danger
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          await postAction(
            { action: "delete_staff", id: deleteTarget.id },
            `Removed ${deleteTarget.name}`
          );
          setDeleting(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
