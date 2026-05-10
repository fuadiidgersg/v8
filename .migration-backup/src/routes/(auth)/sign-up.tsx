import { createFileRoute } from '@/lib/router'
import { SignUp } from '@/features/auth/sign-up'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUp,
})
