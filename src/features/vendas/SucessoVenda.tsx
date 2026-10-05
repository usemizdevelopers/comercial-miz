import { CheckCircle, CloudArrowUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { BotaoWhatsapp } from '@/components/shared/BotaoWhatsapp'
import { faltaParaMeta, useResumoMes } from '@/features/metas/api'
import { formatarMoeda } from '@/lib/formatadores'
import { linkWhatsapp } from '@/lib/whatsapp'

export interface DadosSucesso {
  valor: number
  clienteId: string
  clienteNome: string
  whatsapp: string | null
  /** ficou na fila (sem conexão) */
  naFila: boolean
}

/** Depois de salvar: valor, quanto falta para a meta e as 3 ações. */
export function SucessoVenda({
  dados,
  onNovaVenda,
  onIrParaHoje,
  rotuloInicio = 'Ir para Hoje',
}: {
  dados: DadosSucesso
  onNovaVenda: () => void
  onIrParaHoje: () => void
  rotuloInicio?: string
}) {
  const { data: resumo, isLoading } = useResumoMes()
  const falta = faltaParaMeta(resumo)

  let linhaMeta = ''
  if (!dados.naFila && !isLoading && resumo?.meta_individual) {
    linhaMeta = falta && falta > 0 ? `faltam ${formatarMoeda(falta, { destaque: true })} para sua meta` : 'meta do mês batida'
  }

  return (
    <div className="mx-auto flex w-full max-w-form flex-col items-center gap-6 px-gutter py-10 text-center" role="status">
      {dados.naFila ? (
        <CloudArrowUp weight="light" className="h-icone-sucesso w-icone-sucesso text-text-secondary" aria-hidden="true" />
      ) : (
        <CheckCircle weight="light" className="h-icone-sucesso w-icone-sucesso text-success" aria-hidden="true" />
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">
          Venda de {formatarMoeda(dados.valor)} {dados.naFila ? 'guardada' : 'salva'}
        </h1>
        {dados.naFila ? (
          <p className="text-body text-text-secondary">Sem conexão agora. Ela sobe sozinha quando a internet voltar.</p>
        ) : (
          linhaMeta && <p className="text-body text-text-secondary">{linhaMeta}</p>
        )}
      </div>
      <div className="flex w-full flex-col gap-3">
        {dados.whatsapp &&
          (dados.naFila ? (
            <Button variante="whatsapp" tamanho="grande" larguraTotal onClick={() => window.open(linkWhatsapp(dados.whatsapp ?? ''), '_blank', 'noopener,noreferrer')}>
              Abrir WhatsApp da {dados.clienteNome.split(' ')[0]}
            </Button>
          ) : (
            <BotaoWhatsapp
              clienteId={dados.clienteId}
              whatsapp={dados.whatsapp}
              tamanho="grande"
              larguraTotal
              rotulo={`Abrir WhatsApp da ${dados.clienteNome.split(' ')[0]}`}
            />
          ))}
        <Button tamanho="grande" larguraTotal onClick={onNovaVenda}>
          Nova venda
        </Button>
        <Button variante="texto" className="self-center" onClick={onIrParaHoje}>
          {rotuloInicio}
        </Button>
      </div>
    </div>
  )
}
