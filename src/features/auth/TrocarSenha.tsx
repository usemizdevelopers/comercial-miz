import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { WarningCircle } from '@phosphor-icons/react'
import { Button, Logo, PasswordField, TextField } from '@/components/ui'
import { paginaInicial, useSessao } from '@/app/sessao/sessaoContexto'
import { supabase } from '@/lib/supabase'
import { mensagemDeErro } from '@/lib/erros'
import { SENHA_MINIMO } from '@/lib/acesso'

function criarEsquema(pedeEmail: boolean) {
  return z
    .object({
      senha: z.string().min(SENHA_MINIMO, `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres`),
      confirmacao: z.string(),
      email: pedeEmail ? z.string().trim().email('Digite um e-mail válido') : z.string().optional(),
    })
    .refine((d) => d.senha === d.confirmacao, { path: ['confirmacao'], message: 'As duas senhas precisam ser iguais' })
}
type Dados = z.infer<ReturnType<typeof criarEsquema>>

/**
 * /trocar-senha — obrigatória no primeiro acesso e depois de "gerar nova senha".
 * Tela única, sem como pular. A ADM informa também o e-mail de recuperação.
 */
export default function TrocarSenha() {
  const { usuaria, recarregar, sair, modoVendedora } = useSessao()
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const pedeEmail = usuaria?.papel === 'adm'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({
    resolver: zodResolver(criarEsquema(pedeEmail)),
    defaultValues: { senha: '', confirmacao: '', email: usuaria?.email ?? '' },
  })

  const enviar = handleSubmit(async (dados) => {
    setErro(null)
    try {
      const { error: erroSenha } = await supabase.auth.updateUser({ password: dados.senha })
      if (erroSenha) throw erroSenha
      if (pedeEmail && usuaria) {
        const { error: erroEmail } = await supabase
          .from('mizloja_usuarias')
          .update({ email: dados.email?.trim().toLowerCase() ?? null })
          .eq('id', usuaria.id)
        if (erroEmail) throw erroEmail
      }
      const { error: erroMarca } = await supabase.rpc('mizloja_senha_trocada')
      if (erroMarca) throw erroMarca
      const atualizada = await recarregar()
      navegar(paginaInicial(atualizada, modoVendedora), { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  })

  return (
    <div className="flex min-h-tela flex-col items-center justify-center px-gutter py-10 area-segura-topo">
      <form onSubmit={enviar} noValidate className="flex w-full max-w-folha flex-col gap-6">
        <div className="flex justify-center pb-2">
          <Logo className="text-h1" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-h1">Crie a sua senha</h1>
          <p className="text-body text-text-secondary">
            {usuaria ? `Oi, ${usuaria.nome.split(' ')[0]}! ` : ''}A senha que você recebeu é provisória. Escolha uma senha sua para
            continuar.
          </p>
        </div>

        <PasswordField
          rotulo="Nova senha"
          obrigatorio
          autoComplete="new-password"
          ajuda={errors.senha ? undefined : `Pelo menos ${SENHA_MINIMO} caracteres, diferente da provisória`}
          erro={errors.senha?.message}
          autoFocus
          {...register('senha')}
        />
        <PasswordField rotulo="Confirme a nova senha" obrigatorio autoComplete="new-password" erro={errors.confirmacao?.message} {...register('confirmacao')} />
        {pedeEmail && (
          <TextField
            rotulo="E-mail de recuperação"
            obrigatorio
            type="email"
            inputMode="email"
            autoComplete="email"
            ajuda={errors.email ? undefined : 'Usado para recuperar o seu acesso'}
            erro={errors.email?.message}
            {...register('email')}
          />
        )}

        {erro && (
          <p role="alert" className="flex items-center gap-2 rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
            <WarningCircle weight="light" className="h-icone w-icone shrink-0" />
            {erro}
          </p>
        )}

        <Button type="submit" tamanho="grande" larguraTotal carregando={isSubmitting}>
          Salvar senha
        </Button>
        <div className="flex justify-center">
          <Button variante="texto" onClick={() => void sair()}>
            Sair
          </Button>
        </div>
      </form>
    </div>
  )
}
