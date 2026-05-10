import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err, validationError } from '@/lib/server/response'

const updateTradeSchema = z.object({
  account_id: z.string().optional(),
  account: z.string().optional(),
  pair: z.string().optional(),
  direction: z.enum(['long', 'short']).optional(),
  entry: z.number().optional(),
  exit: z.number().optional(),
  stop_loss: z.number().optional(),
  take_profit: z.number().optional(),
  lots: z.number().nonnegative().optional(),
  pnl: z.number().optional(),
  pips: z.number().optional(),
  r_multiple: z.number().optional(),
  status: z.enum(['win', 'loss', 'breakeven', 'open']).optional(),
  opened_at: z.string().optional(),
  closed_at: z.string().optional(),
  strategy: z.string().optional(),
  session: z.string().optional(),
  timeframe: z.string().optional(),
  emotion: z.string().optional(),
  notes: z.string().optional(),
  mistakes: z.string().optional(),
  lessons: z.string().optional(),
  risk_amount: z.number().optional(),
  screenshot_url: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (dbError) return err('Trade not found', 404)
  return ok(data)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateTradeSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('trades')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user!.id)
    .select()
    .single()

  if (dbError) return err(dbError.message)
  return ok(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const supabase = createServiceClient()
  const { error: dbError } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id)

  if (dbError) return err(dbError.message)
  return ok({ success: true })
}
