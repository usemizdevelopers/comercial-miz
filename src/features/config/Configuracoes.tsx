import { useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, EmptyState, Overline, PhoneField, SegmentedControl, SelectField, SkeletonCard, TextArea, TextField, useToast } from '@/components/ui'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { TrocarSenhaCard } from '@/components/shared/TrocarSenhaCard'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { UFS } from '@/features/admin-miz/api'
import { useConfigLoja, useMensagens, type ConfigLoja } from '@/hooks/useDadosLoja'
import { supabase } from '@/lib/supabase'
import { mensagemDeErro } from '@/lib/erros'
import { formatarWhatsapp, montarMensagem, normalizarWhatsapp, whatsappValido } from '@/lib/whatsapp'

/** Textos-modelo (especificação, seção 17); iguais aos que o banco grava ao criar a loja. */
const PADRAO: Record<'aniversario' | 'pos_venda', string> = {
  aniversario: 'Feliz aniversário, [NOME]! Hoje o dia é todo seu. Toda a equipe da [LOJA] te deseja um ano lindo. Com carinho!',
  pos_venda:
    'Oi, [NOME]! Já usou sua peça nova? Me conta como ficou! Se estiver precisando de algo para compor o look, separo umas opções para você.',
}
const LIMITE_MENSAGEM = 300

/** /adm/config — Configurações da loja (especificação, seção 16). Cada bloco salva sozinho. */
export default function Configuracoes() {
  const loja = useQuery({
    queryKey: ['loja', 'dados'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mizloja_lojas').select('id, nome, cidade, uf, whatsapp, cnpj').maybeSingle()
      if (error) throw error
      return data
    },
  })
  const config = useConfigLoja()
  const mensagens = useMensagens()

  const carregando = loja.isLoading || config.isLoading || mensagens.isLoading
  const erro = loja.error ?? config.error ?? mensagens.error

  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10">
      <CabecalhoPagina titulo="Configurações" subtitulo="Tudo já vem com um valor padrão. Mude só o que quiser." />
      {carregando ? (
        <>
          <SkeletonCard linhas={4} />
          <SkeletonCard linhas={4} />
        </>
      ) : erro || !loja.data || !config.data ? (
        <Card>
          <EmptyState texto={erro ? mensagemDeErro(erro) : 'Não encontramos os dados da loja.'} />
        </Card>
      ) : (
        <>
          <BlocoLoja key={loja.data.id} loja={loja.data} />
          <BlocoMensagens key={`m-${mensagens.dataUpdatedAt}`} lojaId={loja.data.id} lojaNome={loja.data.nome} atuais={mensagens.data ?? {}} />
          <BlocoPrazos key={`p-${config.dataUpdatedAt}`} config={config.data} />
          <BlocoEquipe key={`e-${config.dataUpdatedAt}`} config={config.data} />
          <BlocoConta />
        </>
      )}
    </div>
  )
}

function Bloco({ titulo, descricao, children, rodape }: { titulo: string; descricao?: string; children: ReactNode; rodape?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <Overline>{titulo}</Overline>
        {descricao && <p className="text-body-sm text-text-secondary">{descricao}</p>}
      </div>
      <Card className="flex flex-col gap-5">
        {children}
        {rodape}
      </Card>
    </section>
  )
}

function useSalvar() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const salvar = async (fn: () => Promise<void>, ok: string) => {
    setSalvando(true)
    setErro(null)
    try {
      await fn()
      toast.mostrar(ok)
      await queryClient.invalidateQueries({ queryKey: ['loja'] })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }
  return { salvando, erro, salvar }
}

function Erro({ texto }: { texto: string | null }) {
  return texto ? (
    <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
      {texto}
    </p>
  ) : null
}

/* ------------------------------------------------------------------ Loja */

