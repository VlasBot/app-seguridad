import { supabase } from '../../lib/supabaseClient'

export async function obtenerFotosProcedimiento(procedimientoId) {
  const { data, error } = await supabase
    .from('procedimiento_fotos')
    .select('id, storage_path')
    .eq('procedimiento_id', procedimientoId)

  if (error) return { data: [], error }

  const fotos = await Promise.all(
    data.map(async (foto) => {
      const { data: urlFirmada } = await supabase.storage
        .from('procedimientos-fotos')
        .createSignedUrl(foto.storage_path, 3600)

      return { id: foto.id, url: urlFirmada?.signedUrl ?? null }
    }),
  )

  return { data: fotos.filter((foto) => foto.url), error: null }
}

export async function subirFotoProcedimiento(procedimientoId, archivo, subidaPor) {
  const rutaArchivo = `${procedimientoId}/${crypto.randomUUID()}.jpg`

  const { error: errorSubida } = await supabase.storage
    .from('procedimientos-fotos')
    .upload(rutaArchivo, archivo)

  if (errorSubida) return { data: null, error: errorSubida }

  const { data, error } = await supabase
    .from('procedimiento_fotos')
    .insert({ procedimiento_id: procedimientoId, storage_path: rutaArchivo, subida_por: subidaPor })
    .select()
    .single()

  return { data, error }
}
