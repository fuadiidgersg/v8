import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err, validationError } from '@/lib/server/response'

const createAccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  broker: z.string().min(1).max(100),
  number: z.string().optional().default(''),
  type: z.enum(['live', 'demo', 'prop']).default('live'),
  currency: z.string().default('USD'),
  starting_balance: z.number().nonnegative().default(0),
})

export async function GET(_req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (dbError) return err(dbError.message)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json()
  const parsed = createAccountSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('accounts')
    .insert({ ...parsed.data, user_id: user!.id })
    .select()
    .single()

  if (dbError) return err(dbError.message)
  return ok(data, 201)
}