function BlocoLoja({ loja }: { loja: { id: string; nome: string; cidade: string; uf: string; whatsapp: string | null; cnpj: string } }) {
  const { recarregar } = useSessao()
  const [nome, setNome] = useState(loja.nome)
  const [cidade, setCidade] = useState(loja.cidade)
  const [uf, setUf] = useState(loja.uf)
  const [whatsapp, setWhatsapp] = useState(loja.whatsapp ? formatarWhatsapp(loja.whatsapp) : '')
  const { salvando, erro, salvar } = useSalvar()
  const whatsOk = !whatsapp || whatsappValido(whatsapp)
  const pode = nome.trim().length >= 2 && cidade.trim().length >= 2 && whatsOk

  return (
    <Bloco
      titulo="Loja"
      descricao="Aparece na mensagem de aniversário ([LOJA]) e no cabeçalho do painel. O CNPJ só a Miz altera."
      rodape={
        <>
          <Erro texto={erro} />
          <Button
            className="self-start"
            disabled={!pode}
            carregando={salvando}
            onClick={() =>
              void salvar(async () => {
                const { error } = await supabase
                  .from('mizloja_lojas')
                  .update({ nome: nome.trim(), cidade: cidade.trim(), uf, whatsapp: whatsapp ? normalizarWhatsapp(whatsapp) : null })
                  .eq('id', loja.id)
                if (error) throw error
                await recarregar()
              }, 'Dados da loja salvos')
            }
          >
            Salvar loja
          </Button>
        </>
      }
    >
      <TextField rotulo="Nome da loja" value={nome} onChange={(e) => setNome(e.target.value)} />
      <div className="flex gap-3">
        <TextField rotulo="Cidade" className="flex-1" value={cidade} onChange={(e) => setCidade(e.target.value)} />
        <SelectField rotulo="UF" value={uf} onChange={(e) => setUf(e.target.value)} opcoes={UFS.map((u) => ({ valor: u, rotulo: u }))} />
      </div>
      <PhoneField rotulo="WhatsApp da loja" value={whatsapp} onChange={setWhatsapp} erro={whatsOk ? undefined : 'Digite o WhatsApp com DDD'} />
    </Bloco>
  )
}

/* ------------------------------------------------------------------ Mensagens */

function BlocoMensagens({ lojaId, lojaNome, atuais }: { lojaId: string; lojaNome: string; atuais: Record<string, string> }) {
  const [textos, setTextos] = useState<Record<'aniversario' | 'pos_venda', string>>({
    aniversario: atuais.aniversario ?? PADRAO.aniversario,
    pos_venda: atuais.pos_venda ?? PADRAO.pos_venda,
  })
  const { salvando, erro, salvar } = useSalvar()
  const exemplo = 'Ana Paula Ribeiro'

  const campo = (tipo: 'aniversario' | 'pos_venda', rotulo: string) => (
    <div className="flex flex-col gap-3">
      <TextArea
        rotulo={rotulo}
        maximo={LIMITE_MENSAGEM}
        value={textos[tipo]}
        onChange={(e) => setTextos((t) => ({ ...t, [tipo]: e.target.value }))}
        erro={textos[tipo].trim() ? undefined : 'Escreva a mensagem'}
      />
      <div className="rounded-md bg-background-muted px-4 py-3">
        <p className="text-caption text-text-tertiary">Prévia para {exemplo}</p>
        <p className="text-body-sm">{montarMensagem(textos[tipo], { nome: exemplo, loja: lojaNome })}</p>
      </div>
      {textos[tipo] !== PADRAO[tipo] && (
        <Button variante="texto" className="self-start" onClick={() => setTextos((t) => ({ ...t, [tipo]: PADRAO[tipo] }))}>
          Restaurar texto padrão
        </Button>
      )}
    </div>
  )

  return (
    <Bloco
      titulo="Mensagens do WhatsApp"
      descricao="Use [NOME] para o primeiro nome da cliente e [LOJA] para o nome da loja. Só Aniversário e Pós-venda têm mensagem pronta."
      rodape={
        <>
          <Erro texto={erro} />
          <Button
            className="self-start"
            disabled={!textos.aniversario.trim() || !textos.pos_venda.trim()}
            carregando={salvando}
            onClick={() =>
              void salvar(async () => {
                for (const tipo of ['aniversario', 'pos_venda'] as const) {
                  const { error } = await supabase.from('mizloja_mensagens').update({ texto: textos[tipo].trim() }).eq('loja_id', lojaId).eq('tipo', tipo)
                  if (error) throw error
                }
              }, 'Mensagens salvas')
            }
          >
            Salvar mensagens
          </Button>
        </>
      }
    >
      {campo('aniversario', 'Aniversário')}
      {campo('pos_venda', 'Pós-venda')}
    </Bloco>
  )
}

