import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { createServiceClient } from '@/lib/server/supabase'
import { ok, err } from '@/lib/server/response'

export async function GET(_req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const supabase = createServiceClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (profileError) {
    return err('Profile not found', 404)
  }

  return ok({ user: { id: user!.id, email: user!.email }, profile })
}
