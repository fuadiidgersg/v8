import { createFileRoute } from '@/lib/router'
import { MaintenanceError } from '@/features/errors/maintenance-error'

export const Route = createFileRoute('/(errors)/503')({
  component: MaintenanceError,
})
