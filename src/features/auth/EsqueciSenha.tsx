import { BottomSheet, Button } from '@/components/ui'
import { linkSuporteMiz } from '@/lib/acesso'

/**
 * "Esqueci a senha" na v1: a vendedora pede nova senha à dona; a dona, à Miz.
 * Recuperação por e-mail fica para depois (pendência documentada em docs/PENDENCIAS.md).
 */
export function EsqueciSenha({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  return (
    <BottomSheet aberta={aberta} onFechar={onFechar} titulo="Esqueceu a senha?">
      <div className="flex flex-col gap-4">
        <p className="text-body text-text-secondary">
          <span className="font-semibold text-text-primary">Vendedora:</span> peça uma senha nova para a dona da loja. Ela gera em
          Equipe e manda pelo WhatsApp.
        </p>
        <p className="text-body text-text-secondary">
          <span className="font-semibold text-text-primary">Dona da loja:</span> fale com a Miz pelo WhatsApp.
        </p>
        <Button variante="whatsapp" larguraTotal onClick={() => window.open(linkSuporteMiz(), '_blank', 'noopener')}>
          WhatsApp da Miz
        </Button>
      </div>
    </BottomSheet>
  )
}
