-- MIZ Loja · contatos (toques no WhatsApp), "Pular hoje", transferências e registro de alterações

create table public.mizloja_contatos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  cliente_id uuid not null references public.mizloja_clientes(id) on delete cascade,
  usuaria_id uuid references public.mizloja_usuarias(id) on delete set null default auth.uid(),
  pasta text check (pasta in ('follow_up', 'pos_venda', 'aniversario')),
  created_at timestamptz not null default now()
);
alter table public.mizloja_contatos enable row level security;
create index mizloja_contatos_cliente_idx on public.mizloja_contatos (cliente_id, created_at desc);
create index mizloja_contatos_loja_idx on public.mizloja_contatos (loja_id, created_at desc);
create index mizloja_contatos_usuaria_idx on public.mizloja_contatos (usuaria_id);
comment on table public.mizloja_contatos is 'MIZ Loja: cada toque no botão WhatsApp. pasta nula = aberto fora das pastas.';

create table public.mizloja_pulos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  cliente_id uuid not null references public.mizloja_clientes(id) on delete cascade,
  usuaria_id uuid not null references public.mizloja_usuarias(id) on delete cascade default auth.uid(),
  data date not null default public.mizloja_hoje(),
  created_at timestamptz not null default now(),
  constraint mizloja_pulos_uk unique (cliente_id, usuaria_id, data)
);
alter table public.mizloja_pulos enable row level security;
create index mizloja_pulos_loja_idx on public.mizloja_pulos (loja_id);
create index mizloja_pulos_usuaria_idx on public.mizloja_pulos (usuaria_id, data);
comment on table public.mizloja_pulos is 'MIZ Loja: "Pular hoje" — tira a cliente das pastas da usuária naquele dia.';

create table public.mizloja_transferencias (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  cliente_id uuid not null references public.mizloja_clientes(id) on delete cascade,
  de_usuaria_id uuid references public.mizloja_usuarias(id) on delete set null,
  para_usuaria_id uuid not null references public.mizloja_usuarias(id) on delete cascade,
  motivo text not null check (motivo in ('venda', 'manual', 'desativacao', 'adm')),
  recado text,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.mizloja_transferencias enable row level security;
create index mizloja_transferencias_cliente_idx on public.mizloja_transferencias (cliente_id, created_at desc);
create index mizloja_transferencias_loja_idx on public.mizloja_transferencias (loja_id, created_at desc);
create index mizloja_transferencias_de_idx on public.mizloja_transferencias (de_usuaria_id);
create index mizloja_transferencias_para_idx on public.mizloja_transferencias (para_usuaria_id);
create index mizloja_transferencias_criado_por_idx on public.mizloja_transferencias (criado_por);
comment on table public.mizloja_transferencias is 'MIZ Loja: histórico de troca de responsável pela cliente. Escrita só pelas funções.';

create table public.mizloja_alteracoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.mizloja_lojas(id) on delete cascade,
  venda_id uuid not null references public.mizloja_vendas(id) on delete cascade,
  usuaria_id uuid references auth.users(id) on delete set null,
  acao text not null check (acao in ('edicao', 'exclusao')),
  antes jsonb,
  depois jsonb,
  motivo text,
  created_at timestamptz not null default now()
);
alter table public.mizloja_alteracoes enable row level security;
create index mizloja_alteracoes_venda_idx on public.mizloja_alteracoes (venda_id, created_at desc);
create index mizloja_alteracoes_loja_idx on public.mizloja_alteracoes (loja_id, created_at desc);
create index mizloja_alteracoes_usuaria_idx on public.mizloja_alteracoes (usuaria_id);
comment on table public.mizloja_alteracoes is 'MIZ Loja: registro de edições e exclusões de vendas (e de seus itens). Escrita só por gatilho.';

-- ---------------------------------------------------------------------------
-- Contatos e pulos: loja vem da cliente; quem registra é a usuária logada
-- ---------------------------------------------------------------------------
create or replace function public.mizloja_tg_toque_antes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select c.loja_id into new.loja_id from public.mizloja_clientes c where c.id = new.cliente_id;
  if new.loja_id is null then
    raise exception 'Cliente não encontrada.' using errcode = '23503';
  end if;
  if not public.mizloja_eh_interno() then
    new.usuaria_id := (select auth.uid());
    new.created_at := now();
    if tg_table_name = 'mizloja_pulos' then
      new.data := public.mizloja_hoje();
    end if;
  end if;
  return new;
end;
$$;

create trigger mizloja_contatos_antes
before insert on public.mizloja_contatos
for each row execute function public.mizloja_tg_toque_antes();

create trigger mizloja_pulos_antes
before insert on public.mizloja_pulos
for each row execute function public.mizloja_tg_toque_antes();

-- Depois do contato: atualiza a cliente e, se ainda não comprou, passa para "em conversa".
create or replace function public.mizloja_tg_contatos_depois()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mizloja_clientes c
     set ultimo_contato_em = new.created_at,
         ultimo_contato_por = new.usuaria_id,
         etapa_manual = case
                          when c.num_compras = 0 and (c.etapa_manual is null or c.etapa_manual = 'novas')
                          then 'em_conversa'
                          else c.etapa_manual
                        end
   where c.id = new.cliente_id
     and (c.ultimo_contato_em is null or c.ultimo_contato_em <= new.created_at);
  return null;
end;
$$;

create trigger mizloja_contatos_depois
after insert on public.mizloja_contatos
for each row execute function public.mizloja_tg_contatos_depois();
