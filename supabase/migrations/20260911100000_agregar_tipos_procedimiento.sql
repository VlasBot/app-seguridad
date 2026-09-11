-- Nuevos tipos de procedimiento solicitados por Central.
alter type public.tipo_procedimiento add value if not exists 'Agua en la vía pública';
alter type public.tipo_procedimiento add value if not exists 'Corte de energía eléctrica';
