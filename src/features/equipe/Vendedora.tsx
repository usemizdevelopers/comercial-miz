import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowsLeftRight, Key, PencilSimple, Phone, Power } from '@phosphor-icons/react'
import {
  BottomSheet,
  Button,
  Card,
  CardCliente,
  CardVenda,
  ChoiceCard,
  ConfirmSheet,
  EmptyState,
  Overline,
  PhoneField,
  ProgressBar,
  Selo,
  SkeletonCard,
  TextField,
  useToast,
} from '@/components/ui'
import { AcessoCriado } from '@/components/shared/AcessoCriado'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { FiltroPeriodo } from '@/components/shared/FiltroPeriodo'
import { buscarPainelMeta, buscarPainelVendedora, useResumo } from '@/features/dashboard/api'
import { Indicadores } from '@/features/dashboard/Indicadores'
import { buscarVendasAdm } from '@/features/vendas/admApi'
import { usePeriodo } from '@/hooks/usePeriodo'
import { supabase } from '@/lib/supabase'
import { chamarFuncao, type AcessoCriado as Acesso } from '@/lib/funcoes'
import { dataRelativa, formatarData, formatarMoeda, formatarNumero, haDias } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { hojeIso, mesIso, nomeMes } from '@/lib/periodo'
import { resumirItens, rotuloPagamento } from '@/lib/vendas'
import { formatarWhatsapp, whatsappValido } from '@/lib/whatsapp'
import { contarCarteira, renomearPessoa, transferirCarteira, usePessoas } from './api'

