import { useState } from 'react'
import { Button, Card, Overline, PasswordField, useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { mensagemDeErro } from '@/lib/erros'
import { SENHA_MINIMO } from '@/lib/acesso'

/** Trocar a própria senha (nova + confirmação, mínimo 6). Usado no Perfil e em Configurações. */
export function TrocarSenhaCard() {
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
