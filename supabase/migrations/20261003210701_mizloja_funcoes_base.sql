-- MIZ Loja · funções de apoio sem dependência de tabelas

-- Deixa só os dígitos; com 10 ou 11 dígitos (DDD + número) prefixa o DDI 55.
create or replace function public.mizloja_normalizar_whatsapp(p_valor text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
           when d = '' then null
           when length(d) in (10, 11) then '55' || d
           else d
         end
  from (select regexp_replace(coalesce(p_valor, ''), '\D', '', 'g') as d) x;
$$;
comment on function public.mizloja_normalizar_whatsapp(text) is 'MIZ Loja: WhatsApp só com dígitos e DDI 55.';

-- Data de hoje no fuso de São Paulo.
create or replace function public.mizloja_hoje()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;
comment on function public.mizloja_hoje() is 'MIZ Loja: data de hoje em America/Sao_Paulo.';

-- Converte um instante para a data local de São Paulo.
create or replace function public.mizloja_data_local(p_instante timestamptz)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p_instante at time zone 'America/Sao_Paulo')::date;
$$;
comment on function public.mizloja_data_local(timestamptz) is 'MIZ Loja: data de um instante no fuso America/Sao_Paulo.';

-- Texto em minúsculas, sem acento e com espaços simples (usado na busca).
create or replace function public.mizloja_sem_acento(p_texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(btrim(regexp_replace(
           extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_texto, '')),
           '\s+', ' ', 'g')));
$$;
comment on function public.mizloja_sem_acento(text) is 'MIZ Loja: minúsculas, sem acento, espaços simples.';

-- Próxima data de aniversário a partir de uma data de referência (inclusive).
-- 29/02 em ano não bissexto vira 28/02; dia maior que o mês vira o último dia do mês.
create or replace function public.mizloja_proximo_aniversario(p_dia integer, p_mes integer, p_ref date)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_ano integer;
  v_data date;
begin
  if p_dia is null or p_mes is null or p_ref is null then
    return null;
  end if;
  v_ano := extract(year from p_ref)::integer;
  for i in 0..1 loop
    v_data := make_date(
      v_ano + i,
      p_mes,
      least(p_dia, extract(day from (make_date(v_ano + i, p_mes, 1) + interval '1 month - 1 day'))::integer)
    );
    if v_data >= p_ref then
      return v_data;
    end if;
  end loop;
  return null;
end;
$$;
comment on function public.mizloja_proximo_aniversario(integer, integer, date) is 'MIZ Loja: próximo aniversário (trata virada de ano e 29/02).';

-- Verdadeiro quando o comando vem de dentro do banco (funções SECURITY DEFINER,
-- service role da Edge Function, migrations) e não direto de uma usuária pela API.
create or replace function public.mizloja_eh_interno()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('authenticated', 'anon');
$$;
comment on function public.mizloja_eh_interno() is 'MIZ Loja: o comando vem de função interna/service role (não da usuária pela API).';

-- Gatilho genérico de updated_at.
create or replace function public.mizloja_tg_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
