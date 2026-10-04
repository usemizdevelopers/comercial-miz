import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BottomSheet, Button, ChoiceCard, EmptyState, TextArea, useToast } from '@/components/ui'
import { useEquipe } from '@/hooks/useDadosLoja'
import { mensagemDeErro } from '@/lib/erros'
import { transferirCliente, type ClienteView } from './api'

/** Transferir atendimento: escolhe a colega ativa e, opcional, deixa um recado curto. */
export function FolhaTransferir({ cliente, aberta, onFechar }: { cliente: ClienteView; aberta: boolean; onFechar: () => void }) {
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Transferir cliente" computador="lateral">
      {aberta && <Formulario cliente={cliente} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function Formulario({ cliente, onFechar }: { cliente: ClienteView; onFechar: () => void }) {
  const { data: equipe } = useEquipe()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [para, setPara] = useState<string | null>(null)
  const [recado, setRecado] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const colegas = (equipe ?? []).filter((u) => u.situacao === 'ativa' && u.id !== cliente.vendedora_id)
  const escolhida = colegas.find((c) => c.id === para)

  const transferir = async () => {
    if (!para) return
    setSalvando(true)
    setErro(null)
    try {
      await transferirCliente(cliente.id, para, recado.trim() || null)
      await queryClient.invalidateQueries({ queryKey: ['cliente', cliente.id] })
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      void queryClient.invalidateQueries({ queryKey: ['hoje'] })
      toast.mostrar(`${cliente.nome.split(' ')[0]} agora é da ${escolhida?.nome.split(' ')[0] ?? 'colega'}`)
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  if (colegas.length === 0) return <EmptyState texto="Não há outra pessoa ativa na equipe para receber a cliente." />

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body-sm text-text-secondary">A cliente passa na hora, com o recado no topo da ficha e um cartão no Follow-up de quem recebe.</p>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Para quem">
        {colegas.map((c) => (
          <ChoiceCard key={c.id} selecionado={c.id === para} onClick={() => setPara(c.id)} descricao={c.perfil === 'adm' ? 'Dona da loja' : undefined}>
            {c.nome}
          </ChoiceCard>
        ))}
      </div>
      <TextArea
        rotulo="Recado (opcional)"
        placeholder="ela quer o blazer em caqui, chega dia 15"
        maximo={200}
        value={recado}
        onChange={(e) => setRecado(e.target.value)}
      />
      {erro && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
          {erro}
        </p>
      )}
      <Button larguraTotal disabled={!para} carregando={salvando} onClick={() => void transferir()}>
        {escolhida ? `Transferir para ${escolhida.nome.split(' ')[0]}` : 'Transferir'}
      </Button>
    </div>
  )
}
