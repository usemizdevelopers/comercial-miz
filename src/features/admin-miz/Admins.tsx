import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Key, Plus, Power, ShieldCheck } from '@phosphor-icons/react'
import { BottomSheet, Button, Card, ConfirmSheet, EmptyState, PhoneField, Selo, TextField, useToast } from '@/components/ui'
import { AcessoCriado } from '@/components/shared/AcessoCriado'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { ListaCarregando } from '@/components/shared/EstadoCarregando'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { chamarFuncao, type AcessoCriado as Acesso } from '@/lib/funcoes'
import { dataRelativa } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { formatarWhatsapp, whatsappValido } from '@/lib/whatsapp'
import { listarAdmins, type AdminMiz } from './api'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Digite o nome'),
  whatsapp: z.string().refine(whatsappValido, 'Digite o WhatsApp com DDD'),
})

/**
 * /miz/admins — time Miz com acesso ao painel. O WhatsApp é o login e não se edita:
 * trocar de número = criar um admin novo e desativar o antigo.
 */
export default function Admins() {
  const { usuaria } = useSessao()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['miz', 'admins'], queryFn: listarAdmins })

  const [novo, setNovo] = useState(false)
  const [erroNovo, setErroNovo] = useState<string | null>(null)
  const [acesso, setAcesso] = useState<{ dados: Acesso; titulo: string } | null>(null)
  const [alvoSituacao, setAlvoSituacao] = useState<AdminMiz | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const form = useForm<z.infer<typeof esquema>>({ resolver: zodResolver(esquema), defaultValues: { nome: '', whatsapp: '' } })

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['miz', 'admins'] })

  const criar = form.handleSubmit(async (d) => {
    setErroNovo(null)
    try {
      const r = await chamarFuncao('mizloja-criar-admin', { nome: d.nome, whatsapp: d.whatsapp })
      setNovo(false)
      form.reset()
      setAcesso({ dados: r, titulo: 'Admin criado' })
      await recarregar()
    } catch (e) {
      setErroNovo(mensagemDeErro(e))
    }
  })

  const novaSenha = async (a: AdminMiz) => {
    setOcupado(a.id)
    try {
      setAcesso({ dados: await chamarFuncao('mizloja-nova-senha', { usuario_id: a.id }), titulo: 'Nova senha gerada' })
      await recarregar()
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setOcupado(null)
    }
  }

  const alterarSituacao = async () => {
    if (!alvoSituacao) return
    setOcupado(alvoSituacao.id)
    try {
      await chamarFuncao('mizloja-alterar-situacao', { tipo: 'admin', id: alvoSituacao.id, situacao: alvoSituacao.ativo ? 'inativa' : 'ativa' })
      toast.mostrar(alvoSituacao.ativo ? 'Admin desativado' : 'Admin reativado')
      setAlvoSituacao(null)
      await recarregar()
    } catch (e) {
      toast.mostrar(mensagemDeErro(e))
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-form px-gutter">
      <CabecalhoPagina
        titulo="Admins Miz"
        subtitulo="Quem do time Miz acessa este painel"
        acao={
          <Button icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => setNovo(true)}>
            Admin
          </Button>
        }
      />

      {isLoading ? (
        <ListaCarregando />
      ) : error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(error)} acao={<Button variante="secundario" onClick={() => void refetch()}>Tentar de novo</Button>} />
        </Card>
      ) : (data ?? []).length === 0 ? (
        <Card>
          <EmptyState icone={<ShieldCheck weight="light" />} texto="Nenhum admin." />
        </Card>
      ) : (
        <div className="flex flex-col gap-3 pb-10">
          {(data ?? []).map((a) => {
            const souEu = a.id === usuaria?.id
            return (
              <Card key={a.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-h3">
                      {a.nome}
                      {souEu && <span className="text-body-sm font-regular text-text-secondary"> (você)</span>}
                    </p>
                    <p className="text-body-sm text-text-secondary">
                      {a.whatsapp ? formatarWhatsapp(a.whatsapp) : 'sem WhatsApp'} ·{' '}
                      {a.ultimo_acesso_em ? `último acesso ${dataRelativa(a.ultimo_acesso_em)}` : 'ainda não entrou'}
                    </p>
                  </div>
                  {a.ativo ? <Selo tom="contorno">Ativo</Selo> : <Selo tom="perigo">Inativo</Selo>}
                </div>
                {!souEu && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variante="secundario"
                      tamanho="pequeno"
                      icone={<Key weight="light" className="h-icone w-icone" />}
                      disabled={!a.ativo || !a.usuario}
                      carregando={ocupado === a.id && !alvoSituacao}
                      onClick={() => void novaSenha(a)}
                    >
                      Gerar nova senha
                    </Button>
                    <Button
                      variante={a.ativo ? 'destrutivo' : 'secundario'}
                      tamanho="pequeno"
                      icone={<Power weight="light" className="h-icone w-icone" />}
                      onClick={() => setAlvoSituacao(a)}
                    >
                      {a.ativo ? 'Desativar' : 'Reativar'}
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
          <p className="text-caption text-text-tertiary">O WhatsApp é o usuário de acesso e não muda. Para trocar de número, crie um admin novo e desative o antigo.</p>
        </div>
      )}

      <BottomSheet aberta={novo} onFechar={() => setNovo(false)} titulo="Novo admin" computador="lateral">
        <form onSubmit={criar} noValidate className="flex flex-col gap-5">
          <TextField rotulo="Nome" obrigatorio erro={form.formState.errors.nome?.message} {...form.register('nome')} />
          <Controller
            name="whatsapp"
            control={form.control}
            render={({ field }) => (
              <PhoneField
                rotulo="WhatsApp"
                obrigatorio
                ajuda={form.formState.errors.whatsapp ? undefined : 'Vira o usuário de acesso e não pode ser alterado depois'}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                erro={form.formState.errors.whatsapp?.message}
              />
            )}
          />
          {erroNovo && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erroNovo}</p>}
          <Button type="submit" carregando={form.formState.isSubmitting}>
            Criar admin
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet aberta={!!acesso} onFechar={() => setAcesso(null)}>
        {acesso && (
          <div className="pt-4">
            <AcessoCriado acesso={acesso.dados} titulo={acesso.titulo} onConcluir={() => setAcesso(null)} />
          </div>
        )}
      </BottomSheet>

      <ConfirmSheet
        aberta={!!alvoSituacao}
        onFechar={() => setAlvoSituacao(null)}
        onConfirmar={() => void alterarSituacao()}
        pergunta={alvoSituacao?.ativo ? `Desativar ${alvoSituacao.nome}?` : `Reativar ${alvoSituacao?.nome ?? ''}?`}
        consequencia={alvoSituacao?.ativo ? 'O acesso ao painel é bloqueado na hora.' : 'O acesso ao painel volta a funcionar.'}
        textoConfirmar={alvoSituacao?.ativo ? 'Desativar' : 'Reativar'}
        destrutivo={!!alvoSituacao?.ativo}
        carregando={!!ocupado && !!alvoSituacao}
      />
    </div>
  )
}
