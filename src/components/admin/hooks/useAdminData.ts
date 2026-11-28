"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AdminMetrics,
  AdminOrder,
  AdminPayload,
  AdminTab,
  computeAdminMetrics,
} from "../adminTypes";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  variant?: "success" | "error" | "info";
  action?: ToastAction;
}

export interface PostActionOptions {
  silent?: boolean;
  undoAction?: ToastAction;
}

export interface AdminContextValue {
  data: AdminPayload;
  metrics: AdminMetrics;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  refresh: () => Promise<void>;
  postAction: (
    body: Record<string, unknown>,
    successMsg: string,
    opts?: PostActionOptions
  ) => Promise<boolean>;
  notify: (
    msg: string,
    opts?: { variant?: "success" | "error" | "info"; action?: ToastAction }
  ) => void;
  copyText: (value: string, label?: string) => void;
  openPrintSlip: (order: AdminOrder) => void;
  openMultiplePrintSlips: (orders: AdminOrder[]) => void;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab, extraParams?: Record<string, string | null>) => void;
  queryParams: URLSearchParams;
  setQueryParam: (key: string, value: string | null) => void;
  triggerNewCounter: number;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used inside AdminContext.Provider");
  }
  return ctx;
}

export function useAdminDataLoader() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" });
      if (res.status === 401) {
        setData(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!res.ok) throw new Error("Unable to load studio data.");
      const payload = (await res.json()) as AdminPayload;
      setData(payload);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error while loading data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthError("");
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const out = await res.json();
        if (!res.ok) {
          setAuthError(out.error || "Login failed");
          return false;
        }
        await fetchDashboard(true);
        return true;
      } catch {
        setAuthError("Network error while signing in.");
        return false;
      }
    },
    [fetchDashboard]
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setData(null);
  }, []);

  const metrics = useMemo(() => computeAdminMetrics(data), [data]);

  return {
    data,
    setData,
    metrics,
    loading,
    refreshing,
    error,
    authError,
    lastSyncedAt,
    refresh: () => fetchDashboard(false),
    login,
    logout,
  };
}
