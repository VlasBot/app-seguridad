-- Una vez que el responsable cierra la bitácora de término, el turno queda
-- "finalizado" y ningún inspector del grupo (ni siquiera el responsable)
-- puede seguir registrando procedimientos en terreno con ese turno. Antes,
-- un turno_id nulo se aceptaba sin más: eso también dejaba registrar
-- procedimientos sin turno vigente (por ejemplo, ya cerrado el turno). Ahora
-- un inspector siempre debe tener un turno propio, no finalizado, y ser su
-- responsable (o no tener responsable asignado, turnos antiguos).
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
      )
    )
  );
