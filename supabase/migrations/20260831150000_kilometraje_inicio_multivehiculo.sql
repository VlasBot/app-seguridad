-- Cuando el turno tiene dos o más vehículos, el responsable debe declarar el
-- kilometraje de cada uno al iniciar (no sólo el de uno). La bitácora de
-- inicio sigue guardando una sola fila (un inspector = una bitácora de
-- inicio), así que las lecturas de todos los vehículos se guardan directo en
-- `turno_vehiculos.kilometraje`, igual que `cerrar_turno` ya hace con la
-- lectura final.
create or replace function public.registrar_kilometraje_inicio_turno(
  p_turno_id uuid,
  p_kilometrajes jsonb default '[]'::jsonb
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
  v_actual integer;
begin
  if v_inspector is null then
    raise exception 'No autenticado.';
  end if;

  select responsable_id into v_responsable from public.turnos where id = p_turno_id;

  if v_responsable is null or v_responsable <> v_inspector then
    raise exception 'Sólo el responsable del turno puede registrar el kilometraje inicial.';
  end if;

  for v_item in
    select (item ->> 'vehiculo_id')::uuid as vehiculo_id,
           (item ->> 'kilometraje')::integer as kilometraje
    from jsonb_array_elements(coalesce(p_kilometrajes, '[]'::jsonb)) as item
  loop
    if v_item.vehiculo_id is null or v_item.kilometraje is null then
      continue;
    end if;

    select kilometraje into v_actual
    from public.turno_vehiculos
    where turno_id = p_turno_id and vehiculo_id = v_item.vehiculo_id
    for update;

    if not found then
      raise exception 'El vehículo indicado no está asignado a este turno.';
    end if;

    if v_item.kilometraje < coalesce(v_actual, 0) then
      raise exception 'El kilometraje inicial no puede ser menor al ya registrado para ese vehículo.';
    end if;

    update public.turno_vehiculos
    set kilometraje = v_item.kilometraje
    where turno_id = p_turno_id and vehiculo_id = v_item.vehiculo_id;

    update public.vehiculos
    set kilometraje_actual = greatest(coalesce(kilometraje_actual, 0), v_item.kilometraje),
        actualizado_en = now()
    where id = v_item.vehiculo_id;
  end loop;
end;
$$;

revoke execute on function public.registrar_kilometraje_inicio_turno(uuid, jsonb) from public, anon;
grant execute on function public.registrar_kilometraje_inicio_turno(uuid, jsonb) to authenticated;
