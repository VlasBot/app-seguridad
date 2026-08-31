-- Un inspector no puede registrar procedimientos en terreno si aún no
-- registró su propia bitácora de inicio de turno.
drop policy if exists procedimientos_insert_todos on public.procedimientos;
create policy procedimientos_insert_todos on public.procedimientos
  for insert
  with check (
    registrado_por = (select auth.uid())
    and (select current_user_role()) = any (array['inspector'::rol_usuario, 'central'::rol_usuario, 'admin'::rol_usuario])
    and (
      (select current_user_role()) <> 'inspector'::rol_usuario
      or (
        turno_id is not null
        and exists (
          select 1
          from public.turnos t
          where t.id = procedimientos.turno_id
            and t.estado <> 'finalizado'
            and (t.responsable_id is null or t.responsable_id = (select auth.uid()))
        )
        and exists (
          select 1
          from public.bitacoras b
          where b.turno_id = procedimientos.turno_id
            and b.inspector_id = (select auth.uid())
            and b.tipo = 'inicio_turno'
        )
      )
    )
  );
