import { createFileRoute } from '@/lib/router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/clerk/_authenticated')({
  component: AuthenticatedLayout,
})