/** /adm/equipe/:id — desempenho individual e ações (especificação, seção 12). */
export default function Vendedora() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const pessoas = usePessoas()
  const { preset, periodo, escolherPreset, escolherDatas } = usePeriodo('mes')
  const resumo = useResumo(periodo, id)
  const extra = useQuery({ queryKey: ['painel', 'vendedora', id, periodo.inicio, periodo.fim], queryFn: () => buscarPainelVendedora(id, periodo), enabled: !!id })

  const meses = Array.from({ length: 7 }, (_, i) => mesIso(hojeIso(), -i))
  const metas = useQueries({ queries: meses.map((m) => ({ queryKey: ['painel', 'meta', m], queryFn: () => buscarPainelMeta(m) })) })

  const ultimas = useQuery({
    queryKey: ['adm', 'vendas', 'vendedora', id],
    queryFn: () => buscarVendasAdm({ periodo: { inicio: mesIso(hojeIso(), -12), fim: hojeIso() }, vendedora: id }, 5),
    enabled: !!id,
  })
  const carteira = useQuery({
    queryKey: ['clientes', 'carteira-atencao', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mizloja_v_clientes')
        .select('id, nome, status, etapa_kanban, ultima_compra_em, dias_sem_comprar')
        .eq('vendedora_id', id)
        .in('etapa_kanban', ['recompra', 'sumidas'])
        .order('dias_sem_comprar', { ascending: true })
        .limit(30)
      if (error) throw error
      return data ?? []
    },
  })

  const [acesso, setAcesso] = useState<{ dados: Acesso; titulo: string } | null>(null)
  const [renomear, setRenomear] = useState(false)
  const [trocarLogin, setTrocarLogin] = useState(false)
  const [desativar, setDesativar] = useState(false)
  const [passarCarteira, setPassarCarteira] = useState(false)
  const [reativar, setReativar] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  const p = (pessoas.data ?? []).find((x) => x.id === id)
  const atualizar = () => {
    void queryClient.invalidateQueries({ queryKey: ['loja'] })
    void queryClient.invalidateQueries({ queryKey: ['painel'] })
    void queryClient.invalidateQueries({ queryKey: ['clientes'] })
  }

  if (pessoas.isLoading) {
    return (
      <div className="mx-auto w-full max-w-conteudo px-gutter pt-6">
        <SkeletonCard linhas={4} />
      </div>
    )
  }
  if (!p) {
    return <EmptyState texto="Pessoa não encontrada." acao={<Button variante="secundario" onClick={() => navegar('/adm/equipe')}>Ver equipe</Button>} />
  }

  const ativa = p.situacao === 'ativa'
  const metaAtual = metas[0]?.data?.vendedoras.find((v) => v.usuaria_id === id)

  const novaSenha = async () => {
    setOcupado(true)
    try {
      setAcesso({ dados: await chamarFuncao('mizloja-nova-senha', { usuario_id: id }), titulo: 'Nova senha gerada' })
      atualizar()
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  const fazerReativar = async () => {
    setOcupado(true)
    try {
      await chamarFuncao('mizloja-alterar-situacao', { tipo: 'usuaria', id, situacao: 'ativa' })
      toast.mostrar(`${p.nome.split(' ')[0]} pode entrar de novo`)
      setReativar(false)
      atualizar()
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  const ext = extra.data
  return (
    <div className="mx-auto flex w-full max-w-conteudo flex-col gap-6 px-gutter pb-10">
      <CabecalhoPagina
        titulo={p.nome}
        subtitulo={`${formatarWhatsapp(p.whatsapp)} · ${p.ultimo_acesso_em ? `último acesso ${dataRelativa(p.ultimo_acesso_em)}` : 'nunca entrou'}`}
        onVoltar={() => navegar('/adm/equipe')}
        acao={ativa ? <Selo tom="contorno">Ativa</Selo> : <Selo tom="perigo">Inativa</Selo>}
      />

      <div className="flex flex-wrap gap-3">
        <Button variante="secundario" tamanho="pequeno" icone={<PencilSimple weight="light" className="h-icone w-icone" />} onClick={() => setRenomear(true)}>
          Editar nome
        </Button>
        {ativa && (
          <>
            <Button variante="secundario" tamanho="pequeno" icone={<Phone weight="light" className="h-icone w-icone" />} onClick={() => setTrocarLogin(true)}>
              Trocar WhatsApp
            </Button>
            <Button variante="secundario" tamanho="pequeno" icone={<Key weight="light" className="h-icone w-icone" />} carregando={ocupado} onClick={() => void novaSenha()}>
              Gerar nova senha
            </Button>
          </>
        )}
        <Button variante="secundario" tamanho="pequeno" icone={<ArrowsLeftRight weight="light" className="h-icone w-icone" />} onClick={() => setPassarCarteira(true)}>
          Passar clientes
        </Button>
        {ativa ? (
          <Button variante="destrutivo" tamanho="pequeno" icone={<Power weight="light" className="h-icone w-icone" />} onClick={() => setDesativar(true)}>
            Desativar
          </Button>
        ) : (
          <Button variante="secundario" tamanho="pequeno" icone={<Power weight="light" className="h-icone w-icone" />} onClick={() => setReativar(true)}>
            Reativar
          </Button>
        )}
      </div>

      <FiltroPeriodo preset={preset} periodo={periodo} onPreset={escolherPreset} onDatas={escolherDatas} />

      <Indicadores
        resumo={resumo.data}
        carregando={resumo.isLoading || extra.isLoading}
        quais={['faturamento', 'vendas', 'ticket_medio', 'clientes_novas']}
        extras={
          ext
            ? [
                { rotulo: 'Peças Miz', valor: formatarNumero(ext.pecas_miz) },
                { rotulo: 'Clientes atendidas', valor: formatarNumero(ext.clientes_atendidas) },
                { rotulo: 'Contatos de WhatsApp', valor: formatarNumero(ext.contatos) },
                {
                  rotulo: 'Conversão',
                  valor: ext.conversao === null ? '—' : `${Math.round(ext.conversao)}%`,
                  detalhe: `${ext.cadastradas_compraram} de ${ext.cadastradas} cadastradas por ela compraram`,
                },
              ]
            : []
        }
      />
      {resumo.error && <p className="text-body-sm text-danger">{mensagemDeErro(resumo.error)}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <Overline>Meta do mês</Overline>
          <Card className="flex flex-col gap-3">
            {metaAtual?.meta ? (
              <>
                <ProgressBar percentual={metaAtual.percentual ?? 0} />
                <p className="numeros text-body">
                  {formatarMoeda(metaAtual.vendido, { destaque: true })} de {formatarMoeda(metaAtual.meta, { destaque: true })}
                  {metaAtual.falta ? ` · faltam ${formatarMoeda(metaAtual.falta, { destaque: true })}` : ''}
                </p>
                {metaAtual.premio && <Selo tom={metaAtual.premio === 'conquistado' ? 'sucesso' : 'neutro'}>{metaAtual.premio === 'conquistado' ? 'Prêmio conquistado' : 'Prêmio a caminho'}</Selo>}
              </>
            ) : (
              <p className="text-body-sm text-text-secondary">
                Sem meta individual neste mês · vendeu {formatarMoeda(metaAtual?.vendido ?? 0, { destaque: true })}.
              </p>
            )}
          </Card>
          <Card semPadding>
            <ul>
              {meses.slice(1).map((m, i) => {
                const v = metas[i + 1]?.data?.vendedoras.find((x) => x.usuaria_id === id)
                return (
                  <li key={m} className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className="text-label">{nomeMes(m)}</p>
                      <p className="numeros text-body-sm text-text-secondary">
                        {formatarMoeda(v?.vendido ?? 0, { destaque: true })}
                        {v?.percentual !== null && v?.percentual !== undefined ? ` · ${Math.round(v.percentual)}% da meta` : ' · sem meta'}
                      </p>
                    </div>
                    {v?.premio === 'conquistado' && <Selo tom="sucesso">Prêmio</Selo>}
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <Overline>Últimas vendas</Overline>
          {ultimas.isLoading ? (
            <SkeletonCard linhas={2} />
          ) : (ultimas.data?.linhas ?? []).length === 0 ? (
            <p className="text-body-sm text-text-secondary">Nenhuma venda ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {(ultimas.data?.linhas ?? []).map((v) => (
                <CardVenda
                  key={v.id}
                  cliente={v.cliente_nome}
                  valor={v.valor_total}
                  itens={resumirItens(v.itens)}
                  rodape={`${formatarData(v.data_venda)} · ${rotuloPagamento(v.forma_pagamento)}`}
                  onClick={() => navegar(`/adm/vendas/${v.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <Overline>Clientes dela em Hora da recompra e Sumidas</Overline>
        {carteira.isLoading ? (
          <SkeletonCard linhas={2} />
        ) : (carteira.data ?? []).length === 0 ? (
          <p className="text-body-sm text-text-secondary">Nenhuma cliente esfriando. Boa!</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {(carteira.data ?? []).map((c) => (
              <CardCliente
                key={c.id ?? ''}
                nome={c.nome ?? ''}
                selo={<Selo tom={c.etapa_kanban === 'sumidas' ? 'contorno' : 'alerta'}>{c.etapa_kanban === 'sumidas' ? 'Sumida' : 'Hora da recompra'}</Selo>}
                linha2={c.ultima_compra_em ? `Última compra ${haDias(c.ultima_compra_em)}` : ''}
                onClick={() => navegar(`/adm/clientes/${c.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <FolhaRenomear key={p.nome} aberta={renomear} id={id} nome={p.nome} onFechar={() => setRenomear(false)} onSalvo={atualizar} />
      <FolhaTrocarLogin
        aberta={trocarLogin}
        id={id}
        onFechar={() => setTrocarLogin(false)}
        onPronto={(dados) => {
          setTrocarLogin(false)
          setAcesso({ dados, titulo: 'WhatsApp trocado' })
          atualizar()
        }}
      />
      <FolhaCarteira
        aberta={desativar || passarCarteira}
        id={id}
        nome={p.nome}
        desativar={desativar}
        onFechar={() => {
          setDesativar(false)
          setPassarCarteira(false)
        }}
        onPronto={atualizar}
      />
      <ConfirmSheet
        aberta={reativar}
        onFechar={() => setReativar(false)}
        onConfirmar={() => void fazerReativar()}
        pergunta={`Reativar ${p.nome.split(' ')[0]}?`}
        consequencia="Ela volta a entrar com o mesmo usuário e senha. As clientes que foram passadas para outra pessoa continuam com quem recebeu."
        textoConfirmar="Reativar"
        carregando={ocupado}
      />
      <BottomSheet aberta={!!acesso} onFechar={() => setAcesso(null)}>
        {acesso && (
          <div className="pt-4">
            <AcessoCriado acesso={acesso.dados} titulo={acesso.titulo} onConcluir={() => setAcesso(null)} />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function FolhaRenomear({ aberta, id, nome, onFechar, onSalvo }: { aberta: boolean; id: string; nome: string; onFechar: () => void; onSalvo: () => void }) {
  const toast = useToast()
  const [valor, setValor] = useState(nome)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const salvar = async () => {
    setSalvando(true)
    setErro(null)
    try {
      await renomearPessoa(id, valor)
      toast.mostrar('Nome atualizado')
      onSalvo()
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Editar nome">
      <div className="flex flex-col gap-5">
        <TextField rotulo="Nome" value={valor} onChange={(e) => setValor(e.target.value)} erro={erro} autoFocus />
        <Button disabled={valor.trim().length < 2} carregando={salvando} onClick={() => void salvar()}>
          Salvar
        </Button>
      </div>
    </BottomSheet>
  )
}

function FolhaTrocarLogin({ aberta, id, onFechar, onPronto }: { aberta: boolean; id: string; onFechar: () => void; onPronto: (a: Acesso) => void }) {
  const [whatsapp, setWhatsapp] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const trocar = async () => {
    setSalvando(true)
    setErro(null)
    try {
      onPronto(await chamarFuncao('mizloja-alterar-login', { usuario_id: id, whatsapp }))
      setWhatsapp('')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Trocar WhatsApp">
      <div className="flex flex-col gap-5">
        <p className="text-body-sm text-text-secondary">
          O WhatsApp é o usuário de acesso. Ao trocar, ela recebe uma senha nova e cria a dela no próximo acesso.
        </p>
        <PhoneField rotulo="Novo WhatsApp" obrigatorio value={whatsapp} onChange={setWhatsapp} erro={erro} />
        <Button disabled={!whatsappValido(whatsapp)} carregando={salvando} onClick={() => void trocar()}>
          Trocar e gerar acesso
        </Button>
      </div>
    </BottomSheet>
  )
}

/** Passar a carteira (todas as clientes) para outra pessoa; ao desativar, é obrigatório. */
function FolhaCarteira({
  aberta,
  id,
  nome,
  desativar,
  onFechar,
  onPronto,
}: {
  aberta: boolean
  id: string
  nome: string
  desativar: boolean
  onFechar: () => void
  onPronto: () => void
}) {
  const toast = useToast()
  const { data: pessoas } = usePessoas()
  const total = useQuery({ queryKey: ['clientes', 'carteira-total', id], queryFn: () => contarCarteira(id), enabled: aberta })
  const [para, setPara] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const colegas = (pessoas ?? []).filter((x) => x.situacao === 'ativa' && x.id !== id)
  const qtd = total.data ?? 0
  const primeiro = nome.split(' ')[0]

  const confirmar = async () => {
    setSalvando(true)
    setErro(null)
    try {
      let passadas = 0
      if (qtd > 0) {
        if (!para) throw new Error('Escolha quem recebe as clientes.')
        passadas = await transferirCarteira(id, para)
      }
      if (desativar) {
        await chamarFuncao('mizloja-alterar-situacao', { tipo: 'usuaria', id, situacao: 'inativa' })
        toast.mostrar(`${primeiro} foi desativada${passadas ? ` e ${passadas} clientes passaram adiante` : ''}`)
      } else {
        toast.mostrar(`${passadas} clientes passaram para ${colegas.find((c) => c.id === para)?.nome.split(' ')[0] ?? 'a colega'}`)
      }
      onPronto()
      setPara(null)
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo={desativar ? `Desativar ${primeiro}` : 'Passar clientes'} computador="lateral">
      <div className="flex flex-col gap-5">
        {desativar && (
          <p className="text-body-sm text-text-secondary">
            Ela perde o acesso na hora. Vendas e metas continuam no histórico da loja.
          </p>
        )}
        {total.isLoading ? (
          <SkeletonCard linhas={2} />
        ) : qtd === 0 ? (
          <p className="text-body">{primeiro} não tem clientes na carteira.</p>
        ) : (
          <>
            <p className="text-body">
              {qtd} {qtd === 1 ? 'cliente vai' : 'clientes vão'} para:
            </p>
            {colegas.length === 0 ? (
              <p className="text-body-sm text-danger">Não há outra pessoa ativa para receber. Crie um acesso antes.</p>
            ) : (
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Quem recebe">
                {colegas.map((c) => (
                  <ChoiceCard key={c.id} selecionado={para === c.id} onClick={() => setPara(c.id)} descricao={c.perfil === 'adm' ? 'Você (dona da loja)' : undefined}>
                    {c.nome}
                  </ChoiceCard>
                ))}
              </div>
            )}
          </>
        )}
        {erro && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erro}</p>}
        <Button
          variante={desativar ? 'destrutivo' : 'primario'}
          disabled={total.isLoading || (qtd > 0 && !para) || (!desativar && qtd === 0)}
          carregando={salvando}
          onClick={() => void confirmar()}
        >
          {desativar ? (qtd > 0 ? 'Passar clientes e desativar' : 'Desativar') : 'Passar clientes'}
        </Button>
      </div>
    </BottomSheet>
  )
}
