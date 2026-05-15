"use client";

  import { useEffect, useRef } from "react";
  import { createClient } from "./client";
  import { useAccountsStore, toAppAccount } from "@/stores/accounts-store";
  import { useTradesStore, toAppTrade } from "@/stores/trades-store";
  import { useJournalStore, type JournalNote, type JournalMood } from "@/stores/journal-store";

  async function apiFetch(path: string) {
    const res = await fetch(path);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  }

  function toAppNote(row: Record<string, unknown>): JournalNote {
    return {
      id: row.id as string,
      accountId: row.account_id as string,
      title: (row.title as string) ?? '',
      body: (row.body as string) ?? '',
      mood: (row.mood as JournalMood) ?? 'neutral',
      tags: (row.tags as string[]) ?? [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }

  export function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
    const initialized = useRef(false);

    useEffect(() => {
      if (initialized.current) return;
      initialized.current = true;

      async function load() {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { _hydrate: hydrateAccounts } = useAccountsStore.getState();
        const { _hydrate: hydrateTrades } = useTradesStore.getState();
        const { _hydrate: hydrateNotes } = useJournalStore.getState();

        const [accountRows, tradeRows, noteRows] = await Promise.all([
          apiFetch("/api/accounts"),
          apiFetch("/api/trades?limit=500"),
          apiFetch("/api/journal"),
        ]);

        hydrateAccounts(
          (accountRows ?? []).map((r: Record<string, unknown>) => toAppAccount(r))
        );
        hydrateTrades(
          (tradeRows ?? []).map((r: Record<string, unknown>) => toAppTrade(r))
        );
        if (noteRows) {
          hydrateNotes(
            (noteRows as Record<string, unknown>[]).map(toAppNote)
          );
        }
      }

      load();
    }, []);

    return <>{children}</>;
  }
  