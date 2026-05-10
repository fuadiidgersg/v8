import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err } from '@/lib/server/response'

function computeStats(trades: any[]) {
  const closed = trades.filter((t) => t.status !== 'open')
  const wins = closed.filter((t) => t.status === 'win')
  const losses = closed.filter((t) => t.status === 'loss')
  const breakeven = closed.filter((t) => t.status === 'breakeven')
  const open = trades.filter((t) => t.status === 'open')

  const totalPnl = closed.reduce((s: number, t: any) => s + Number(t.pnl), 0)
  const grossProfit = wins.reduce((s: number, t: any) => s + Number(t.pnl), 0)
  const grossLoss = Math.abs(losses.reduce((s: number, t: any) => s + Number(t.pnl), 0))
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.99 : 0
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0
  const expectancy = closed.length > 0 ? totalPnl / closed.length : 0
  const avgR = closed.length > 0 ? closed.reduce((s: number, t: any) => s + Number(t.r_multiple), 0) / closed.length : 0
  const totalPips = closed.reduce((s: number, t: any) => s + Number(t.pips), 0)
  const bestTrade = closed.length > 0 ? Math.max(...closed.map((t: any) => Number(t.pnl))) : 0
  const worstTrade = closed.length > 0 ? Math.min(...closed.map((t: any) => Number(t.pnl))) : 0

  let maxWinStreak = 0
  let maxLossStreak = 0
  let curWin = 0
  let curLoss = 0
  const sorted = [...closed].sort(
    (a, b) => new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime()
  )
  for (const t of sorted) {
    if (t.status === 'win') {
      curWin++
      curLoss = 0
      maxWinStreak = Math.max(maxWinStreak, curWin)
    } else if (t.status === 'loss') {
      curLoss++
      curWin = 0
      maxLossStreak = Math.max(maxLossStreak, curLoss)
    }
  }

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    open: open.length,
    winRate,
    totalPnl,
    grossProfit,
    grossLoss,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    bestTrade,
    worstTrade,
    avgR,
    totalPips,
    largestWinStreak: maxWinStreak,
    largestLossStreak: maxLossStreak,
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')

  const supabase = createServiceClient()
  let query = supabase.from('trades').select('*').eq('user_id', user!.id)
  if (accountId) query = query.eq('account_id', accountId)

  const { data, error: dbError } = await query
  if (dbError) return err(dbError.message)

  return ok(computeStats(data ?? []))
}
