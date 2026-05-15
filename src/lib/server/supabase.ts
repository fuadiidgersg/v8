import { createClient } from '@supabase/supabase-js'

const REQUIRED_SERVER_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

for (const key of REQUIRED_SERVER_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Set it in your environment variables before starting the server.`
    )
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function createServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
