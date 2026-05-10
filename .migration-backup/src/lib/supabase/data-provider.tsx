"use client";

import { useEffect, useRef } from "react";
import { createClient } from "./client";
import { useAccountsStore, _setAccountsUserId, toAppAccount } from "@/stores/accounts-store";
import { useTradesStore, _setTradesUserId, toAppTrade } from "@/stores/trades-store";

export function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      _setAccountsUserId(userId);
      _setTradesUserId(userId);

      // Access store actions via getState() — no React hook subscription needed
      const { _hydrate: hydrateAccounts } = useAccountsStore.getState();
      const { _hydrate: hydrateTrades } = useTradesStore.getState();

      const [{ data: accountRows }, { data: tradeRows }] = await Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .order("closed_at", { ascending: false }),
      ]);

      hydrateAccounts(
        (accountRows ?? []).map((r) => toAppAccount(r as Record<string, unknown>))
      );
      hydrateTrades(
        (tradeRows ?? []).map((r) => toAppTrade(r as Record<string, unknown>))
      );
    }

    load();
  }, []);

  return <>{children}</>;
}
