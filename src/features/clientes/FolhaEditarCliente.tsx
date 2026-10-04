import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BottomSheet, Button, ChipGroup, ChipPagamento, DateParts, Overline, PhoneField, TextField, lerDataPartes, useToast, type DataPartes } from '@/components/ui'
import { mensagemDeErro } from '@/lib/erros'
import { normalizarWhatsapp, whatsappValido } from '@/lib/whatsapp'
import { atualizarCliente, clientePorWhatsapp, ETAPAS_MANUAIS, type ClienteView, type EtapaManual } from './api'

/**
 * Editar (folha inferior): nome, WhatsApp (com checagem de duplicidade), aniversário e etapa.
 * Etapa: sem compra = Novas / Em conversa / Sem interesse; com compra = automática ou Sem interesse.
 */
export function FolhaEditarCliente({ cliente, aberta, onFechar }: { cliente: ClienteView; aberta: boolean; onFechar: () => void }) {
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Editar cliente" computador="lateral">
      {/* remonta a cada abertura para começar com os dados atuais */}
      {aberta && <Formulario cliente={cliente} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function Formulario({ cliente, onFechar }: { cliente: ClienteView; onFechar: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [nome, setNome] = useState(cliente.nome)
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp)
  const [aniv, setAniv] = useState<DataPartes>({
    dia: cliente.aniv_dia ? String(cliente.aniv_dia) : '',
    mes: cliente.aniv_mes ? String(cliente.aniv_mes) : '',
    ano: cliente.aniv_ano ? String(cliente.aniv_ano) : '',
  })
  const [etapa, setEtapa] = useState<EtapaManual | null>((cliente.etapa_manual as EtapaManual | null) ?? null)
  const [duplicada, setDuplicada] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const comCompra = (cliente.num_compras ?? 0) > 0
  const opcoesEtapa: Array<{ id: EtapaManual | null; rotulo: string }> = comCompra
    ? [
        { id: null, rotulo: 'Automática (pelas compras)' },
        { id: 'sem_interesse', rotulo: 'Sem interesse' },
      ]
    : ETAPAS_MANUAIS
  const etapaAtual = comCompra && etapa !== 'sem_interesse' ? null : (etapa ?? (comCompra ? null : 'novas'))

  const data = lerDataPartes(aniv)
  const nomeOk = nome.trim().length >= 2
  const whatsOk = whatsappValido(whatsapp)

  const conferirNumero = async () => {
    setDuplicada(null)
    if (!whatsOk) return
    try {
      const outra = await clientePorWhatsapp(whatsapp, cliente.id)
      setDuplicada(outra ? outra.nome : null)
    } catch {
      // o banco confere de novo ao salvar
    }
  }

  const salvar = async () => {
    if (!nomeOk || !whatsOk || data.erro || duplicada) return
    setSalvando(true)
    setErro(null)
    try {
      await atualizarCliente(cliente.id, {
        nome: nome.trim(),
        whatsapp: normalizarWhatsapp(whatsapp) ?? whatsapp,
        aniv_dia: data.dia,
        aniv_mes: data.mes,
        aniv_ano: data.ano,
        etapa_manual: etapaAtual,
      })
      await queryClient.invalidateQueries({ queryKey: ['cliente', cliente.id] })
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      void queryClient.invalidateQueries({ queryKey: ['hoje'] })
      toast.mostrar('Cliente atualizada')
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TextField rotulo="Nome" obrigatorio value={nome} onChange={(e) => setNome(e.target.value)} erro={nomeOk ? undefined : 'Digite o nome da cliente'} />
      <PhoneField
        rotulo="WhatsApp"
        obrigatorio
        value={whatsapp}
        onChange={(v) => {
          setWhatsapp(v)
          setDuplicada(null)
        }}
        onBlur={() => void conferirNumero()}
        erro={!whatsOk ? 'Digite o WhatsApp com DDD' : duplicada ? `Esse número já é da ${duplicada}` : undefined}
      />
      <DateParts value={aniv} onChange={setAniv} erro={data.erro} />
      <div className="flex flex-col gap-2">
        <Overline>Etapa</Overline>
        <ChipGroup rotulo="Etapa">
          {opcoesEtapa.map((o) => (
            <ChipPagamento key={o.id ?? 'auto'} rotulo={o.rotulo} selecionado={etapaAtual === o.id} onClick={() => setEtapa(o.id)} />
          ))}
        </ChipGroup>
        <p className="text-caption text-text-tertiary">
          {comCompra ? 'Com compra, a etapa muda sozinha pelo tempo desde a última compra.' : '"Sem interesse" tira a cliente do quadro e da tela Hoje.'}
        </p>
      </div>
      {erro && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
          {erro}
        </p>
      )}
      <Button larguraTotal disabled={!nomeOk || !whatsOk || !!data.erro || !!duplicada} carregando={salvando} onClick={() => void salvar()}>
        Salvar
      </Button>
    </div>
  )
}
