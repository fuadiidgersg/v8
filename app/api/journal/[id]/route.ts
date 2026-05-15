import { NextRequest } from 'next/server'
  import { z } from 'zod'
  import { getAuthenticatedUser } from '@/lib/server/auth'
  import { createServiceClient } from '@/lib/server/supabase'
  import { ok, err, validationError } from '@/lib/server/response'

  const patchNoteSchema = z.object({
    title: z.string().optional(),
    body: z.string().optional(),
    mood: z.enum(['great', 'good', 'neutral', 'frustrated', 'tilted']).optional(),
    tags: z.array(z.string()).optional(),
  })

  type Params = { params: Promise<{ id: string }> }

  export async function PATCH(req: NextRequest, { params }: Params) {
    const { user, error } = await getAuthenticatedUser()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = patchNoteSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const supabase = createServiceClient()
    const { data, error: dbError } = await supabase
      .from('journal_notes')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
      .from('journal_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (dbError) return err(dbError.message)
    return ok({ success: true })
  }
  