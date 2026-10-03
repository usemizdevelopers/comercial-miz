-- MIZ Loja · independência no login
-- O app MIZ tem o gatilho on_auth_user_created (handle_new_user), que cria um
-- registro em public.profiles para TODO usuário novo do Auth. Esse gatilho NÃO é
-- alterado. Em vez disso, este gatilho próprio roda no fim da transação de criação
-- (constraint trigger adiado) e remove o profile criado automaticamente quando o
-- usuário é do MIZ Loja (raw_user_meta_data->>'app' = 'mizloja').
-- Só toca na linha recém-criada daquele mesmo usuário; nada mais do app MIZ.

create or replace function public.mizloja_tg_auth_limpar_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'mizloja' then
    delete from public.profiles p where p.id = new.id;
  end if;
  return null;
end;
$$;
comment on function public.mizloja_tg_auth_limpar_profile() is 'MIZ Loja: remove o profile do app MIZ criado automaticamente para usuárias do MIZ Loja.';

create constraint trigger mizloja_auth_limpar_profile
after insert on auth.users
deferrable initially deferred
for each row
execute function public.mizloja_tg_auth_limpar_profile();
