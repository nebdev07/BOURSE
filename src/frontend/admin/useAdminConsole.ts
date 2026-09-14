"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type SupportAlert = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  symbol: string | null;
  type: string;
  threshold: number | null;
  recommendation: string | null;
  active: boolean;
  note: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
  alertCount: number;
  holdingCount: number;
  transactionCount: number;
  sessionCount: number;
  permissions: string[];
};

export type Listing = {
  id: string;
  asOf: string;
  retrievedAt: string;
  source: string;
  itemCount: number;
  changed: boolean;
};

export type AdminSource = { id: string; name: string; type: string; active: boolean };

export function useAdminConsole() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [postgres, setPostgres] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sources, setSources] = useState<AdminSource[]>([]);

  const load = useCallback(async () => {
    const [o, s, u] = await Promise.all([
      fetch("/api/admin/overview"),
      fetch("/api/admin/sources"),
      fetch("/api/admin/users"),
    ]);
    if (o.status === 401 || o.status === 403) {
      router.replace("/login");
      return;
    }
    const overview = await o.json();
    setPostgres(Boolean(overview.postgres));
    setAlerts(overview.alerts ?? []);
    setListings(overview.listings ?? []);
    setSources((await s.json()).sources ?? []);
    if (u.ok) {
      const uj = await u.json();
      setUsers(uj.users ?? []);
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ready,
    message,
    setMessage,
    postgres,
    users,
    alerts,
    listings,
    sources,
    load,
  };
}
