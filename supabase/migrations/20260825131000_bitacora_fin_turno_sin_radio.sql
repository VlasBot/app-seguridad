-- La bitácora de término sólo pide observaciones y kilometraje, así que no
-- puede afirmar que la radio estaba operativa: sin el dato, la columna queda
-- nula en lugar de tomar el valor por defecto.
alter table public.bitacoras alter column estado_radio drop not null;

create or replace function public.cerrar_turno(
  p_turno_id uuid,
  p_observaciones text default null,
  p_kilometrajes jsonb default '[]'::jsonb
)
returns estado_turno
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inspector uuid := (select auth.uid());
  v_lectura record;
  v_asignacion public.turno_vehiculos%rowtype;
  v_vehiculo_bitacora uuid;
  v_kilometraje_bitacora integer;
begin
  if v_inspector is null or not public.es_integrante_turno(p_turno_id) then
    raise exception 'No perteneces a este turno.';
  end if;

  if exists (
    select 1
    from public.bitacoras
    where turno_id = p_turno_id
      and inspector_id = v_inspector
      and tipo = 'fin_turno'
  ) then
    raise exception 'Ya registraste el término de este turno.';
  end if;

  for v_lectura in
    select (item ->> 'vehiculo_id')::uuid as vehiculo_id,
           (item ->> 'kilometraje_final')::integer as kilometraje_final
    from jsonb_array_elements(coalesce(p_kilometrajes, '[]'::jsonb)) as item
  loop
    if v_lectura.vehiculo_id is null or v_lectura.kilometraje_final is null then
      continue;
    end if;

    select * into v_asignacion
    from public.turno_vehiculos
    where turno_id = p_turno_id
      and vehiculo_id = v_lectura.vehiculo_id
    for update;

    if not found then
      raise exception 'El vehículo indicado no está asignado a este turno.';
    end if;

    -- Otro inspector del grupo se adelantó: se conserva la primera lectura.
    if v_asignacion.kilometraje_final is not null then
      continue;
    end if;

    if v_lectura.kilometraje_final < coalesce(v_asignacion.kilometraje, 0) then
      raise exception 'El kilometraje final no puede ser menor al del inicio del turno.';
    end if;

    update public.turno_vehiculos
    set kilometraje_final = v_lectura.kilometraje_final,
        kilometraje_final_por = v_inspector,
        kilometraje_final_en = now()
    where id = v_asignacion.id;

    update public.vehiculos
    set kilometraje_actual = greatest(coalesce(kilometraje_actual, 0), v_lectura.kilometraje_final),
        actualizado_en = now()
    where id = v_lectura.vehiculo_id;

    -- La bitácora guarda la primera lectura que ingresó este inspector.
    if v_vehiculo_bitacora is null then
      v_vehiculo_bitacora := v_lectura.vehiculo_id;
      v_kilometraje_bitacora := v_lectura.kilometraje_final;
    end if;
  end loop;

  insert into public.bitacoras (
    turno_id, inspector_id, tipo, vehiculo_id, kilometraje_reportado, estado_radio, incidencias
  )
  values (
    p_turno_id,
    v_inspector,
    'fin_turno',
    v_vehiculo_bitacora,
    v_kilometraje_bitacora,
    null,
    nullif(btrim(coalesce(p_observaciones, '')), '')
  );

  return public.sincronizar_estado_turno(p_turno_id);
end;
$$;

revoke execute on function public.cerrar_turno(uuid, text, jsonb) from public, anon;
grant execute on function public.cerrar_turno(uuid, text, jsonb) to authenticated;

-- Las bitácoras de término ya registradas tomaron el valor por defecto sin que
-- nadie lo respondiera: se limpian para no contaminar futuros reportes.
update public.bitacoras
set estado_radio = null
where tipo = 'fin_turno';
