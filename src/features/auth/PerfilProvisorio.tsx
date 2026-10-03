import { SignOut } from '@phosphor-icons/react'
import { Button, Card, Overline, TopBar } from '@/components/ui'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { formatarWhatsapp } from '@/lib/whatsapp'

/** /perfil provisório: dados de quem entrou e o botão Sair. A página completa vem na etapa 5. */
export function PerfilProvisorio() {
  const { usuaria, sair } = useSessao()
  return (
    <>
      <TopBar titulo="Perfil" />
      <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10 pt-2">
        <Card className="flex flex-col gap-4">
          <div>
            <Overline>Nome</Overline>
            <p className="text-h3">{usuaria?.nome}</p>
          </div>
          <div>
            <Overline>Usuário</Overline>
            <p className="text-body">{formatarWhatsapp(usuaria?.usuario)}</p>
          </div>
          {usuaria?.lojaNome && (
            <div>
              <Overline>Loja</Overline>
              <p className="text-body">{usuaria.lojaNome}</p>
            </div>
          )}
          <p className="text-caption text-text-tertiary">Página completa de Perfil na etapa 5.</p>
        </Card>
        <Button variante="secundario" icone={<SignOut weight="light" className="h-icone w-icone" />} onClick={() => void sair()}>
          Sair
        </Button>
      </div>
    </>
  )
}
