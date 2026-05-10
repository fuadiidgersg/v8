import { createFileRoute } from '@/lib/router'
import { ForbiddenError } from '@/features/errors/forbidden'

export const Route = createFileRoute('/(errors)/403')({
  component: ForbiddenError,
})
