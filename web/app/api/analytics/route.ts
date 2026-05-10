import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err } from '@/lib/server/response'

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const timeframe = searchParams.get('timeframe') ?? 'ALL'

  const supabase = createServiceClient()
  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user!.id)
    .neq('status', 'open')
    .order('closed_at', { ascending: true })

  if (accountId) query = query.eq('account_id', accountId)

  if (timeframe !== 'ALL') {
    const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    query = query.gte('closed_at', cutoff)
  }

  const { data: trades, error: dbError } = await query
  if (dbError) return err(dbError.message)

  const closed = trades ?? []

  const equityCurve = (() => {
    let balance = 0
    return closed.map((t) => {
      balance += Number(t.pnl)
      const d = new Date(t.closed_at)
      return {
        name: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        balance: Math.round(balance * 100) / 100,
      }
    })
  })()

  const byPair = Object.entries(
    closed.reduce((acc: Record<string, number>, t) => {
      acc[t.pair] = (acc[t.pair] ?? 0) + Number(t.pnl)
      return acc
    }, {})
  )
    .map(([name, profit]) => ({ name, profit: Math.round((profit as number) * 100) / 100 }))
    .sort((a, b) => b.profit - a.profit)

  const bySession = Object.entries(
    closed.reduce((acc: Record<string, { pnl: number; count: number }>, t) => {
      const s = t.session ?? 'Unknown'
      if (!acc[s]) acc[s] = { pnl: 0, count: 0 }
      acc[s].pnl += Number(t.pnl)
      acc[s].count++
      return acc
    }, {})
  ).map(([session, v]) => ({
    session,
    pnl: Math.round((v as any).pnl * 100) / 100,
    count: (v as any).count,
  }))

  const byDay = Object.entries(
    closed.reduce((acc: Record<string, { pnl: number; count: number }>, t) => {
      const day = new Date(t.closed_at).toLocaleDateString('en-GB', { weekday: 'short' })
      if (!acc[day]) acc[day] = { pnl: 0, count: 0 }
      acc[day].pnl += Number(t.pnl)
      acc[day].count++
      return acc
    }, {})
  ).map(([day, v]) => ({ day, pnl: Math.round((v as any).pnl * 100) / 100, count: (v as any).count }))

  const byEmotion = Object.entries(
    closed.reduce((acc: Record<string, { pnl: number; count: number }>, t) => {
      const e = t.emotion ?? 'Unknown'
      if (!acc[e]) acc[e] = { pnl: 0, count: 0 }
      acc[e].pnl += Number(t.pnl)
      acc[e].count++
      return acc
    }, {})
  ).map(([emotion, v]) => ({ emotion, pnl: Math.round((v as any).pnl * 100) / 100, count: (v as any).count }))

  return ok({ equityCurve, byPair, bySession, byDay, byEmotion, totalTrades: closed.length })
}
