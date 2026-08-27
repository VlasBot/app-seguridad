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
      return new Response(JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    const body = await req.json()
    const { nombre_completo, email, password, role, rut, telefono } = body

    if (!nombre_completo || !email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: nombre_completo, email, password, role' }),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    // Crear usuario en Auth
    // El trigger on_auth_user_created (handle_new_user) inserta automáticamente
    // la fila en profiles usando estos metadatos, así que aquí solo completamos
    // los campos que el trigger no conoce (rut, telefono).
    const { data: nuevoUsuario, error: errorCreateUser } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        role,
      },
    })

    if (errorCreateUser) {
      return new Response(JSON.stringify({ error: errorCreateUser.message }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Completar los datos del perfil creado por el trigger
    const { error: errorUpdateProfile } = await supabase
      .from('profiles')
      .update({
        rut: rut || null,
        telefono: telefono || null,
      })
      .eq('id', nuevoUsuario.user.id)

    if (errorUpdateProfile) {
      // Si falla completar el perfil, eliminar el usuario de auth (el trigger
      // elimina en cascada la fila de profiles)
      await supabase.auth.admin.deleteUser(nuevoUsuario.user.id)
      return new Response(JSON.stringify({ error: errorUpdateProfile.message }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    return new Response(
      JSON.stringify({
        message: 'Usuario creado exitosamente',
        user: { id: nuevoUsuario.user.id, email },
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    )
  } catch (error) {
    console.error('Error en create-user:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
