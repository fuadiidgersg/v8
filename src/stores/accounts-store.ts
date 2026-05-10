import { create } from 'zustand'

export type AccountType = 'live' | 'demo' | 'prop'
export type AccountCurrency = 'USD' | 'EUR' | 'GBP'

export type TradingAccount = {
  id: string
  name: string
  broker: string
  number: string
  type: AccountType
  currency: AccountCurrency
  startingBalance: number
  createdAt: string
  isArchived?: boolean
}

type UpsertImportInput = {
  broker?: string
  number?: string
  nameHint?: string
  type?: AccountType
  currency?: AccountCurrency
}

type AccountsState = {
  accounts: TradingAccount[]
  activeAccountId: string | null
  isLoading: boolean
  _hydrate: (accounts: TradingAccount[]) => void
  addAccount: (input: Omit<TradingAccount, 'id' | 'createdAt' | 'isArchived'>) => string
  upsertFromImport: (input: UpsertImportInput) => string
  setActive: (id: string | null) => void
  rename: (id: string, name: string) => void
  setArchived: (id: string, archived: boolean) => void
  remove: (id: string) => void
  reset: () => void
}

const ACTIVE_KEY = 'fuadfx-active-account'
function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_KEY)
}
function saveActiveId(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

function makeId(): string {
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function inferTypeFromBroker(broker?: string): AccountType {
  const b = (broker ?? '').toLowerCase()
  if (/ftmo|topstep|funded|prop|myforex|fundednext|the5ers|e8/.test(b)) return 'prop'
  if (/demo|practice|sandbox/.test(b)) return 'demo'
  return 'live'
}

function apiPost(path: string, body: unknown) {
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})
}

function apiPut(path: string, body: unknown) {
  fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})
}

function apiDelete(path: string) {
  fetch(path, { method: 'DELETE' }).catch(() => {})
}

export function toAppAccount(row: Record<string, unknown>): TradingAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    broker: (row.broker as string) ?? '',
    number: (row.number as string) ?? '',
    type: (row.type as AccountType) ?? 'live',
    currency: (row.currency as AccountCurrency) ?? 'USD',
    startingBalance: Number(row.starting_balance ?? 0),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at as string,
  }
}

export const useAccountsStore = create<AccountsState>()((set, get) => ({
  accounts: [],
  activeAccountId: null,
  isLoading: true,

  _hydrate: (accounts) => {
    const saved = loadActiveId()
    const activeAccountId =
      accounts.find((a) => a.id === saved && !a.isArchived)?.id ??
      accounts.find((a) => !a.isArchived)?.id ??
      null
    set({ accounts, activeAccountId, isLoading: false })
  },

  addAccount: (input) => {
    const id = makeId()
    const account: TradingAccount = { id, createdAt: new Date().toISOString(), ...input }
    set((state) => {
      const activeAccountId = state.activeAccountId ?? id
      saveActiveId(activeAccountId)
      return { accounts: [...state.accounts, account], activeAccountId }
    })
    apiPost('/api/accounts', {
      id,
      name: input.name,
      broker: input.broker,
      number: input.number,
      type: input.type,
      currency: input.currency,
      starting_balance: input.startingBalance,
    })
    return id
  },

  upsertFromImport: (input) => {
    const broker = (input.broker ?? '').trim() || 'MT5 Broker'
    const number = (input.number ?? '').trim()
    const existing = get().accounts.find(
      (a) =>
        !a.isArchived &&
        a.broker.toLowerCase() === broker.toLowerCase() &&
        number.length > 0 &&
        a.number === number
    )
    if (existing) {
      set({ activeAccountId: existing.id })
      saveActiveId(existing.id)
      return existing.id
    }
    const id = makeId()
    const name = input.nameHint?.trim() || (number ? `${broker} ${number}` : broker)
    const account: TradingAccount = {
      id,
      name,
      broker,
      number: number || '—',
      type: input.type ?? inferTypeFromBroker(broker),
      currency: input.currency ?? 'USD',
      startingBalance: 0,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ accounts: [...state.accounts, account], activeAccountId: id }))
    saveActiveId(id)
    apiPost('/api/accounts', {
      id,
      name: account.name,
      broker: account.broker,
      number: account.number,
      type: account.type,
      currency: account.currency,
      starting_balance: 0,
    })
    return id
  },

  setActive: (id) => {
    set({ activeAccountId: id })
    saveActiveId(id)
  },

  rename: (id, name) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, name: name.trim() || a.name } : a
      ),
    }))
    apiPut(`/api/accounts/${id}`, { name: name.trim() })
  },

  setArchived: (id, archived) => {
    set((state) => {
      const accounts = state.accounts.map((a) =>
        a.id === id ? { ...a, isArchived: archived } : a
      )
      let activeAccountId = state.activeAccountId
      if (archived && state.activeAccountId === id) {
        activeAccountId = accounts.find((a) => !a.isArchived)?.id ?? null
        saveActiveId(activeAccountId)
      }
      return { accounts, activeAccountId }
    })
    apiPut(`/api/accounts/${id}`, { is_archived: archived })
  },

  remove: (id) => {
    set((state) => {
      const accounts = state.accounts.filter((a) => a.id !== id)
      let activeAccountId = state.activeAccountId
      if (state.activeAccountId === id) {
        activeAccountId = accounts.find((a) => !a.isArchived)?.id ?? null
        saveActiveId(activeAccountId)
      }
      return { accounts, activeAccountId }
    })
    apiDelete(`/api/accounts/${id}`)
  },

  reset: () => {
    set({ accounts: [], activeAccountId: null, isLoading: false })
    saveActiveId(null)
  },
}))

export function useActiveAccount(): TradingAccount | null {
  const accounts = useAccountsStore((s) => s.accounts)
  const activeId = useAccountsStore((s) => s.activeAccountId)
  if (!activeId) return null
  return accounts.find((a) => a.id === activeId) ?? null
}
