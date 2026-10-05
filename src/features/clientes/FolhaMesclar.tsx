import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BottomSheet, Button, Card, ChoiceCard, Overline, SearchField, SkeletonCard, useToast } from '@/components/ui'
import { useAtraso } from '@/hooks/useAtraso'
import { mensagemDeErro } from '@/lib/erros'
import { haDias } from '@/lib/formatadores'
import { formatarWhatsapp } from '@/lib/whatsapp'
import { buscarCliente, buscarClientes, type ClienteView } from './api'
import { mesclarClientes } from './admApi'

/**
 * Mesclar duplicadas (ADM): escolhe a outra cliente pela busca e quais nome e WhatsApp ficam.
 * O histórico das duas soma na cliente desta ficha; a outra é apagada.
 */
export function FolhaMesclar({ cliente, aberta, onFechar }: { cliente: ClienteView; aberta: boolean; onFechar: () => void }) {
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Mesclar duplicada" computador="lateral">
      {aberta && <Conteudo cliente={cliente} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function Conteudo({ cliente, onFechar }: { cliente: ClienteView; onFechar: () => void }) {
  const navegar = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [termo, setTermo] = useState('')
  const [outra, setOutra] = useState<ClienteView | null>(null)
  const [nome, setNome] = useState<'esta' | 'outra'>('esta')
  const [whats, setWhats] = useState<'esta' | 'outra'>('esta')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const atrasado = useAtraso(termo.trim(), 250)
  const busca = useQuery({ queryKey: ['clientes', 'busca', atrasado], queryFn: () => buscarClientes(atrasado), enabled: atrasado.length >= 2 })

  const escolher = async (id: string) => {
    setErro(null)
    try {
      setOutra(await buscarCliente(id))
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  const mesclar = async () => {
    if (!outra) return
    setSalvando(true)
    setErro(null)
    try {
      await mesclarClientes(cliente.id, outra.id, nome === 'esta' ? cliente.nome : outra.nome, whats === 'esta' ? cliente.whatsapp : outra.whatsapp)
      toast.mostrar('Clientes mescladas')
      await queryClient.invalidateQueries({ queryKey: ['cliente', cliente.id] })
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      onFechar()
      navegar(`/adm/clientes/${cliente.id}`, { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  if (!outra) {
    const resultados = (busca.data ?? []).filter((r) => r.id !== cliente.id)
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-text-secondary">Busque a cliente repetida. As compras, contatos e transferências dela vão para {cliente.nome}.</p>
        <SearchField value={termo} onChange={setTermo} autoFocus placeholder="Nome ou WhatsApp" rotuloAcessivel="Buscar a cliente repetida" />
        {busca.isFetching && !busca.data ? (
          <SkeletonCard linhas={2} />
        ) : atrasado.length >= 2 && resultados.length === 0 ? (
          <p className="text-body-sm text-text-secondary">Nenhuma outra cliente com "{atrasado}".</p>
        ) : (
          <div className="flex flex-col gap-3">
            {resultados.map((r) => (
              <ChoiceCard key={r.id} onClick={() => void escolher(r.id)} descricao={`final ${r.whatsapp_final} · ${r.num_compras} compras${r.ultima_compra_em ? ` · última ${haDias(r.ultima_compra_em)}` : ''}`}>
                {r.nome}
              </ChoiceCard>
            ))}
          </div>
        )}
        {erro && <p role="alert" className="text-body-sm text-danger">{erro}</p>}
      </div>
    )
  }

  const opcao = (lado: 'esta' | 'outra', texto: string, sel: 'esta' | 'outra', set: (v: 'esta' | 'outra') => void) => (
    <ChoiceCard key={lado} selecionado={sel === lado} onClick={() => set(lado)}>
      {texto}
    </ChoiceCard>
  )

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-1 bg-background-muted">
        <p className="text-body-sm">
          {cliente.nome}: {cliente.num_compras ?? 0} compras · {outra.nome}: {outra.num_compras ?? 0} compras
        </p>
        <p className="text-caption text-text-tertiary">Depois de mesclar, o histórico soma e a outra cliente deixa de existir.</p>
      </Card>
      <div className="flex flex-col gap-3">
        <Overline>Nome que fica</Overline>
        {opcao('esta', cliente.nome, nome, setNome)}
        {opcao('outra', outra.nome, nome, setNome)}
      </div>
      <div className="flex flex-col gap-3">
        <Overline>WhatsApp que fica</Overline>
        {opcao('esta', formatarWhatsapp(cliente.whatsapp), whats, setWhats)}
        {opcao('outra', formatarWhatsapp(outra.whatsapp), whats, setWhats)}
      </div>
      {erro && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">{erro}</p>}
      <div className="flex gap-3">
        <Button variante="secundario" onClick={() => setOutra(null)}>
          Escolher outra
        </Button>
        <Button className="flex-1" carregando={salvando} onClick={() => void mesclar()}>
          Mesclar
        </Button>
      </div>
    </div>
  )
}
