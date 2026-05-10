import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function validationError(error: ZodError) {
  return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 422 })
}
