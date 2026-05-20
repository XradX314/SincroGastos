import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { User } from '../types'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({
        ...s,
        session,
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? '',
              created_at: session.user.created_at,
            }
          : null,
        loading: false,
      }))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        session,
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? '',
              created_at: session.user.created_at,
            }
          : null,
        loading: false,
        error: null,
      }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setState((s) => ({ ...s, loading: false, error: 'Credenciales inválidas. Intentá de nuevo.' }))
      return false
    }
    return true
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const clearError = () => setState((s) => ({ ...s, error: null }))

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    clearError,
  }
}
