-- MIZ Loja · Admin Miz com login próprio (WhatsApp), troca de senha e último acesso

alter table public.mizloja_admins
  add column whatsapp text check (whatsapp ~ '^55\d{10,11}$'),
  add column usuario text unique check (usuario ~ '^\d{10,15}$'),
  add column precisa_trocar_senha boolean not null default true,
  add column ultimo_acesso_em timestamptz,
  add column criado_por uuid references auth.users(id) on delete set null,
  add column updated_at timestamptz not null default now();
create index mizloja_admins_criado_por_idx on public.mizloja_admins (criado_por);

-- normaliza e protege (só service role / funções internas mudam usuário, senha e situação)
create or replace function public.mizloja_tg_admins_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.whatsapp := public.mizloja_normalizar_whatsapp(new.whatsapp);
  if tg_op = 'INSERT' then
    new.usuario := coalesce(public.mizloja_normalizar_whatsapp(new.usuario), new.whatsapp);
    new.criado_por := coalesce((select auth.uid()), new.criado_por);
  else
    if not public.mizloja_eh_interno() then
      new.usuario := old.usuario;
      new.precisa_trocar_senha := old.precisa_trocar_senha;
      new.ultimo_acesso_em := old.ultimo_acesso_em;
      new.ativo := old.ativo;
      new.criado_por := old.criado_por;
      new.created_at := old.created_at;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger mizloja_admins_antes
before insert or update on public.mizloja_admins
for each row execute function public.mizloja_tg_admins_antes();

revoke all on function public.mizloja_tg_admins_antes() from public, anon, authenticated;

-- Admin Miz edita SÓ o nome de admins pela API (grant de coluna: id, WhatsApp, usuário,
-- situação e senha não são editáveis pela tela; trocar de número = criar conta nova)
grant update (nome) on public.mizloja_admins to authenticated;
create policy mizloja_admins_update on public.mizloja_admins
  for update to authenticated
  using ((select mizloja_interno.mizloja_eh_admin_miz()))
  with check ((select mizloja_interno.mizloja_eh_admin_miz()));

-- acesso e troca de senha valem também para Admin Miz
create or replace function public.mizloja_registrar_acesso()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mizloja_usuarias set ultimo_acesso_em = now() where id = (select auth.uid());
  update public.mizloja_admins set ultimo_acesso_em = now() where id = (select auth.uid());
end;
$$;

create or replace function public.mizloja_senha_trocada()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mizloja_usuarias set precisa_trocar_senha = false where id = (select auth.uid());
  update public.mizloja_admins set precisa_trocar_senha = false where id = (select auth.uid());
end;
$$;
