import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/server/supabase'

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('trades').select('id').limit(1)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 })
    }
    return NextResponse.json({ ok: true, supabase: 'connected' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }
}
