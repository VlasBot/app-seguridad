import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado - falta header Authorization' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar que el usuario que hace la solicitud sea admin
    const { data: usuarioActual, error: errorAuth } = await supabase.auth.getUser(token)
    if (errorAuth || !usuarioActual?.user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const { data: perfilActual, error: errorPerfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', usuarioActual.user.id)
      .single()

    if (errorPerfil || perfilActual?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo administradores pueden editar usuarios' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    const body = await req.json()
    const { id, nombre_completo, email, password, role, rut, telefono } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'Falta el id del usuario a editar' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Actualizar credenciales en Auth solo si se enviaron cambios
    const cambiosAuth: Record<string, unknown> = {}
    if (email) cambiosAuth.email = email
    if (password) cambiosAuth.password = password

    if (Object.keys(cambiosAuth).length > 0) {
      const { error: errorUpdateAuth } = await supabase.auth.admin.updateUserById(id, cambiosAuth)
      if (errorUpdateAuth) {
        return new Response(JSON.stringify({ error: errorUpdateAuth.message }), {
          status: 400,
          headers: corsHeaders,
        })
      }
    }

    // Actualizar datos del perfil
    const { data: perfilActualizado, error: errorUpdateProfile } = await supabase
      .from('profiles')
      .update({
        nombre_completo,
        role,
        rut: rut || null,
        telefono: telefono || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (errorUpdateProfile) {
      return new Response(JSON.stringify({ error: errorUpdateProfile.message }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    return new Response(
      JSON.stringify({
        message: 'Usuario actualizado exitosamente',
        usuario: { ...perfilActualizado, email: email || undefined },
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    )
  } catch (error) {
    console.error('Error en update-user:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
