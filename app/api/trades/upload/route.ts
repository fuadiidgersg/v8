import { NextRequest } from 'next/server'
  import { getAuthenticatedUser } from '@/lib/server/auth'
  import { createServiceClient } from '@/lib/server/supabase'
  import { ok, err } from '@/lib/server/response'

  const MAX_BYTES = 5 * 1024 * 1024
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  const BUCKET = 'trade-screenshots'

  export async function POST(req: NextRequest) {
    const { user, error } = await getAuthenticatedUser()
    if (error) return error

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return err('Expected multipart/form-data body', 400)
    }

    const file = formData.get('file')
    if (!(file instanceof File)) return err('Missing file field', 400)
    if (file.size > MAX_BYTES) return err('File exceeds 5 MB limit', 413)
    if (!ALLOWED_TYPES.has(file.type)) {
      return err('Only JPEG, PNG, WebP and GIF images are accepted', 415)
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const supabase = createServiceClient()
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) return err(uploadError.message)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return ok({ url: data.publicUrl })
  }
  