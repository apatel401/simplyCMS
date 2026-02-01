'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        // Fetch user from database
        fetch(`/api/users/${authUser.id}`)
          .then(res => res.json())
          .then(setUser)
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const response = await fetch(`/api/users/${session.user.id}`)
          const userData = await response.json()
          setUser(userData)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}