import { createFileRoute } from '@/lib/router'
import { SignIn2 } from '@/features/auth/sign-in/sign-in-2'

export const Route = createFileRoute('/(auth)/sign-in-2')({
  component: SignIn2,
})
