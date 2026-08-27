import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const AuthContext = createContext(null)

const cargarPerfil = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre_completo, rut, role, telefono, activo')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true

    const inicializar = async () => {
      const { data } = await supabase.auth.getSession()

      if (!activo) return

      setSession(data.session)

      if (data.session?.user) {
        const perfil = await cargarPerfil(data.session.user.id)
        if (activo) setProfile(perfil)
      }

      if (activo) setLoading(false)
    }

    inicializar()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nuevaSesion) => {
      setSession(nuevaSesion)

      if (nuevaSesion?.user) {
        const perfil = await cargarPerfil(nuevaSesion.user.id)
        setProfile(perfil)
      } else {
        setProfile(null)
      }
    })

    return () => {
      activo = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = { session, profile, loading, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