/* ------------------------------------------------------------------ Prazos */

type ChavePrazo =
  | 'dias_pos_venda'
  | 'dias_pos_venda_limite'
  | 'dias_comprou'
  | 'dias_recompra'
  | 'dias_sumida'
  | 'dias_inativa'
  | 'dias_followup_conversa'
  | 'dias_followup_recontato'

const PRAZOS: Array<{ chave: ChavePrazo; rotulo: string; ajuda: string }> = [
  { chave: 'dias_pos_venda', rotulo: 'Pós-venda: começa em', ajuda: 'Dias depois da compra para a cliente aparecer na pasta Pós-venda.' },
  { chave: 'dias_pos_venda_limite', rotulo: 'Pós-venda: sai em', ajuda: 'Depois disso, sem contato, ela sai da pasta Pós-venda.' },
  { chave: 'dias_comprou', rotulo: 'Comprou', ajuda: 'Dias que a cliente fica na coluna Comprou depois de uma venda.' },
  { chave: 'dias_recompra', rotulo: 'Hora da recompra', ajuda: 'Sem comprar há tantos dias, ela vai para Hora da recompra (status Esfriando).' },
  { chave: 'dias_sumida', rotulo: 'Sumidas', ajuda: 'Sem comprar há tantos dias, ela vira Sumida.' },
  { chave: 'dias_inativa', rotulo: 'Inativa', ajuda: 'Depois disso, o status vira Inativa.' },
  { chave: 'dias_followup_conversa', rotulo: 'Follow-up de conversa', ajuda: 'Cliente sem compra e sem resposta há tantos dias volta ao Follow-up.' },
  { chave: 'dias_followup_recontato', rotulo: 'Follow-up de recontato', ajuda: 'Intervalo mínimo entre um contato e outro com quem está esfriando ou sumida.' },
]

