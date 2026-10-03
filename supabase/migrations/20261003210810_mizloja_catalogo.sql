-- MIZ Loja · catálogo próprio de peças Miz
-- Independente do app MIZ: sem chave estrangeira para public.pecas.
-- A carga inicial é uma CÓPIA (só leitura) do catálogo atual do app MIZ;
-- origem_id guarda o id de lá apenas como referência para futuras sincronizações.

create table public.mizloja_pecas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (btrim(nome) <> ''),
  codigo_referencia text not null unique check (btrim(codigo_referencia) <> ''),
  categoria text,
  ativa boolean not null default true,
  esgotado boolean not null default false,
  origem_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mizloja_pecas enable row level security;
comment on table public.mizloja_pecas is 'MIZ Loja: catálogo de peças Miz (cópia própria). origem_id = id da peça no app MIZ, sem vínculo.';

create table public.mizloja_peca_cores (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.mizloja_pecas(id) on delete cascade,
  nome text not null check (btrim(nome) <> ''),
  valor text not null check (valor ~* '^#[0-9a-f]{6}$'),
  ordem integer not null default 0,
  origem_id uuid unique,
  created_at timestamptz not null default now()
);
alter table public.mizloja_peca_cores enable row level security;
create index mizloja_peca_cores_peca_idx on public.mizloja_peca_cores (peca_id, ordem);
comment on table public.mizloja_peca_cores is 'MIZ Loja: cores de cada peça. valor = hex da bolinha.';

create table public.mizloja_peca_tamanhos (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.mizloja_pecas(id) on delete cascade,
  valor text not null check (valor in ('PP', 'P', 'M', 'G', 'GG', 'PP/P', 'M/G', 'Unico')),
  ordem integer not null default 0,
  unique (peca_id, valor)
);
alter table public.mizloja_peca_tamanhos enable row level security;
comment on table public.mizloja_peca_tamanhos is 'MIZ Loja: grade de tamanhos de cada peça.';

create table public.mizloja_peca_imagens (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.mizloja_pecas(id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.mizloja_peca_imagens enable row level security;
create index mizloja_peca_imagens_peca_idx on public.mizloja_peca_imagens (peca_id, ordem);
comment on table public.mizloja_peca_imagens is 'MIZ Loja: fotos de cada peça.';

create trigger mizloja_pecas_updated_at
before update on public.mizloja_pecas
for each row execute function public.mizloja_tg_updated_at();

-- ---------------------------------------------------------------------------
-- Carga inicial (somente leitura do catálogo do app MIZ)
-- Nomes de cor padronizados: "OFF-WHITE", "Off White" e "OFF WHITE" viram "Off White".
-- ---------------------------------------------------------------------------
insert into public.mizloja_pecas (nome, codigo_referencia, categoria, ativa, esgotado, origem_id, created_at)
select btrim(p.nome), upper(btrim(p.codigo_referencia)), p.categoria, p.ativa, p.esgotado, p.id, p.created_at
from public.pecas p;

insert into public.mizloja_peca_cores (peca_id, nome, valor, ordem, origem_id)
select mp.id,
       initcap(btrim(regexp_replace(replace(c.nome, '-', ' '), '\s+', ' ', 'g'))),
       lower(c.valor),
       c.ordem,
       c.id
from public.peca_cores c
join public.mizloja_pecas mp on mp.origem_id = c.peca_id
where c.valor ~* '^#[0-9a-f]{6}$';

insert into public.mizloja_peca_tamanhos (peca_id, valor, ordem)
select mp.id, upper(btrim(t.valor)), t.ordem
from public.peca_tamanhos t
join public.mizloja_pecas mp on mp.origem_id = t.peca_id
on conflict (peca_id, valor) do nothing;

insert into public.mizloja_peca_imagens (peca_id, url, ordem, created_at)
select mp.id, i.url, i.ordem, i.created_at
from public.peca_imagens i
join public.mizloja_pecas mp on mp.origem_id = i.peca_id;
