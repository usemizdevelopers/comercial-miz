-- MIZ Loja · configurações e mensagens de cada loja

create table public.mizloja_config (
  loja_id uuid primary key references public.mizloja_lojas(id) on delete cascade,
  dias_pos_venda integer not null default 5 check (dias_pos_venda >= 1),
  dias_pos_venda_limite integer not null default 10,
  dias_comprou integer not null default 15 check (dias_comprou >= 1),
  dias_recompra integer not null default 30,
  dias_sumida integer not null default 60,
  dias_inativa integer not null default 90,
  dias_followup_conversa integer not null default 15 check (dias_followup_conversa >= 1),
  dias_followup_recontato integer not null default 30 check (dias_followup_recontato >= 1),
  visibilidade_vendedora text not null default 'proprias' check (visibilidade_vendedora in ('proprias', 'todas')),
  ranking_visivel boolean not null default false,
  atualizado_por uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint mizloja_config_pos_venda_ck check (dias_pos_venda_limite >= dias_pos_venda),
  constraint mizloja_config_prazos_ck check (dias_comprou <= dias_recompra and dias_recompra < dias_sumida and dias_sumida <= dias_inativa)
);
alter table public.mizloja_config enable row level security;
create index mizloja_config_atualizado_por_idx on public.mizloja_config (atualizado_por);
comment on table public.mizloja_config is 'MIZ Loja: prazos (em dias) e visibilidade de cada loja. Uma linha por loja.';

create table public.mizloja_mensagens (
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  tipo text not null check (tipo in ('aniversario', 'pos_venda')),
  texto text not null check (btrim(texto) <> '' and char_length(texto) <= 300),
  atualizado_por uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (loja_id, tipo)
);
alter table public.mizloja_mensagens enable row level security;
create index mizloja_mensagens_atualizado_por_idx on public.mizloja_mensagens (atualizado_por);
comment on table public.mizloja_mensagens is 'MIZ Loja: textos de WhatsApp. Variáveis: [NOME] (primeiro nome da cliente) e [LOJA].';

-- atualizado_por e updated_at
create or replace function public.mizloja_tg_atualizado_por()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_por := coalesce((select auth.uid()), new.atualizado_por);
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.loja_id := old.loja_id;
  end if;
  return new;
end;
$$;

create trigger mizloja_config_antes
before update on public.mizloja_config
for each row execute function public.mizloja_tg_atualizado_por();

create trigger mizloja_mensagens_antes
before update on public.mizloja_mensagens
for each row execute function public.mizloja_tg_atualizado_por();

-- Ao criar uma loja: config padrão e as duas mensagens padrão.
create or replace function public.mizloja_tg_lojas_depois_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.mizloja_config (loja_id) values (new.id)
  on conflict (loja_id) do nothing;

  insert into public.mizloja_mensagens (loja_id, tipo, texto) values
    (new.id, 'aniversario', 'Feliz aniversário, [NOME]! Hoje o dia é todo seu. Toda a equipe da [LOJA] te deseja um ano lindo. Com carinho!'),
    (new.id, 'pos_venda', 'Oi, [NOME]! Já usou sua peça nova? Me conta como ficou! Se estiver precisando de algo para compor o look, separo umas opções para você.')
  on conflict (loja_id, tipo) do nothing;
  return null;
end;
$$;

create trigger mizloja_lojas_depois_insert
after insert on public.mizloja_lojas
for each row execute function public.mizloja_tg_lojas_depois_insert();
