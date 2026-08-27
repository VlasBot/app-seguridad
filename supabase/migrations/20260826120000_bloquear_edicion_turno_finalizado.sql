-- Un turno finalizado queda congelado: nadie (ni central, ni admin) puede
-- volver a editarlo. La condición se agrega al USING de cada política de
-- escritura, evaluado contra la fila ya existente, así que sigue permitiendo
-- la transición HACIA "finalizado" pero bloquea cualquier cambio posterior.

drop policy if exists turnos_update on public.turnos;
create policy turnos_update on public.turnos
  for update
  using (
    estado <> 'finalizado'
    and (
      (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
      or public.es_integrante_turno(id)
    )
  )
  with check (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    or public.es_integrante_turno(id)
  );

drop policy if exists turno_inspectores_gestion on public.turno_inspectores;
create policy turno_inspectores_gestion on public.turno_inspectores
  for all
  using (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    and not exists (
      select 1 from public.turnos t
      where t.id = turno_inspectores.turno_id and t.estado = 'finalizado'
    )
  )
  with check (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    and not exists (
      select 1 from public.turnos t
      where t.id = turno_inspectores.turno_id and t.estado = 'finalizado'
    )
  );

drop policy if exists turno_vehiculos_gestion on public.turno_vehiculos;
create policy turno_vehiculos_gestion on public.turno_vehiculos
  for all
  using (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    and not exists (
      select 1 from public.turnos t
      where t.id = turno_vehiculos.turno_id and t.estado = 'finalizado'
    )
  )
  with check (
    (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    and not exists (
      select 1 from public.turnos t
      where t.id = turno_vehiculos.turno_id and t.estado = 'finalizado'
    )
  );
