import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err, validationError } from '@/lib/server/response'

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  preferred_pair: z.string().optional(),
  starting_capital: z.number().nonnegative().optional(),
})

export async function GET(_req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (dbError) return err('Profile not found', 404)
  return ok(data)
}

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user!.id)
    .select()
    .single()

  if (dbError) return err(dbError.message)
  return ok(data)
}
