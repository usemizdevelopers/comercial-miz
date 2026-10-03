import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Key, Power } from '@phosphor-icons/react'
import { BottomSheet, Button, Card, ConfirmSheet, EmptyState, Overline, PhoneField, SelectField, Selo, TextField, useToast } from '@/components/ui'
import { AcessoCriado } from '@/components/shared/AcessoCriado'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { ListaCarregando } from '@/components/shared/EstadoCarregando'
import { chamarFuncao, type AcessoCriado as Acesso } from '@/lib/funcoes'
import { mascararCnpj } from '@/lib/cnpj'
import { dataRelativa, formatarData } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { formatarWhatsapp, mascararWhatsapp, normalizarWhatsapp, whatsappValido } from '@/lib/whatsapp'
import { atualizarLoja, buscarLoja, UFS, type Usuaria } from './api'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Digite o nome da loja'),
  cidade: z.string().trim().min(2, 'Digite a cidade'),
  uf: z.string().refine((v) => UFS.includes(v), 'Escolha a UF'),
  whatsapp: z.string().refine((v) => v.trim() === '' || whatsappValido(v), 'Digite o WhatsApp com DDD'),
})
type Dados = z.infer<typeof esquema>

const esquemaDona = z.object({
  nome: z.string().trim().min(2, 'Digite o nome da dona'),
  whatsapp: z.string().refine(whatsappValido, 'Digite o WhatsApp com DDD'),
})

/**
 * /miz/lojas/:id — dados da loja (CNPJ não muda), situação, dona (nova senha) e usuárias.
 * A Admin Miz NÃO vê clientes, vendas nem metas das lojas.
 */
