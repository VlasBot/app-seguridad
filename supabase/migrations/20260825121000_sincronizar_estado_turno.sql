-- Con turnos grupales el estado ya no lo define un solo inspector:
-- el turno queda "en curso" cuando alguien registra su bitácora de inicio y
-- "finalizado" sólo cuando todos los inspectores asignados cerraron la suya.
create or replace function public.sincronizar_estado_turno(p_turno_id uuid)
returns estado_turno
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_iniciados integer;
  v_cerrados integer;
  v_estado estado_turno;
begin
  if not public.es_integrante_turno(p_turno_id)
     and (select current_user_role()) <> all (array['central'::rol_usuario, 'admin'::rol_usuario]) then
    raise exception 'No autorizado para modificar este turno';
  end if;

  select count(*) into v_total
  from public.turno_inspectores
  where turno_id = p_turno_id;

  select count(distinct inspector_id) into v_iniciados
  from public.bitacoras
  where turno_id = p_turno_id and tipo = 'inicio_turno';

  select count(distinct inspector_id) into v_cerrados
  from public.bitacoras
  where turno_id = p_turno_id and tipo = 'fin_turno';

  if v_total > 0 and v_cerrados >= v_total then
    v_estado := 'finalizado';
  elsif v_iniciados > 0 then
    v_estado := 'en_curso';
  else
    v_estado := 'programado';
  end if;

  update public.turnos
  set estado = v_estado
  where id = p_turno_id
    and estado <> 'cancelado';

  select estado into v_estado from public.turnos where id = p_turno_id;
  return v_estado;
end;
$$;

grant execute on function public.sincronizar_estado_turno(uuid) to authenticated;
