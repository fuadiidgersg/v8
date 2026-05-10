import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err, validationError } from '@/lib/server/response'

const schema = z.object({
  ids: z.array(z.string()).min(1),
  account_id: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = createServiceClient()
  let query = supabase
    .from('trades')
    .delete()
    .eq('user_id', user!.id)

  if (parsed.data.account_id) {
    query = query.eq('account_id', parsed.data.account_id)
  } else {
    query = query.in('id', parsed.data.ids)
  }

  const { error: dbError } = await query
  if (dbError) return err(dbError.message)
  return ok({ success: true })
}
