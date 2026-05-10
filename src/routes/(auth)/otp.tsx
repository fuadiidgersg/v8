import { createFileRoute } from '@/lib/router'
import { Otp } from '@/features/auth/otp'

export const Route = createFileRoute('/(auth)/otp')({
  component: Otp,
})
