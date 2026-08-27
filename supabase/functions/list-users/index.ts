import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
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
      return new Response(JSON.stringify({ error: 'Solo administradores pueden ver esta información' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    const { data: perfiles, error: errorPerfiles } = await supabase
      .from('profiles')
      .select('id, nombre_completo, rut, role, telefono, activo, creado_en')
      .order('creado_en', { ascending: false })

    if (errorPerfiles) {
      return new Response(JSON.stringify({ error: errorPerfiles.message }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Traer los emails desde auth.users (requiere service role)
    const emailsPorId = new Map()
    let pagina = 1
    const porPagina = 1000
    while (true) {
      const { data: listado, error: errorListado } = await supabase.auth.admin.listUsers({
        page: pagina,
        perPage: porPagina,
      })

      if (errorListado) {
        return new Response(JSON.stringify({ error: errorListado.message }), {
          status: 400,
          headers: corsHeaders,
        })
      }

      for (const usuario of listado.users) {
        emailsPorId.set(usuario.id, usuario.email)
      }

      if (listado.users.length < porPagina) break
      pagina += 1
    }

    const usuarios = perfiles.map((perfil) => ({
      ...perfil,
      email: emailsPorId.get(perfil.id) ?? null,
    }))

    return new Response(JSON.stringify({ usuarios }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('Error en list-users:', error)
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
