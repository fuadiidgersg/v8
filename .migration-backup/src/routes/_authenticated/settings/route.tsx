import { createFileRoute } from '@/lib/router'
import { Settings } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/settings')({
  component: Settings,
})
