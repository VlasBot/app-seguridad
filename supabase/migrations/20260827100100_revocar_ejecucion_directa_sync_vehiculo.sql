-- Estas funciones son de uso interno (las llaman los triggers, no el
-- cliente). Postgres las ejecuta igual desde el trigger sin necesitar
-- permiso explícito; se revoca el acceso directo vía RPC por buena práctica.
revoke execute on function public.recalcular_estado_vehiculo(uuid) from public, anon, authenticated;
revoke execute on function public.trg_recalcular_vehiculo_turno_vehiculos() from public, anon, authenticated;
revoke execute on function public.trg_recalcular_vehiculos_por_turno() from public, anon, authenticated;
revoke execute on function public.trg_recalcular_vehiculo_al_editar() from public, anon, authenticated;
revoke execute on function public.trg_bloquear_asignacion_vehiculo_no_operativo() from public, anon, authenticated;
