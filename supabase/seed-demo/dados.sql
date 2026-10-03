-- MIZ Loja · dados da Loja Demonstração (ver docs/DEMO.md)
-- Pré-requisito: a função mizloja-seed-demo (acao 'carregar') já criou a loja e as 3 contas.
-- Rodar como postgres (SQL Editor ou conector). Só grava na Loja Demonstração (CNPJ 99.999.999/0001-91).
-- Reprodutível: mesmas clientes, mesmas regras e mesmo sorteio (setseed); as datas são relativas a hoje.
--
-- Resultado esperado (prazos padrão): as 3 pastas de Hoje com clientes, as 6 colunas do kanban
-- com clientes e os 6 status presentes (nova, vip, ativa, esfriando, sumida, inativa).

do $demo$
declare
  v_loja uuid;
  v_adm uuid;
  v_v1 uuid; -- Júlia Lima
  v_v2 uuid; -- Paula Ribeiro
  v_hoje date := public.mizloja_hoje();
  v_mes_atual int := extract(month from public.mizloja_hoje())::int;
  v_dia_atual int := extract(day from public.mizloja_hoje())::int;
  c record;
  v_cli uuid;
  v_dono uuid;
  v_venda uuid;
  v_dias int;
  v_span int;
  v_gap int;
  v_k int;
  v_contador int := 0;
  v_itens int;
  v_peca record;
  v_cor record;
  v_tam text;
  v_aniv_dia int;
  v_aniv_mes int;
  v_data date;
  v_i int := 0;
  v_pagamentos text[] := array['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'crediario'];
  v_cores_outras text[] := array['Azul Bebê', 'Estampado', 'Branco', 'Vermelho', 'Bege', 'Jeans', 'Rosa Antigo'];
  v_tam_outras text[] := array['PP', 'P', 'M', 'G', 'GG', 'Unico'];
  v_meta uuid;
begin
  select id into v_loja from public.mizloja_lojas where cnpj = '99999999000191';
  if v_loja is null then
    raise exception 'Loja Demonstração não encontrada. Rode antes a função mizloja-seed-demo com acao "carregar".';
  end if;
  if exists (select 1 from public.mizloja_clientes where loja_id = v_loja) then
    raise exception 'A Loja Demonstração já tem dados. Remova (acao "remover") e carregue de novo.';
  end if;
  select id into v_adm from public.mizloja_usuarias where loja_id = v_loja and perfil = 'adm' limit 1;
  select id into v_v1 from public.mizloja_usuarias where loja_id = v_loja and usuario = '5531900001002';
  select id into v_v2 from public.mizloja_usuarias where loja_id = v_loja and usuario = '5531900001003';
  if v_adm is null or v_v1 is null or v_v2 is null then
    raise exception 'Contas da Loja Demonstração incompletas. Remova e carregue de novo pela função.';
  end if;

  perform setseed(0.42);

  -- nome, dona (1 = Júlia, 2 = Paula, 0 = ADM), compras, dias desde a última compra,
  -- dias desde o último contato, etapa manual, aniversário ('hoje', '+2' ou null = espalhado)
  for c in
    select * from (values
      -- Novas (sem compra, sem conversa)
      ('Beatriz Almeida',   1, 0, null::int, null::int, null::text, null::text),
      ('Camila Duarte',     2, 0, null, null, null, null),
      ('Larissa Moura',     1, 0, null, null, null, 'hoje'),
      ('Sofia Martins',     2, 0, null, null, null, null),
      -- Em conversa
      ('Gabriela Nunes',    1, 0, null, 3, null, null),
      ('Helena Prado',      2, 0, null, 20, null, null),
      ('Isabela Castro',    1, 0, null, 18, null, null),
      ('Juliana Freitas',   2, 0, null, 5, 'em_conversa', null),
      -- Sem interesse
      ('Renata Lopes',      1, 0, null, 40, 'sem_interesse', null),
      ('Tatiane Rocha',     2, 0, null, null, 'sem_interesse', null),
      -- Comprou (até 15 dias)
      ('Ana Paula Ribeiro', 1, 10, 2, null, null, null),
      ('Bruna Alves',       1, 4, 6, null, null, null),
      ('Carolina Mendes',   2, 3, 8, null, null, null),
      ('Daniela Costa',     2, 7, 12, 10, null, null),
      ('Eduarda Lima',      1, 2, 1, null, null, null),
      ('Fernanda Dias',     2, 8, 14, null, null, '+2'),
      -- Ativa (16 a 29 dias)
      ('Giovana Pires',     1, 6, 18, null, null, null),
      ('Heloísa Teixeira',  2, 4, 20, null, null, null),
      ('Ingrid Barros',     1, 8, 22, null, null, null),
      ('Jéssica Cardoso',   2, 2, 25, null, null, null),
      ('Kátia Ramos',       1, 4, 27, 2, null, null),
      ('Letícia Araújo',    2, 7, 17, null, null, null),
      ('Mariana Gomes',     0, 4, 24, null, null, null),
      -- Hora da recompra (30 a 59 dias)
      ('Natália Vieira',    1, 5, 34, null, null, null),
      ('Olívia Monteiro',   2, 4, 38, null, null, null),
      ('Priscila Farias',   1, 4, 45, 10, null, null),
      ('Quésia Rezende',    2, 2, 50, null, null, null),
      ('Rafaela Campos',    1, 6, 41, null, null, null),
      ('Simone Batista',    2, 3, 55, null, null, null),
      ('Talita Moreira',    1, 3, 32, null, null, null),
      ('Úrsula Siqueira',   2, 2, 58, 35, null, null),
      -- Sumidas (60 a 90 dias)
      ('Vanessa Cunha',     1, 2, 65, null, null, null),
      ('Viviane Torres',    2, 2, 72, null, null, null),
      ('Wanessa Dantas',    1, 3, 80, null, null, null),
      ('Yasmin Coelho',     2, 2, 70, 45, null, null),
      ('Zilda Fontes',      1, 1, 88, null, null, null),
      ('Alice Nogueira',    2, 2, 62, null, null, null),
      -- Inativas (mais de 90 dias)
      ('Bianca Prates',     1, 3, 95, null, null, null),
      ('Clara Antunes',     2, 2, 110, null, null, null),
      ('Débora Serra',      1, 2, 130, null, null, null)
    ) as t(nome, dona, compras, ultima, contato, etapa, aniv)
  loop
    v_i := v_i + 1;
    v_dono := case c.dona when 1 then v_v1 when 2 then v_v2 else v_adm end;

    -- aniversários: 2 nesta semana (hoje e daqui a 2 dias); os demais espalhados, fora desta semana
    if c.aniv = 'hoje' then
      v_aniv_dia := v_dia_atual; v_aniv_mes := v_mes_atual;
    elsif c.aniv = '+2' then
      v_aniv_dia := extract(day from v_hoje + 2)::int; v_aniv_mes := extract(month from v_hoje + 2)::int;
    elsif v_i % 3 = 0 then
      v_aniv_dia := 1 + (v_i * 7) % 28;
      v_aniv_mes := 1 + (v_mes_atual + 1 + v_i) % 12;
      if v_aniv_mes = v_mes_atual and abs(v_aniv_dia - v_dia_atual) <= 8 then
        v_aniv_mes := v_aniv_mes % 12 + 1;
      end if;
    else
      v_aniv_dia := null; v_aniv_mes := null;
    end if;

    insert into public.mizloja_clientes (loja_id, nome, whatsapp, vendedora_id, cadastrada_por, aniv_dia, aniv_mes, origem, created_at)
    values (v_loja, c.nome, '55319' || lpad((80000000 + v_i * 1371)::text, 8, '0'), v_dono, v_dono, v_aniv_dia, v_aniv_mes, 'loja',
            now() - make_interval(days => coalesce(c.ultima, 10) + 15 + c.compras * 9))
    returning id into v_cli;

    -- vendas: a última exatamente em "ultima" dias atrás; as anteriores espaçadas para trás
    -- (até 90 dias; inativas até 60 dias antes da última)
    if c.compras > 0 then
      v_span := case when c.ultima > 90 then c.ultima + 60 else 90 end;
      v_gap := greatest(2, (v_span - c.ultima) / greatest(c.compras, 1));
      for v_k in 0 .. c.compras - 1 loop
        v_dias := least(v_span, c.ultima + v_k * v_gap);
        v_contador := v_contador + 1;
        insert into public.mizloja_vendas (cliente_id, vendedora_id, data_venda, valor_total, forma_pagamento)
        values (
          v_cli,
          v_dono,
          ((v_hoje - v_dias)::timestamp + make_interval(hours => 10 + (random() * 8)::int, mins => (random() * 59)::int))
            at time zone 'America/Sao_Paulo',
          round((90 + random() * 810)::numeric, 0) - 0.10,
          v_pagamentos[1 + (v_contador % 5)]
        )
        returning id into v_venda;

        v_itens := 1 + (random() * 2)::int;
        for j in 1 .. v_itens loop
          if j = 1 and random() < 0.7 or j > 1 and random() < 0.4 then
            -- peça Miz real do catálogo: cor ativa e tamanho da grade da peça
            select p.id, p.nome into v_peca from public.mizloja_pecas p where p.ativa order by random() limit 1;
            select pc.id into v_cor from public.mizloja_peca_cores pc where pc.peca_id = v_peca.id and pc.ativa order by random() limit 1;
            select pt.valor into v_tam from public.mizloja_peca_tamanhos pt where pt.peca_id = v_peca.id order by random() limit 1;
            insert into public.mizloja_venda_itens (venda_id, tipo, peca_id, peca_cor_id, tamanho, quantidade)
            values (v_venda, 'miz', v_peca.id, v_cor.id, v_tam, case when random() < 0.8 then 1 else 2 end);
          else
            insert into public.mizloja_venda_itens (venda_id, tipo, cor, tamanho, quantidade)
            values (v_venda, 'outra', v_cores_outras[1 + (random() * 6)::int], v_tam_outras[1 + (random() * 5)::int], 1);
          end if;
        end loop;
      end loop;
    end if;

    -- último contato (toque no WhatsApp)
    if c.contato is not null then
      insert into public.mizloja_contatos (cliente_id, usuaria_id, pasta, created_at)
      values (v_cli, v_dono, 'follow_up', now() - make_interval(days => c.contato));
    end if;

    if c.etapa is not null then
      update public.mizloja_clientes set etapa_manual = c.etapa where id = v_cli;
    end if;

    -- uma transferência: Alice passa da Paula para a Júlia, com recado (vai para o Follow-up da Júlia)
    if c.nome = 'Alice Nogueira' then
      update public.mizloja_clientes
         set vendedora_id = v_v1, recado_transferencia = 'Ela pediu o blazer em caqui. Chega dia 15.'
       where id = v_cli;
      insert into public.mizloja_transferencias (loja_id, cliente_id, de_usuaria_id, para_usuaria_id, motivo, recado, criado_por, created_at)
      values (v_loja, v_cli, v_v2, v_v1, 'manual', 'Ela pediu o blazer em caqui. Chega dia 15.', v_v2, now() - interval '2 days');
    end if;
  end loop;

  -- Meta do mês atual, publicada, com metas individuais e prêmio
  insert into public.mizloja_metas (loja_id, mes, valor_loja, status, premio_descricao, premio_condicao_pct, premio_extra_descricao, premio_extra_pct, criado_por)
  values (v_loja, date_trunc('month', v_hoje)::date, 30000, 'publicada', 'R$ 200 em compras na loja', 100, 'Folga no sábado', 120, v_adm)
  returning id into v_meta;
  insert into public.mizloja_metas_vendedoras (meta_id, usuaria_id, valor, premio_elegivel) values
    (v_meta, v_v1, 12000, true),
    (v_meta, v_v2, 10000, true);

  raise notice 'Loja Demonstração carregada: 40 clientes, % vendas.', v_contador;
end
$demo$;
