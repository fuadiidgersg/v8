'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { AuthLayout } from '@/features/auth/auth-layout'

const schema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'pro']),
  preferredPair: z.string().min(1, 'Preferred pair is required'),
  startingCapital: z.number().min(1, 'Starting capital must be greater than 0'),
})

type FormData = z.infer<typeof schema>

export default function Onboarding() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      experience: 'beginner',
      preferredPair: '',
      startingCapital: 0,
    },
  })

  // Pre-fill display name from signup metadata
  useEffect(() => {
    async function prefill() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const fullName = (user.user_metadata?.full_name as string | undefined)?.trim()
      if (fullName) {
        form.setValue('displayName', fullName, { shouldValidate: false })
      }
    }
    prefill()
  }, [form])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not authenticated')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: data.displayName,
      experience: data.experience,
      preferred_pair: data.preferredPair,
      starting_capital: data.startingCapital,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success('Profile saved! Welcome to FuadFX.')
    router.push('/')
    router.refresh()
  }

  return (
    <AuthLayout>
      <Card className='w-full max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Set up your profile
          </CardTitle>
          <CardDescription>
            Tell us a bit about yourself so we can personalise your trading
            journal experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex flex-col gap-4'
            >
              <FormField
                control={form.control}
                name='displayName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. FuadFX' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='experience'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <FormControl>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        items={[
                          { label: 'Beginner', value: 'beginner' },
                          { label: 'Intermediate', value: 'intermediate' },
                          { label: 'Advanced', value: 'advanced' },
                          { label: 'Pro', value: 'pro' },
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='preferredPair'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Pair</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. XAUUSD' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='startingCapital'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Capital (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='e.g. 1000'
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='mt-2 w-full' disabled={isLoading}>
                {isLoading && <Loader2 className='animate-spin' />}
                Continue to Dashboard
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
