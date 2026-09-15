-- B.2: leader/Documentos.tsx (anexar documento a um ministério) referenciava um bucket
-- inexistente ('ministerio-docs'). Reaproveitando o bucket 'documentos' já existente
-- (mesma convenção de prefixos por feature já usada: church-logos/, escola-biblica/ etc.),
-- com um novo prefixo ministerios/<ministerio_id>/. A policy de INSERT/UPDATE/DELETE do
-- bucket 'documentos' hoje só permite admin/superadmin — adicionando policies pra líder
-- gerenciar (upload/remover) documentos só dos ministérios dos quais é o líder.

create policy "documentos_leader_upload_own_ministerio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = 'ministerios'
    and has_role(auth.uid(), 'lider'::app_role)
    and exists (
      select 1 from public.ministerios m
      where m.id::text = (storage.foldername(name))[2]
        and m.lider_id = get_profile_id(auth.uid())
    )
  );

create policy "documentos_leader_delete_own_ministerio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = 'ministerios'
    and has_role(auth.uid(), 'lider'::app_role)
    and exists (
      select 1 from public.ministerios m
      where m.id::text = (storage.foldername(name))[2]
        and m.lider_id = get_profile_id(auth.uid())
    )
  );
