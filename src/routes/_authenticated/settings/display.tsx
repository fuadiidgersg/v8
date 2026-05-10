import { createFileRoute } from '@/lib/router'
import { SettingsDisplay } from '@/features/settings/display'

export const Route = createFileRoute('/_authenticated/settings/display')({
  component: SettingsDisplay,
})
