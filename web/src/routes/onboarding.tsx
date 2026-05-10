import { createFileRoute } from '@/lib/router'
import Onboarding from '@/features/onboarding'

export const Route = createFileRoute('/onboarding')({
  component: Onboarding,
})
