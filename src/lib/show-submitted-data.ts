import { toast } from 'sonner'

export function showSubmittedData(data: unknown, title = 'You submitted the following values:') {
  toast(title, {
    description: (
      typeof data === 'object'
        ? JSON.stringify(data, null, 2)
        : String(data)
    ),
    duration: 5000,
  })
}
