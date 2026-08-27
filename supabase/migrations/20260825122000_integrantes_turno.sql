-- Un inspector sólo puede leer su propio perfil, por lo que necesita una vía
-- acotada para conocer los nombres de los compañeros con los que patrulla.
create or replace function public.integrantes_turno(p_turno_id uuid)
returns table (inspector_id uuid, nombre_completo text)
language sql
stable
security definer
set search_path = public
as $$
  select ti.inspector_id, p.nombre_completo
  from public.turno_inspectores ti
  join public.profiles p on p.id = ti.inspector_id
  where ti.turno_id = p_turno_id
    and (
      public.es_integrante_turno(p_turno_id)
      or (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    )
  order by p.nombre_completo;
$$;

grant execute on function public.integrantes_turno(uuid) to authenticated;
