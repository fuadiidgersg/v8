import { createFileRoute } from '@/lib/router'
import { SettingsProfile } from '@/features/settings/profile'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsProfile,
})