export default function LojaDetalhe() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['miz', 'loja', id], queryFn: () => buscarLoja(id) })

  const [acesso, setAcesso] = useState<Acesso | null>(null)
  const [confirmarSituacao, setConfirmarSituacao] = useState(false)
  const [mudandoSituacao, setMudandoSituacao] = useState(false)
  const [gerandoSenha, setGerandoSenha] = useState(false)
  const [novaDona, setNovaDona] = useState(false)
  const [erroDona, setErroDona] = useState<string | null>(null)

  const form = useForm<Dados>({ resolver: zodResolver(esquema), defaultValues: { nome: '', cidade: '', uf: '', whatsapp: '' } })
  const formDona = useForm<z.infer<typeof esquemaDona>>({ resolver: zodResolver(esquemaDona), defaultValues: { nome: '', whatsapp: '' } })

  useEffect(() => {
    if (data) {
      form.reset({ nome: data.loja.nome, cidade: data.loja.cidade, uf: data.loja.uf, whatsapp: mascararWhatsapp(data.loja.whatsapp ?? '') })
    }
  }, [data, form])

  const recarregar = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: ['miz', 'loja', id] }), queryClient.invalidateQueries({ queryKey: ['miz', 'lojas'] })])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-form px-gutter pt-8">
        <ListaCarregando />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-form px-gutter pt-8">
        <Card>
          <EmptyState texto={error ? mensagemDeErro(error) : 'Loja não encontrada.'} acao={<Button variante="secundario" onClick={() => navegar('/miz/lojas')}>Voltar às lojas</Button>} />
        </Card>
      </div>
    )
  }

  const { loja, usuarias } = data
  const dona: Usuaria | undefined = usuarias.find((u) => u.perfil === 'adm' && u.situacao === 'ativa') ?? usuarias.find((u) => u.perfil === 'adm')
  const ativa = loja.situacao === 'ativa'

  const salvar = form.handleSubmit(async (d) => {
    try {
      await atualizarLoja(loja.id, { nome: d.nome, cidade: d.cidade, uf: d.uf, whatsapp: d.whatsapp ? normalizarWhatsapp(d.whatsapp) : null })
      await recarregar()
      toast.mostrar('Loja atualizada')
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    }
  })

  const alterarSituacao = async () => {
    setMudandoSituacao(true)
    try {
      await chamarFuncao('mizloja-alterar-situacao', { tipo: 'loja', id: loja.id, situacao: ativa ? 'inativa' : 'ativa' })
      await recarregar()
      toast.mostrar(ativa ? 'Loja desativada' : 'Loja reativada')
      setConfirmarSituacao(false)
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setMudandoSituacao(false)
    }
  }

  const gerarNovaSenha = async () => {
    if (!dona) return
    setGerandoSenha(true)
    try {
      setAcesso(await chamarFuncao('mizloja-nova-senha', { usuario_id: dona.id }))
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setGerandoSenha(false)
    }
  }

  const criarDona = formDona.handleSubmit(async (d) => {
    setErroDona(null)
    try {
      const r = await chamarFuncao('mizloja-criar-usuaria', { loja_id: loja.id, perfil: 'adm', nome: d.nome, whatsapp: d.whatsapp })
      setNovaDona(false)
      formDona.reset()
      setAcesso(r)
      await recarregar()
    } catch (e) {
      setErroDona(mensagemDeErro(e))
    }
  })

  return (
    <div className="mx-auto w-full max-w-form px-gutter">
      <CabecalhoPagina
        titulo={loja.nome}
        subtitulo={`${mascararCnpj(loja.cnpj)} · desde ${formatarData(loja.created_at)}`}
        onVoltar={() => navegar('/miz/lojas')}
        acao={ativa ? <Selo tom="contorno">Ativa</Selo> : <Selo tom="perigo">Inativa</Selo>}
      />

      <div className="flex flex-col gap-6 pb-10">
        {/* Dados da loja */}
        <Card>
          <form onSubmit={salvar} noValidate className="flex flex-col gap-5">
            <Overline>Dados da loja</Overline>
            <TextField rotulo="Nome da loja" obrigatorio erro={form.formState.errors.nome?.message} {...form.register('nome')} />
            <TextField rotulo="CNPJ" value={mascararCnpj(loja.cnpj)} disabled ajuda="O CNPJ não muda depois de criado" readOnly />
            <div className="grid grid-cols-3 gap-3">
              <TextField className="col-span-2" rotulo="Cidade" obrigatorio erro={form.formState.errors.cidade?.message} {...form.register('cidade')} />
              <SelectField rotulo="UF" obrigatorio opcoes={UFS.map((u) => ({ valor: u, rotulo: u }))} erro={form.formState.errors.uf?.message} {...form.register('uf')} />
            </div>
            <Controller
              name="whatsapp"
              control={form.control}
              render={({ field }) => <PhoneField rotulo="WhatsApp da loja" value={field.value} onChange={field.onChange} onBlur={field.onBlur} erro={form.formState.errors.whatsapp?.message} />}
            />
            <div className="flex justify-end">
              <Button type="submit" variante="secundario" carregando={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
                Salvar dados
              </Button>
            </div>
          </form>
        </Card>

        {/* Dona */}
        <Card className="flex flex-col gap-4">
          <Overline>Dona (ADM)</Overline>
          {dona ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-h3">{dona.nome}</p>
                  <p className="text-body-sm text-text-secondary">
                    {formatarWhatsapp(dona.whatsapp)} · {dona.ultimo_acesso_em ? `último acesso ${dataRelativa(dona.ultimo_acesso_em)}` : 'ainda não entrou'}
                  </p>
                </div>
                {dona.situacao === 'ativa' ? <Selo tom="contorno">Ativa</Selo> : <Selo tom="perigo">Inativa</Selo>}
              </div>
              <Button variante="secundario" icone={<Key weight="light" className="h-icone w-icone" />} carregando={gerandoSenha} onClick={() => void gerarNovaSenha()} disabled={!ativa || dona.situacao !== 'ativa'}>
                Gerar nova senha e enviar
              </Button>
            </>
          ) : (
            <>
              <p className="text-body-sm text-text-secondary">Esta loja está sem dona ativa.</p>
              <Button variante="secundario" onClick={() => setNovaDona(true)} disabled={!ativa}>
                Criar acesso da dona
              </Button>
            </>
          )}
        </Card>

        {/* Usuárias */}
        <Card className="flex flex-col gap-2">
          <Overline>Usuárias da loja</Overline>
          {usuarias.length === 0 ? (
            <p className="text-body-sm text-text-secondary">Nenhuma usuária.</p>
          ) : (
            <ul>
              {usuarias.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 border-b border-border-subtle py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-label">{u.nome}</p>
                    <p className="text-caption text-text-tertiary">
                      {u.perfil === 'adm' ? 'Dona (ADM)' : 'Vendedora'} · {u.ultimo_acesso_em ? `último acesso ${dataRelativa(u.ultimo_acesso_em)}` : 'ainda não entrou'}
                    </p>
                  </div>
                  {u.situacao === 'ativa' ? <Selo tom="contorno">Ativa</Selo> : <Selo tom="perigo">Inativa</Selo>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Situação */}
        <Card className="flex flex-col gap-3">
          <Overline>Situação da loja</Overline>
          <p className="text-body-sm text-text-secondary">
            {ativa ? 'Desativar bloqueia o acesso de todas as usuárias da loja. Os dados ficam guardados.' : 'A loja está desativada. Reativar devolve o acesso de quem continua ativa.'}
          </p>
          <Button
            variante={ativa ? 'destrutivo' : 'secundario'}
            icone={<Power weight="light" className="h-icone w-icone" />}
            onClick={() => setConfirmarSituacao(true)}
          >
            {ativa ? 'Desativar loja' : 'Reativar loja'}
          </Button>
        </Card>
      </div>

      <ConfirmSheet
        aberta={confirmarSituacao}
        onFechar={() => setConfirmarSituacao(false)}
        onConfirmar={() => void alterarSituacao()}
        pergunta={ativa ? `Desativar a ${loja.nome}?` : `Reativar a ${loja.nome}?`}
        consequencia={ativa ? `Ninguém da loja consegue entrar até reativar. ${usuarias.filter((u) => u.situacao === 'ativa').length} acessos ficam bloqueados.` : 'As usuárias ativas voltam a entrar.'}
        textoConfirmar={ativa ? 'Desativar' : 'Reativar'}
        destrutivo={ativa}
        carregando={mudandoSituacao}
      />

      <BottomSheet aberta={!!acesso} onFechar={() => setAcesso(null)}>
        {acesso && (
          <div className="pt-4">
            <AcessoCriado acesso={acesso} titulo={dona && acesso.usuario === dona.usuario ? 'Nova senha gerada' : 'Acesso criado'} onConcluir={() => setAcesso(null)} />
          </div>
        )}
      </BottomSheet>

      <BottomSheet aberta={novaDona} onFechar={() => setNovaDona(false)} titulo="Acesso da dona" computador="lateral">
        <form onSubmit={criarDona} noValidate className="flex flex-col gap-5">
          <TextField rotulo="Nome da dona" obrigatorio erro={formDona.formState.errors.nome?.message} {...formDona.register('nome')} />
          <Controller
            name="whatsapp"
            control={formDona.control}
            render={({ field }) => (
              <PhoneField rotulo="WhatsApp da dona" obrigatorio value={field.value} onChange={field.onChange} onBlur={field.onBlur} erro={formDona.formState.errors.whatsapp?.message} />
            )}
          />
          {erroDona && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erroDona}</p>}
          <Button type="submit" carregando={formDona.formState.isSubmitting}>
            Criar acesso
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
