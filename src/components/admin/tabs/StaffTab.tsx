"use client";

import React, { useState } from "react";
import { Trash2, UserCheck } from "lucide-react";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyInputCls, legacyThCls } from "./_legacyShared";

export default function StaffTab() {
  const { data, postAction } = useAdmin();
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"owner" | "manager" | "support">("support");
  const [staffPassword, setStaffPassword] = useState("");

  if (data.user.role !== "owner") return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className={`lg:col-span-5 ${legacyCardCls} p-5 space-y-4`}>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1 flex items-center gap-2 border-b border-a-border pb-2.5">
          <UserCheck className="w-4 h-4 text-a-accent" />
          Add or Update Staff Account
        </h2>
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block mb-1">Full Name *</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Maliha Rahman"
              className={legacyInputCls}
            />
          </div>
          <div>
            <label className="block mb-1">Email *</label>
            <input
              type="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="maliha@noksha.bd"
              className={legacyInputCls}
            />
          </div>
          <div>
            <label className="block mb-1">Role &amp; Permissions</label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as "owner" | "manager" | "support")}
              className={legacyInputCls}
            >
              <option value="owner">Owner — Full access + Staff management</option>
              <option value="manager">Manager — Products, Orders, Promos, Analytics, Content</option>
              <option value="support">Support — Orders, Customers CRM, Leads, Abandoned Carts</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Password *</label>
            <input
              type="password"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              placeholder="Set password"
              className={legacyInputCls}
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = await postAction(
                {
                  action: "save_staff",
                  name: staffName,
                  email: staffEmail,
                  role: staffRole,
                  password: staffPassword,
                },
                `Saved staff account ${staffEmail}`
              );
              if (ok) {
                setStaffName("");
                setStaffEmail("");
                setStaffPassword("");
              }
            }}
            className="admin-press w-full py-2.5 bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium rounded-lg cursor-pointer"
          >
            Save Staff Account
          </button>
        </div>
      </div>

      <div className={`lg:col-span-7 ${legacyCardCls} overflow-hidden`}>
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr>
              <th className={legacyThCls}>Staff Member</th>
              <th className={legacyThCls}>Role</th>
              <th className={legacyThCls}>Last Login</th>
              <th className={legacyThCls}>Status</th>
              <th className={`${legacyThCls} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {data.staff.map((s) => (
              <tr key={s.id} className="admin-row-hover">
                <td className="py-3.5 px-4">
                  <p className="font-medium text-a-text-1">{s.name}</p>
                  <p className="text-a-text-2">{s.email}</p>
                </td>
                <td className="py-3.5 px-4 uppercase font-medium text-a-accent-text text-[12px]">
                  {s.role}
                </td>
                <td className="py-3.5 px-4 font-num text-a-text-2">
                  {s.last_login_at
                    ? new Date(s.last_login_at).toLocaleString("en-GB")
                    : "Never"}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() =>
                      postAction(
                        { action: "toggle_staff", id: s.id, active: !s.active },
                        "Updated staff status"
                      )
                    }
                    className={`admin-press px-2.5 py-0.5 rounded text-[12px] font-medium cursor-pointer ${
                      s.active
                        ? "bg-a-success-bg text-a-success"
                        : "bg-a-danger-bg text-a-danger"
                    }`}
                  >
                    {s.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {s.id !== data.user.id && (
                    <button
                      type="button"
                      onClick={() =>
                        postAction({ action: "delete_staff", id: s.id }, "Removed staff")
                      }
                      aria-label={`Remove ${s.name}`}
                      className="admin-press p-1.5 rounded bg-a-danger-bg text-a-danger cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
