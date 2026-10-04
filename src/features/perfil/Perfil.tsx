import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, SignOut } from '@phosphor-icons/react'
import { Button, Card, Overline, PasswordField, TextField, TopBar, useToast } from '@/components/ui'
import { useSessao } from '@/app/sessao/sessaoContexto'
import { supabase } from '@/lib/supabase'
import { mensagemDeErro } from '@/lib/erros'
import { SENHA_MINIMO } from '@/lib/acesso'
import { formatarWhatsapp } from '@/lib/whatsapp'

/** /perfil — nome (editável), WhatsApp e usuário (só leitura: são o login), loja, trocar senha e sair. */
export default function Perfil() {
  const { usuaria, sair, recarregar, modoVendedora, alternarModoVendedora } = useSessao()
  const navegar = useNavigate()

  const { data: whatsapp } = useQuery({
    queryKey: ['perfil', 'whatsapp', usuaria?.id],
    enabled: !!usuaria,
    queryFn: async () => {
      const { data, error } = await supabase.from('mizloja_usuarias').select('whatsapp').eq('id', usuaria?.id ?? '').maybeSingle()
      if (error) throw error
      return data?.whatsapp ?? null
    },
  })

  return (
    <>
      <TopBar titulo="Perfil" />
      <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter pb-10 pt-2">
        {usuaria?.papel === 'adm' && modoVendedora && (
          <Button
            variante="secundario"
            icone={<ArrowLeft weight="light" className="h-icone w-icone" />}
            onClick={() => {
              alternarModoVendedora(false)
              navegar('/adm')
            }}
          >
            Voltar ao painel
          </Button>
        )}

        <NomeEditavel key={usuaria?.nome} nomeAtual={usuaria?.nome ?? ''} onSalvo={() => void recarregar()} />

        <Card className="flex flex-col gap-4">
          <div>
            <Overline>WhatsApp</Overline>
            <p className="text-body">{formatarWhatsapp(whatsapp ?? usuaria?.usuario)}</p>
          </div>
          <div>
            <Overline>Usuário de acesso</Overline>
            <p className="numeros text-body">{usuaria?.usuario}</p>
          </div>
          {usuaria?.lojaNome && (
            <div>
              <Overline>Loja</Overline>
              <p className="text-body">{usuaria.lojaNome}</p>
            </div>
          )}
          <p className="text-caption text-text-tertiary">WhatsApp e usuário são o seu login e não mudam por aqui. Para trocar, fale com a dona da loja.</p>
        </Card>

        <TrocarSenha />

        <Button variante="secundario" icone={<SignOut weight="light" className="h-icone w-icone" />} onClick={() => void sair()}>
          Sair
        </Button>
      </div>
    </>
  )
}

function NomeEditavel({ nomeAtual, onSalvo }: { nomeAtual: string; onSalvo: () => void }) {
  const toast = useToast()
  const [nome, setNome] = useState(nomeAtual)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const mudou = nome.trim() !== nomeAtual.trim()

  const salvar = async () => {
    if (nome.trim().length < 2) {
      setErro('Digite o seu nome')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const { error } = await supabase.rpc('mizloja_alterar_meu_nome', { p_nome: nome })
      if (error) throw error
      toast.mostrar('Nome atualizado')
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <TextField rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={erro} autoComplete="name" maxLength={80} />
      {mudou && (
        <Button tamanho="pequeno" className="self-start" carregando={salvando} onClick={() => void salvar()}>
          Salvar nome
        </Button>
      )}
    </Card>
  )
}

function TrocarSenha() {
  const toast = useToast()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [tentou, setTentou] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const erroSenha = senha.length < SENHA_MINIMO ? `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres` : null
  const erroConfirmacao = confirmacao !== senha ? 'As duas senhas precisam ser iguais' : null

  const trocar = async () => {
    setTentou(true)
    if (erroSenha || erroConfirmacao) return
    setSalvando(true)
    setErro(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) throw error
      setSenha('')
      setConfirmacao('')
      setTentou(false)
      toast.mostrar('Senha trocada')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <Overline>Trocar senha</Overline>
      <PasswordField rotulo="Nova senha" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} erro={tentou ? erroSenha : undefined} />
      <PasswordField
        rotulo="Confirme a nova senha"
        autoComplete="new-password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        erro={tentou ? erroConfirmacao : undefined}
      />
      {erro && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
          {erro}
        </p>
      )}
      <Button variante="secundario" className="self-start" carregando={salvando} disabled={!senha} onClick={() => void trocar()}>
        Trocar senha
      </Button>
    </Card>
  )
}
