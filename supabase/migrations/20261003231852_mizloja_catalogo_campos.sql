-- MIZ Loja · catálogo: composição, cor ativa, grade real nos itens de venda e proteção do histórico

-- 1) Campo "base/composição" da peça e cor que pode ser desativada
alter table public.mizloja_pecas add column composicao text;
alter table public.mizloja_peca_cores add column ativa boolean not null default true;

-- 2) Tamanho do item: peça Miz segue a grade cadastrada da peça (ex.: PP/P, M/G);
--    outra marca continua com a lista fixa.
alter table public.mizloja_venda_itens drop constraint mizloja_venda_itens_tamanho_check;
alter table public.mizloja_venda_itens add constraint mizloja_venda_itens_tamanho_ck check (
  btrim(tamanho) <> ''
  and (tipo = 'miz' or tamanho in ('PP', 'P', 'M', 'G', 'GG', 'Unico'))
);

-- 3) Peça ou cor já usada em venda não se apaga (só desativa)
alter table public.mizloja_venda_itens drop constraint mizloja_venda_itens_peca_id_fkey;
alter table public.mizloja_venda_itens add constraint mizloja_venda_itens_peca_id_fkey
  foreign key (peca_id) references public.mizloja_pecas(id) on delete restrict;
alter table public.mizloja_venda_itens drop constraint mizloja_venda_itens_peca_cor_id_fkey;
alter table public.mizloja_venda_itens add constraint mizloja_venda_itens_peca_cor_id_fkey
  foreign key (peca_cor_id) references public.mizloja_peca_cores(id) on delete restrict;

-- 4) Gatilho do item: valida a grade da peça e recusa peça/cor inativa em item novo
create or replace function public.mizloja_tg_venda_itens_antes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peca record;
  v_cor record;
  v_tam text;
begin
  if tg_op = 'UPDATE' and new.venda_id is distinct from old.venda_id then
    raise exception 'O item não pode mudar de venda.' using errcode = '42501';
  end if;

  select v.loja_id into new.loja_id from public.mizloja_vendas v where v.id = new.venda_id;
  if new.loja_id is null then
    raise exception 'Venda não encontrada.' using errcode = '23503';
  end if;

  v_tam := upper(btrim(coalesce(new.tamanho, '')));
  new.tamanho := case when v_tam in ('UNICO', 'ÚNICO', 'U', 'UN', 'TU') then 'Unico' else v_tam end;

  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;

  if new.tipo = 'miz' then
    if tg_op = 'INSERT'
       or new.peca_id is distinct from old.peca_id
       or new.peca_cor_id is distinct from old.peca_cor_id
       or new.tamanho is distinct from old.tamanho
       or new.tipo is distinct from old.tipo then
      if new.peca_id is null then
        raise exception 'Escolha a peça Miz.' using errcode = '23514';
      end if;
      select p.nome, p.codigo_referencia, p.ativa into v_peca from public.mizloja_pecas p where p.id = new.peca_id;
      if not found then
        raise exception 'Peça Miz não encontrada.' using errcode = '23503';
      end if;
      if new.peca_cor_id is null then
        raise exception 'Escolha a cor da peça.' using errcode = '23514';
      end if;
      select c.nome, c.valor, c.ativa into v_cor from public.mizloja_peca_cores c
      where c.id = new.peca_cor_id and c.peca_id = new.peca_id;
      if not found then
        raise exception 'Essa cor não pertence à peça escolhida.' using errcode = '23514';
      end if;
      -- peça ou cor desativada não entra em item novo nem em troca de peça/cor
      if (tg_op = 'INSERT' or new.peca_id is distinct from old.peca_id) and not v_peca.ativa then
        raise exception 'A peça % está inativa no catálogo.', v_peca.nome using errcode = '23514';
      end if;
      if (tg_op = 'INSERT' or new.peca_cor_id is distinct from old.peca_cor_id) and not v_cor.ativa then
        raise exception 'A cor % está inativa para essa peça.', v_cor.nome using errcode = '23514';
      end if;
      -- tamanho: grade cadastrada da peça; sem grade, vale a lista fixa
      if exists (select 1 from public.mizloja_peca_tamanhos t where t.peca_id = new.peca_id) then
        if not exists (select 1 from public.mizloja_peca_tamanhos t where t.peca_id = new.peca_id and t.valor = new.tamanho) then
          raise exception 'A peça % não tem o tamanho %.', v_peca.nome, new.tamanho using errcode = '23514';
        end if;
      elsif new.tamanho not in ('PP', 'P', 'M', 'G', 'GG', 'Unico') then
        raise exception 'Tamanho inválido.' using errcode = '23514';
      end if;
      new.peca_nome := v_peca.nome;
      new.peca_codigo := v_peca.codigo_referencia;
      new.cor := v_cor.nome;
      new.cor_hex := case when v_cor.valor ~* '^#[0-9a-f]{6}$' then lower(v_cor.valor) end;
    else
      new.peca_nome := old.peca_nome;
      new.peca_codigo := old.peca_codigo;
      new.cor := old.cor;
      new.cor_hex := old.cor_hex;
    end if;
  else
    new.peca_id := null;
    new.peca_cor_id := null;
    new.peca_nome := null;
    new.peca_codigo := null;
    new.cor := btrim(regexp_replace(coalesce(new.cor, ''), '\s+', ' ', 'g'));
    if new.cor = '' then
      raise exception 'Digite a cor da peça.' using errcode = '23514';
    end if;
    new.cor_hex := case when new.cor_hex ~* '^#[0-9a-f]{6}$' then lower(new.cor_hex) end;
  end if;

  return new;
end;
$$;

-- 5) Padronização do catálogo nas próximas gravações (os dados atuais já estão padronizados)
--    peça: nome aparado e código em maiúsculas; cor: nome aparado e hex minúsculo;
--    tamanho: maiúsculas, e "único/U" vira "Unico". Nome de cor não se repete na mesma peça.
create or replace function public.mizloja_tg_catalogo_padronizar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v text;
begin
  if tg_table_name = 'mizloja_pecas' then
    new.nome := btrim(regexp_replace(new.nome, '\s+', ' ', 'g'));
    new.codigo_referencia := upper(btrim(new.codigo_referencia));
    new.composicao := nullif(btrim(new.composicao), '');
  elsif tg_table_name = 'mizloja_peca_cores' then
    new.nome := btrim(regexp_replace(new.nome, '\s+', ' ', 'g'));
    new.valor := lower(btrim(new.valor));
  elsif tg_table_name = 'mizloja_peca_tamanhos' then
    v := upper(btrim(new.valor));
    new.valor := case when v in ('UNICO', 'ÚNICO', 'U', 'UN', 'TU') then 'Unico' else v end;
  end if;
  return new;
end;
$$;
revoke all on function public.mizloja_tg_catalogo_padronizar() from public, anon, authenticated;

create trigger mizloja_pecas_padronizar before insert or update on public.mizloja_pecas
  for each row execute function public.mizloja_tg_catalogo_padronizar();
create trigger mizloja_peca_cores_padronizar before insert or update on public.mizloja_peca_cores
  for each row execute function public.mizloja_tg_catalogo_padronizar();
create trigger mizloja_peca_tamanhos_padronizar before insert or update on public.mizloja_peca_tamanhos
  for each row execute function public.mizloja_tg_catalogo_padronizar();

create unique index mizloja_peca_cores_nome_uk on public.mizloja_peca_cores (peca_id, lower(nome));
