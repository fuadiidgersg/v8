import { useMemo } from 'react'
import { create } from 'zustand'
import type { Trade } from '@/features/trades/data/schema'
import { trades as seedTrades } from '@/features/trades/data/trades'
import { useAccountsStore } from './accounts-store'

export type ImportResult = {
  added: number
  duplicates: number
}

type TradesState = {
  trades: Trade[]
  isLoading: boolean
  _hydrate: (trades: Trade[]) => void
  addTradesForAccount: (
    accountId: string,
    accountName: string,
    incoming: Trade[]
  ) => ImportResult
  removeTrade: (id: string) => boolean
  removeTrades: (ids: string[]) => number
  clearTradesForAccount: (accountId: string) => number
  removeAccount: (accountId: string) => void
  reset: () => void
}

function toApiTrade(t: Trade, accountId: string, accountName: string) {
  return {
    id: t.id,
    account_id: accountId,
    account: accountName,
    pair: t.pair,
    direction: t.direction,
    entry: t.entry,
    exit: t.exit,
    stop_loss: t.stopLoss ?? undefined,
    take_profit: t.takeProfit ?? undefined,
    lots: t.lotSize,
    pnl: t.pnl,
    pips: t.pips,
    r_multiple: t.rMultiple,
    status: t.status,
    opened_at: t.openedAt instanceof Date ? t.openedAt.toISOString() : t.openedAt,
    closed_at: t.closedAt instanceof Date ? t.closedAt.toISOString() : t.closedAt,
    strategy: t.strategy,
    session: t.session,
    timeframe: t.timeframe,
    emotion: t.emotion,
    notes: t.notes,
    mistakes: t.mistakes,
    lessons: t.lessons,
    risk_amount: t.riskAmount,
    screenshot_url: t.screenshotUrl,
    tags: t.tags ?? [],
  }
}

export function toAppTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    account: row.account as string,
    pair: row.pair as string,
    direction: row.direction as Trade['direction'],
    entry: Number(row.entry),
    exit: Number(row.exit),
    stopLoss: row.stop_loss != null ? Number(row.stop_loss) : undefined,
    takeProfit: row.take_profit != null ? Number(row.take_profit) : undefined,
    lotSize: Number(row.lots),
    pnl: Number(row.pnl),
    pips: Number(row.pips ?? 0),
    rMultiple: Number(row.r_multiple ?? 0),
    status: row.status as Trade['status'],
    openedAt: new Date(row.opened_at as string),
    closedAt: new Date(row.closed_at as string),
    strategy: (row.strategy as Trade['strategy']) ?? undefined,
    session: (row.session as Trade['session']) ?? undefined,
    timeframe: (row.timeframe as Trade['timeframe']) ?? undefined,
    emotion: (row.emotion as Trade['emotion']) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    mistakes: (row.mistakes as string) ?? undefined,
    lessons: (row.lessons as string) ?? undefined,
    riskAmount: row.risk_amount != null ? Number(row.risk_amount) : undefined,
    screenshotUrl: (row.screenshot_url as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
  }
}

function apiPost(path: string, body: unknown) {
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})
}

function apiDelete(path: string) {
  fetch(path, { method: 'DELETE' }).catch(() => {})
}

export const useTradesStore = create<TradesState>()((set, get) => ({
  trades: [],
  isLoading: true,

  _hydrate: (trades) => {
    set({ trades, isLoading: false })
  },

  addTradesForAccount: (accountId, accountName, incoming) => {
    const existing = get().trades
    const existingIdsForAccount = new Set(
      existing.filter((t) => t.accountId === accountId).map((t) => t.id)
    )

    const seen = new Set<string>()
    const fresh: Trade[] = []
    let duplicates = 0

    for (const t of incoming) {
      if (existingIdsForAccount.has(t.id) || seen.has(t.id)) {
        duplicates++
        continue
      }
      seen.add(t.id)
      fresh.push({ ...t, accountId, account: accountName })
    }

    if (fresh.length === 0) return { added: 0, duplicates }

    set({ trades: [...existing, ...fresh] })

    // Persist each new trade through the API route (server-side, service role key)
    for (const t of fresh) {
      apiPost('/api/trades', toApiTrade(t, accountId, accountName))
    }

    return { added: fresh.length, duplicates }
  },

  removeTrade: (id) => {
    const before = get().trades.length
    set((state) => ({ trades: state.trades.filter((t) => t.id !== id) }))
    const removed = get().trades.length < before
    if (removed) {
      apiDelete(`/api/trades/${id}`)
    }
    return removed
  },

  removeTrades: (ids) => {
    const ids_set = new Set(ids)
    const before = get().trades.length
    set((state) => ({ trades: state.trades.filter((t) => !ids_set.has(t.id)) }))
    const count = before - get().trades.length
    if (count > 0) {
      apiPost('/api/trades/bulk-delete', { ids })
    }
    return count
  },

  clearTradesForAccount: (accountId) => {
    const before = get().trades.length
    set((state) => ({ trades: state.trades.filter((t) => t.accountId !== accountId) }))
    const count = before - get().trades.length
    if (count > 0) {
      apiPost('/api/trades/bulk-delete', { ids: [], account_id: accountId })
    }
    return count
  },

  removeAccount: (accountId) => {
    set((state) => ({ trades: state.trades.filter((t) => t.accountId !== accountId) }))
    apiPost('/api/trades/bulk-delete', { ids: [], account_id: accountId })
  },

  reset: () => {
    set({ trades: [], isLoading: false })
  },
}))

export function useTrades(): Trade[] {
  const trades = useTradesStore((s) => s.trades)
  const accounts = useAccountsStore((s) => s.accounts)
  const activeId = useAccountsStore((s) => s.activeAccountId)

  return useMemo(() => {
    if (accounts.length === 0) return seedTrades
    if (!activeId) return []
    return trades.filter((t) => t.accountId === activeId)
  }, [trades, accounts.length, activeId])
}
