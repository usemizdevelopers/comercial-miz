import { useState } from 'react'
import { CheckCircle, Copy, WarningCircle } from '@phosphor-icons/react'
import { Button, Card, Overline } from '@/components/ui'
import type { AcessoCriado as Acesso } from '@/lib/funcoes'
import { formatarWhatsapp, linkWhatsapp } from '@/lib/whatsapp'

/**
 * Tela "Acesso criado": mostra usuário e senha provisória UMA vez, com
 * [Enviar acesso pelo WhatsApp] (mensagem pronta) e [Copiar acesso].
 * Usada ao criar loja, ADM, vendedora e Admin Miz e ao gerar nova senha.
 */
export function AcessoCriado({ acesso, titulo = 'Acesso criado', onConcluir }: { acesso: Acesso; titulo?: string; onConcluir: () => void }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(acesso.mensagem)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <CheckCircle weight="light" className="h-icone-sucesso w-icone-sucesso shrink-0 text-success" aria-hidden="true" />
        <div>
          <h2 className="text-h2">{titulo}</h2>
          <p className="text-body-sm text-text-secondary">
            {acesso.nome} · {formatarWhatsapp(acesso.whatsapp)}
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <Overline>Usuário</Overline>
          <p className="numeros select-all text-h3">{acesso.usuario}</p>
        </div>
        <div>
          <Overline>Senha provisória</Overline>
          <p className="numeros select-all text-h3 tracking-logo">{acesso.senha}</p>
        </div>
      </Card>

      <p className="flex items-start gap-2 rounded-md bg-warning-soft px-4 py-3 text-body-sm text-warning" role="note">
        <WarningCircle weight="light" className="h-icone w-icone shrink-0" aria-hidden="true" />
        A senha não aparece de novo. Se perder, gere uma nova.
      </p>

      <div className="flex flex-col gap-3">
        <Button
          variante="whatsapp"
          larguraTotal
          onClick={() => window.open(linkWhatsapp(acesso.whatsapp, acesso.mensagem), '_blank', 'noopener')}
        >
          Enviar acesso pelo WhatsApp
        </Button>
        <Button variante="secundario" larguraTotal icone={<Copy weight="light" className="h-icone w-icone" />} onClick={() => void copiar()}>
          {copiado ? 'Acesso copiado' : 'Copiar acesso'}
        </Button>
        <Button variante="texto" className="self-center" onClick={onConcluir}>
          Concluir
        </Button>
      </div>
    </div>
  )
}
