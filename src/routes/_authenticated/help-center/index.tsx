import { createFileRoute } from '@/lib/router'
import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: ComingSoon,
})
