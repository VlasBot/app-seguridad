-- Un procedimiento "Realizado" queda congelado: nadie (ni siquiera admin)
-- puede volver a cambiarle el estado. Misma idea que ya se aplica a los
-- turnos finalizados: la condición va en el USING, evaluada contra la fila
-- ya existente, así que sigue permitiendo la transición HACIA "Realizado"
-- pero bloquea cualquier cambio posterior.
drop policy if exists procedimientos_update on public.procedimientos;
create policy procedimientos_update on public.procedimientos
  for update
  using (
    estado <> 'Realizado'
    and (
      registrado_por = (select auth.uid())
      or (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
    )
  )
  with check (
    registrado_por = (select auth.uid())
    or (select current_user_role()) = any (array['central'::rol_usuario, 'admin'::rol_usuario])
  );
