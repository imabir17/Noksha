"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { downloadCsv } from "../adminTypes";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyThCls } from "./_legacyShared";

export default function AuditTab() {
  const { data } = useAdmin();
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActorFilter, setAuditActorFilter] = useState("all");

  const uniqueActors = Array.from(new Set(data.auditLogs.map((l) => l.user_email))).sort();
  const q = auditSearch.trim().toLowerCase();
  const filteredLogs = data.auditLogs.filter((l) => {
    if (auditActorFilter !== "all" && l.user_email !== auditActorFilter) return false;
    if (!q) return true;
    return (
      l.user_email.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      l.entity_id.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`${legacyCardCls} overflow-hidden`}>
      <div className="p-4 border-b border-a-border bg-a-subtle flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-a-text-1">
            Full Admin Activity Audit Log (<span className="font-num">{filteredLogs.length}</span> of <span className="font-num">{data.auditLogs.length}</span> events)
          </h2>
          <p className="text-[12px] text-a-text-2 mt-0.5">
            Every sign-in, sign-out, upload, order, cancellation, product, drop, and content action is permanently recorded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder="Search user, action, or details…"
            className="px-3 py-1.5 bg-a-surface border border-a-border-strong rounded-lg text-[13px] text-a-text-1 focus:outline-none"
          />
          <select
            value={auditActorFilter}
            onChange={(e) => setAuditActorFilter(e.target.value)}
            className="px-3 py-1.5 bg-a-surface border border-a-border-strong rounded-lg text-[13px] font-medium text-a-text-1 cursor-pointer"
          >
            <option value="all">All Staff Actors</option>
            {uniqueActors.map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "noksha-full-audit-log.csv",
                ["ID", "Timestamp", "User Email", "Role", "Action", "Entity Type", "Entity ID", "Details"],
                filteredLogs.map((l) => [
                  l.id,
                  new Date(l.created_at).toLocaleString("en-GB"),
                  l.user_email,
                  l.user_role,
                  l.action,
                  l.entity_type,
                  l.entity_id,
                  l.details,
                ])
              )
            }
            className="admin-press px-3 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-a-accent" />
            Export Full CSV
          </button>
        </div>
      </div>
      <table className="w-full text-[13px] text-left border-collapse">
        <thead>
          <tr>
            <th className={legacyThCls}>Timestamp</th>
            <th className={legacyThCls}>Staff Actor</th>
            <th className={legacyThCls}>Action</th>
            <th className={legacyThCls}>Target</th>
            <th className={legacyThCls}>Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-a-border">
          {filteredLogs.map((log) => (
            <tr key={log.id} className="admin-row-hover">
              <td className="py-3 px-4 font-num text-a-text-2 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td className="py-3 px-4">
                <span className="text-a-text-1 font-medium">{log.user_email}</span>{" "}
                <span className="text-a-accent-text font-medium uppercase text-[12px]">
                  ({log.user_role})
                </span>
              </td>
              <td className="py-3 px-4 font-mono font-medium text-a-success">{log.action}</td>
              <td className="py-3 px-4 font-mono text-a-text-1">
                {log.entity_type}:{log.entity_id}
              </td>
              <td className="py-3 px-4 text-a-text-2">{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
