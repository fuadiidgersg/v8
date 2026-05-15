import { NextRequest } from 'next/server'
  import { z } from 'zod'
  import { getAuthenticatedUser } from '@/lib/server/auth'
  import { createServiceClient } from '@/lib/server/supabase'
  import { ok, err, validationError } from '@/lib/server/response'

  const createNoteSchema = z.object({
    id: z.string().min(1),
    account_id: z.string().min(1),
    title: z.string().default('New journal entry'),
    body: z.string().default(''),
    mood: z.enum(['great', 'good', 'neutral', 'frustrated', 'tilted']).default('neutral'),
    tags: z.array(z.string()).default([]),
  })

  export async function GET(req: NextRequest) {
    const { user, error } = await getAuthenticatedUser()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('account_id')

    const supabase = createServiceClient()
    let query = supabase
      .from('journal_notes')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })

    if (accountId) query = query.eq('account_id', accountId)

    const { data, error: dbError } = await query
    if (dbError) return err(dbError.message)
    return ok(data)
  }

  export async function POST(req: NextRequest) {
    const { user, error } = await getAuthenticatedUser()
    if (error) return error

    const body = await req.json()
    const parsed = createNoteSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const supabase = createServiceClient()
    const { data, error: dbError } = await supabase
      .from('journal_notes')
      .upsert({ ...parsed.data, user_id: user!.id }, { onConflict: 'id' })
      .select()
      .single()

    if (dbError) return err(dbError.message)
    return ok(data, 201)
  }
  