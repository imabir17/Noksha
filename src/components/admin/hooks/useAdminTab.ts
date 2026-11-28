"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminTab, ALL_ADMIN_TABS, canAccessSection, StaffRole } from "../adminTypes";

export function useAdminTab(role?: StaffRole) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab") as AdminTab | null;
  const isValidTab = rawTab && ALL_ADMIN_TABS.includes(rawTab);
  const resolvedTab: AdminTab =
    isValidTab && (!role || canAccessSection(role, rawTab)) ? rawTab : "overview";

  const setActiveTab = useCallback(
    (tab: AdminTab, extraParams?: Record<string, string | null>) => {
      const next = new URLSearchParams();
      if (tab !== "overview") {
        next.set("tab", tab);
      }
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v !== null && v !== undefined && v !== "" && v !== "all") {
            next.set(k, v);
          }
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const setQueryParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    activeTab: resolvedTab,
    setActiveTab,
    queryParams: searchParams,
    setQueryParam,
  };
}
