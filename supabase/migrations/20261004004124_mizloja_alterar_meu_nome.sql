-- MIZ Loja · Perfil: a usuária logada (ADM ou vendedora) troca o próprio nome.
-- O RLS de mizloja_usuarias só deixa a ADM editar; esta função libera SÓ o nome da própria linha
-- (WhatsApp e usuário continuam sendo o login e não mudam por aqui).

create or replace function public.mizloja_alterar_meu_nome(p_nome text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_nome text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
begin
  if v_uid is null or mizloja_interno.mizloja_minha_loja() is null then
    raise exception 'Seu acesso está desativado.' using errcode = '42501';
  end if;
  if char_length(v_nome) < 2 then
    raise exception 'Digite o seu nome.' using errcode = '23514';
  end if;
  if char_length(v_nome) > 80 then
    raise exception 'Nome muito longo (até 80 letras).' using errcode = '23514';
  end if;
  update public.mizloja_usuarias set nome = v_nome where id = v_uid;
  return v_nome;
end;
$$;
comment on function public.mizloja_alterar_meu_nome(text) is 'MIZ Loja: a usuária logada troca o próprio nome (Perfil).';

revoke all on function public.mizloja_alterar_meu_nome(text) from public, anon;
grant execute on function public.mizloja_alterar_meu_nome(text) to authenticated, service_role;
