import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { CaretRight, Plus, UsersThree } from '@phosphor-icons/react'
import { BottomSheet, Button, Card, EmptyState, PhoneField, ProgressBar, Selo, TextField } from '@/components/ui'
import { AcessoCriado } from '@/components/shared/AcessoCriado'
import { CabecalhoPagina } from '@/components/shared/CabecalhoPagina'
import { ListaCarregando } from '@/components/shared/EstadoCarregando'
import { usePainelMeta } from '@/features/dashboard/api'
import { chamarFuncao, type AcessoCriado as Acesso } from '@/lib/funcoes'
import { dataRelativa, formatarMoeda } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { whatsappValido } from '@/lib/whatsapp'
import { usePessoas } from './api'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Digite o nome'),
  whatsapp: z.string().refine(whatsappValido, 'Digite o WhatsApp com DDD'),
})

/** /adm/equipe — vendedoras da loja (especificação, seção 12). */
export default function Equipe() {
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const pessoas = usePessoas()
  const meta = usePainelMeta()
  const [nova, setNova] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [acesso, setAcesso] = useState<Acesso | null>(null)

  const form = useForm<z.infer<typeof esquema>>({ resolver: zodResolver(esquema), defaultValues: { nome: '', whatsapp: '' } })

  const criar = form.handleSubmit(async (d) => {
    setErro(null)
    try {
      const r = await chamarFuncao('mizloja-criar-usuaria', { nome: d.nome, whatsapp: d.whatsapp })
      setNova(false)
      form.reset()
      setAcesso(r)
      void queryClient.invalidateQueries({ queryKey: ['loja'] })
      void queryClient.invalidateQueries({ queryKey: ['painel'] })
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  })

  const vendedoras = (pessoas.data ?? []).filter((p) => p.perfil === 'vendedora')
  const ativas = vendedoras.filter((p) => p.situacao === 'ativa')
  const inativas = vendedoras.filter((p) => p.situacao !== 'ativa')
  const numeros = new Map((meta.data?.vendedoras ?? []).map((v) => [v.usuaria_id, v]))

  const linha = (p: (typeof vendedoras)[number]) => {
    const n = numeros.get(p.id)
    return (
      <li key={p.id}>
        <Card tocavel className="flex items-center gap-4" onClick={() => navegar(`/adm/equipe/${p.id}`)} role="link" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navegar(`/adm/equipe/${p.id}`)}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="truncate text-h3">{p.nome}</p>
              {p.situacao !== 'ativa' && <Selo tom="contorno">Inativa</Selo>}
              {p.situacao === 'ativa' && p.precisa_trocar_senha && <Selo>Ainda não entrou</Selo>}
            </div>
            <p className="numeros text-body-sm text-text-secondary">
              {formatarMoeda(n?.vendido ?? 0, { destaque: true })} no mês · {n?.vendas ?? 0} {n?.vendas === 1 ? 'venda' : 'vendas'}
              {n?.percentual !== null && n?.percentual !== undefined ? ` · ${Math.round(n.percentual)}% da meta` : ''}
            </p>
            {n?.meta ? <ProgressBar percentual={n.percentual ?? 0} rotulo={`Meta de ${p.nome}`} /> : null}
            <p className="text-caption text-text-tertiary">
              {p.ultimo_acesso_em ? `Último acesso ${dataRelativa(p.ultimo_acesso_em)}` : 'Nunca entrou'}
            </p>
          </div>
          <CaretRight weight="light" className="h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
        </Card>
      </li>
    )
  }

  return (
    <div className="mx-auto w-full max-w-form px-gutter pb-10">
      <CabecalhoPagina
        titulo="Equipe"
        subtitulo="Quem vende na loja e como está no mês"
        acao={
          <Button icone={<Plus weight="light" className="h-icone w-icone" />} onClick={() => setNova(true)}>
            Vendedora
          </Button>
        }
      />

      {pessoas.isLoading ? (
        <ListaCarregando />
      ) : pessoas.error ? (
        <Card>
          <EmptyState texto={mensagemDeErro(pessoas.error)} acao={<Button variante="secundario" onClick={() => void pessoas.refetch()}>Tentar de novo</Button>} />
        </Card>
      ) : vendedoras.length === 0 ? (
        <Card>
          <EmptyState
            icone={<UsersThree weight="light" />}
            texto="Nenhuma vendedora ainda. Crie o acesso e envie pelo WhatsApp."
            acao={<Button onClick={() => setNova(true)}>Criar acesso</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-3">{ativas.map(linha)}</ul>
          {inativas.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-overline uppercase text-text-secondary">Inativas</h2>
              <ul className="flex flex-col gap-3">{inativas.map(linha)}</ul>
            </section>
          )}
        </div>
      )}

      <BottomSheet aberta={nova} onFechar={() => setNova(false)} titulo="Nova vendedora" computador="lateral">
        <form onSubmit={criar} noValidate className="flex flex-col gap-5">
          <TextField rotulo="Nome" obrigatorio autoFocus erro={form.formState.errors.nome?.message} {...form.register('nome')} />
          <Controller
            name="whatsapp"
            control={form.control}
            render={({ field }) => (
              <PhoneField
                rotulo="WhatsApp"
                obrigatorio
                ajuda={form.formState.errors.whatsapp ? undefined : 'Vira o usuário de acesso dela'}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                erro={form.formState.errors.whatsapp?.message}
              />
            )}
          />
          {erro && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erro}</p>}
          <Button type="submit" carregando={form.formState.isSubmitting}>
            Criar acesso
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet aberta={!!acesso} onFechar={() => setAcesso(null)}>
        {acesso && (
          <div className="pt-4">
            <AcessoCriado acesso={acesso} onConcluir={() => setAcesso(null)} />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
