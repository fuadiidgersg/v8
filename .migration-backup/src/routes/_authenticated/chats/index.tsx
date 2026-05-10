import { createFileRoute } from '@/lib/router'
import { Chats } from '@/features/chats'

export const Route = createFileRoute('/_authenticated/chats/')({
  component: Chats,
})
