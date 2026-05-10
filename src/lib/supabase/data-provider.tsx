"use client";

import { useEffect, useRef } from "react";
import { createClient } from "./client";
import { useAccountsStore, toAppAccount } from "@/stores/accounts-store";
import { useTradesStore, toAppTrade } from "@/stores/trades-store";

async function apiFetch(path: string) {
  const res = await fetch(path);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function load() {
      // Anon client used only to confirm session — no direct DB queries here
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { _hydrate: hydrateAccounts } = useAccountsStore.getState();
      const { _hydrate: hydrateTrades } = useTradesStore.getState();

      // All data fetched server-side through API routes (service role key)
      const [accountRows, tradeRows] = await Promise.all([
        apiFetch("/api/accounts"),
        apiFetch("/api/trades?limit=500"),
      ]);

      hydrateAccounts(
        (accountRows ?? []).map((r: Record<string, unknown>) => toAppAccount(r))
      );
      hydrateTrades(
        (tradeRows ?? []).map((r: Record<string, unknown>) => toAppTrade(r))
      );
    }

    load();
  }, []);

  return <>{children}</>;
}
