"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, AlertCircle } from "lucide-react";
import { Button, TableSkeleton } from "./Primitives";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  numeric?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  activeRowId,
  selectable = false,
  selectedIds,
  onSelectionChange,
  loading = false,
  error = null,
  onRetry,
  emptyState,
  renderMobileCard,
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  activeRowId?: string | null;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  renderMobileCard?: (row: T, isSelected: boolean) => React.ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const getter = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [rows, columns, sortKey, sortDir]);

  if (loading) {
    return <TableSkeleton rows={5} cols={Math.min(columns.length, 6)} />;
  }

  if (error) {
    return (
      <div className="bg-a-surface border border-a-border rounded-[14px] p-10 flex flex-col items-center text-center">
        <AlertCircle className="w-6 h-6 text-a-danger mb-2" />
        <p className="text-[14px] font-medium text-a-text-1">{error}</p>
        {onRetry && (
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (sortedRows.length === 0) {
    return (
      <div className="bg-a-surface border border-a-border rounded-[14px] shadow-[var(--a-shadow-card)]">
        {emptyState || (
          <div className="p-10 text-center text-[14px] text-a-text-2">No items to display.</div>
        )}
      </div>
    );
  }

  const allIds = sortedRows.map(getRowId);
  const allSelected =
    selectable && selectedIds && allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allIds));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("desc");
    }
  };

  return (
    <div className="bg-a-surface border border-a-border rounded-[14px] shadow-[var(--a-shadow-card)] overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-a-subtle border-b border-a-border">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={Boolean(allSelected)}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-[var(--a-ink-btn)] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const alignCls =
                  col.align === "right"
                    ? "text-right justify-end"
                    : col.align === "center"
                    ? "text-center justify-center"
                    : "text-left justify-start";
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 text-[12px] leading-4 font-medium uppercase tracking-[0.04em] text-a-text-3 whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${col.className || ""}`}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className={`inline-flex items-center gap-1 hover:text-a-text-1 cursor-pointer uppercase tracking-[0.04em] ${alignCls}`}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-a-accent" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-a-accent" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {sortedRows.map((row) => {
              const id = getRowId(row);
              const isSelected = Boolean(selectedIds?.has(id));
              const isActive = activeRowId === id;
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`min-h-[44px] admin-row-hover ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${isActive || isSelected ? "bg-a-subtle" : ""}`}
                >
                  {selectable && (
                    <td
                      className="w-10 px-4 py-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${id}`}
                        checked={isSelected}
                        onChange={() => toggleOne(id)}
                        className="w-4 h-4 rounded accent-[var(--a-ink-btn)] cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 h-11 text-[14px] leading-[22px] text-a-text-1 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${col.numeric ? "font-num" : ""} ${col.className || ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden divide-y divide-a-border">
        {sortedRows.map((row) => {
          const id = getRowId(row);
          const isSelected = Boolean(selectedIds?.has(id));
          return (
            <div
              key={id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`p-4 space-y-2.5 ${onRowClick ? "cursor-pointer active:bg-a-subtle" : ""} ${
                isSelected ? "bg-a-subtle" : ""
              }`}
            >
              {renderMobileCard ? (
                renderMobileCard(row, isSelected)
              ) : (
                <div className="space-y-2">
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-3 text-[13px]">
                      <span className="text-[12px] uppercase tracking-[0.04em] text-a-text-3 shrink-0">
                        {col.header}
                      </span>
                      <div className={`text-right ${col.numeric ? "font-num" : ""}`}>
                        {col.render(row)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
