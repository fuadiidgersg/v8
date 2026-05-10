import { createFileRoute } from '@/lib/router'
import { Analytics } from '@/features/analytics'

export const Route = createFileRoute('/_authenticated/analytics/')({
  component: Analytics,
})