function BlocoPrazos({ config }: { config: ConfigLoja }) {
  const [v, setV] = useState<Record<ChavePrazo, string>>(() => Object.fromEntries(PRAZOS.map((p) => [p.chave, String(config[p.chave])])) as Record<ChavePrazo, string>)
  const { salvando, erro, salvar } = useSalvar()
  const n = (k: ChavePrazo) => Number(v[k])

  const problema = (() => {
    if (PRAZOS.some((p) => !/^\d+$/.test(v[p.chave]) || n(p.chave) < 1)) return 'Use números inteiros de 1 em diante.'
    if (n('dias_pos_venda') > n('dias_pos_venda_limite')) return 'O fim do Pós-venda precisa ser igual ou maior que o início.'
    if (!(n('dias_comprou') <= n('dias_recompra') && n('dias_recompra') < n('dias_sumida') && n('dias_sumida') <= n('dias_inativa')))
      return 'A ordem precisa ser: Comprou ≤ Hora da recompra < Sumidas ≤ Inativa.'
    return null
  })()

  return (
    <Bloco
      titulo="Prazos"
      descricao="Em dias. Mudam o kanban, os status e as pastas de Hoje na hora."
      rodape={
        <>
          <Erro texto={erro ?? problema} />
          <Button
            className="self-start"
            disabled={!!problema}
            carregando={salvando}
            onClick={() =>
              void salvar(async () => {
                const dados = Object.fromEntries(PRAZOS.map((p) => [p.chave, n(p.chave)])) as Record<ChavePrazo, number>
                const { error } = await supabase.from('mizloja_config').update(dados).eq('loja_id', config.loja_id)
                if (error) throw error
              }, 'Prazos salvos')
            }
          >
            Salvar prazos
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        {PRAZOS.map((p) => (
          <TextField
            key={p.chave}
            rotulo={p.rotulo}
            ajuda={p.ajuda}
            inputMode="numeric"
            sufixo="dias"
            value={v[p.chave]}
            onChange={(e) => setV((x) => ({ ...x, [p.chave]: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
          />
        ))}
      </div>
    </Bloco>
  )
}

/* ------------------------------------------------------------------ Equipe */

function BlocoEquipe({ config }: { config: ConfigLoja }) {
  const [visibilidade, setVisibilidade] = useState<'proprias' | 'todas'>(config.visibilidade_vendedora as 'proprias' | 'todas')
  const [ranking, setRanking] = useState<'sim' | 'nao'>(config.ranking_visivel ? 'sim' : 'nao')
  const { salvando, erro, salvar } = useSalvar()
  return (
    <Bloco
      titulo="Equipe"
      rodape={
        <>
          <Erro texto={erro} />
          <Button
            className="self-start"
            carregando={salvando}
            onClick={() =>
              void salvar(async () => {
                const { error } = await supabase
                  .from('mizloja_config')
                  .update({ visibilidade_vendedora: visibilidade, ranking_visivel: ranking === 'sim' })
                  .eq('loja_id', config.loja_id)
                if (error) throw error
              }, 'Equipe salva')
            }
          >
            Salvar equipe
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-secondary">O kanban e as pastas de Hoje mostram à vendedora</p>
        <SegmentedControl
          rotulo="Clientes que a vendedora vê"
          valor={visibilidade}
          onMudar={setVisibilidade}
          opcoes={[
            { valor: 'proprias', rotulo: 'Só as clientes dela' },
            { valor: 'todas', rotulo: 'Todas as clientes' },
          ]}
        />
        <p className="text-caption text-text-tertiary">A busca no Lançar venda olha sempre a base inteira da loja.</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-secondary">Ranking da equipe para as vendedoras</p>
        <SegmentedControl
          rotulo="Ranking visível"
          valor={ranking}
          onMudar={setRanking}
          opcoes={[
            { valor: 'nao', rotulo: 'Desligado' },
            { valor: 'sim', rotulo: 'Ligado' },
          ]}
        />
        <p className="text-caption text-text-tertiary">Mostra posição e nomes, nunca os valores das colegas.</p>
      </div>
    </Bloco>
  )
}

/* ------------------------------------------------------------------ Conta */

function BlocoConta() {
  const { usuaria, recarregar } = useSessao()
  const [email, setEmail] = useState(usuaria?.email ?? '')
  const { salvando, erro, salvar } = useSalvar()
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  return (
    <>
      <Bloco
        titulo="Conta"
        descricao="E-mail para recuperar a senha da dona da loja."
        rodape={
          <>
            <Erro texto={erro} />
            <Button
              className="self-start"
              disabled={!valido || email.trim().toLowerCase() === (usuaria?.email ?? '')}
              carregando={salvando}
              onClick={() =>
                void salvar(async () => {
                  if (!usuaria) return
                  const { error } = await supabase.from('mizloja_usuarias').update({ email: email.trim().toLowerCase() }).eq('id', usuaria.id)
                  if (error) throw error
                  await recarregar()
                }, 'E-mail salvo')
              }
            >
              Salvar e-mail
            </Button>
          </>
        }
      >
        <TextField rotulo="E-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Bloco>
      <TrocarSenhaCard />
    </>
  )
}
