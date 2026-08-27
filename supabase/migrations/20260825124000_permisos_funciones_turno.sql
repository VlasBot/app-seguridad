-- Sólo usuarios con sesión iniciada pueden invocar estas funciones.
-- `es_integrante_turno` conserva el permiso amplio porque se evalúa dentro de
-- las políticas RLS y para un visitante sin sesión siempre responde "false".
revoke execute on function public.integrantes_turno(uuid) from public, anon;
revoke execute on function public.sincronizar_estado_turno(uuid) from public, anon;

grant execute on function public.integrantes_turno(uuid) to authenticated;
grant execute on function public.sincronizar_estado_turno(uuid) to authenticated;
