-- El responsable del turno pasa lista al iniciar la jornada: marca presente o
-- ausente a cada inspector asignado. Es sólo informativo (no saca a nadie del
-- turno ni afecta su estado); central y admin pueden revisarlo después.
alter table public.turno_inspectores
  add column if not exists presente boolean,
  add column if not exists asistencia_registrada_en timestamptz;

comment on column public.turno_inspectores.presente is
  'Asistencia pasada por el responsable al iniciar el turno. NULL = aún no se pasó lista.';
comment on column public.turno_inspectores.asistencia_registrada_en is
  'Momento en que el responsable pasó lista.';

-- ---------------------------------------------------------------
-- 1. Pasar lista: sólo el responsable del turno, sólo sobre sus integrantes
-- ---------------------------------------------------------------
create or replace function public.registrar_asistencia_turno(
  p_turno_id uuid,
  p_asistencia jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inspector uuid := (select auth.uid());
  v_responsable uuid;
  v_item record;
begin
  if v_inspector is null then
    raise exception 'No autenticado.';
  end if;

  select responsable_id into v_responsable from public.turnos where id = p_turno_id;

  if v_responsable is null or v_responsable <> v_inspector then
    raise exception 'Sólo el responsable del turno puede pasar lista.';
  end if;

  for v_item in
    select (item ->> 'inspector_id')::uuid as inspector_id,
           (item ->> 'presente')::boolean as presente
    from jsonb_array_elements(coalesce(p_asistencia, '[]'::jsonb)) as item
  loop
    if v_item.inspector_id is null or v_item.presente is null then
      continue;
    end if;

    update public.turno_inspectores
    set presente = v_item.presente,
        asistencia_registrada_en = now()
    where turno_id = p_turno_id
      and inspector_id = v_item.inspector_id;
  end loop;
end;
$$;

revoke execute on function public.registrar_asistencia_turno(uuid, jsonb) from public, anon;
grant execute on function public.registrar_asistencia_turno(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------
-- 2. Un inspector consulta la asistencia junto con los nombres del equipo
-- ---------------------------------------------------------------
drop function if exists public.integrantes_turno(uuid);

create function public.integrantes_turno(p_turno_id uuid)
returns table (inspector_id uuid, nombre_completo text, presente boolean)
language sql
stable
security definer
set search_path = public
as $$
  select ti.inspector_id, p.nombre_completo, ti.presente
  from public.turno_inspectores ti
  join public.profiles p on p.id = ti.inspector_id
  where ti.turno_id = p_turno_id
    and (
      public.es_integrante_turno(p_turno_id)
      or (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    )
  order by p.nombre_completo;
$$;

revoke execute on function public.integrantes_turno(uuid) from public, anon;
grant execute on function public.integrantes_turno(uuid) to authenticated;
