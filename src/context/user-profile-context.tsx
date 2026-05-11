'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UserProfile = {
  name: string
  email: string
  avatar: string
}

const defaultProfile: UserProfile = { name: '', email: '', avatar: '' }

const UserProfileContext = createContext<UserProfile>(defaultProfile)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const email = user.email ?? ''
      // Fall back chain: display_name from profile → full_name from signup metadata → email prefix
      let name = (user.user_metadata?.full_name as string | undefined)?.trim() || email.split('@')[0]

      try {
        const res = await fetch('/api/users/profile')
        if (res.ok) {
          const json = await res.json()
          if (json.data?.display_name) name = json.data.display_name
        }
      } catch {
        // ignore — use fallback name
      }

      setProfile({ name, email, avatar: '' })
    }
    load()
  }, [])

  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile(): UserProfile {
  return useContext(UserProfileContext)
}
