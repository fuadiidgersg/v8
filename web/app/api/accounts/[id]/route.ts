import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err, validationError } from '@/lib/server/response'

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  broker: z.string().optional(),
  number: z.string().optional(),
  type: z.enum(['live', 'demo', 'prop']).optional(),
  currency: z.string().optional(),
  starting_balance: z.number().nonnegative().optional(),
  is_archived: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (dbError) return err('Account not found', 404)
  return ok(data)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateAccountSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('accounts')
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
    .from('accounts')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('user_id', user!.id)

  if (dbError) return err(dbError.message)
  return ok({ success: true })
}
