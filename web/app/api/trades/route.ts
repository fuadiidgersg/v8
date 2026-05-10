import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err, validationError } from '@/lib/server/response'

const createTradeSchema = z.object({
  id: z.string().min(1),
  account_id: z.string().min(1),
  account: z.string().default(''),
  pair: z.string().min(1),
  direction: z.enum(['long', 'short']),
  entry: z.number(),
  exit: z.number(),
  stop_loss: z.number().optional(),
  take_profit: z.number().optional(),
  lots: z.number().nonnegative(),
  pnl: z.number().default(0),
  pips: z.number().default(0),
  r_multiple: z.number().default(0),
  status: z.enum(['win', 'loss', 'breakeven', 'open']).default('open'),
  opened_at: z.string(),
  closed_at: z.string(),
  strategy: z.string().optional(),
  session: z.string().optional(),
  timeframe: z.string().optional(),
  emotion: z.string().optional(),
  notes: z.string().optional(),
  mistakes: z.string().optional(),
  lessons: z.string().optional(),
  risk_amount: z.number().optional(),
  screenshot_url: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') ?? '200')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = createServiceClient()
  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user!.id)
    .order('opened_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (accountId) query = query.eq('account_id', accountId)
  if (status) query = query.eq('status', status)

  const { data, error: dbError } = await query
  if (dbError) return err(dbError.message)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json()
  const parsed = createTradeSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('trades')
    .insert({ ...parsed.data, user_id: user!.id })
    .select()
    .single()

  if (dbError) return err(dbError.message)
  return ok(data, 201)
}
