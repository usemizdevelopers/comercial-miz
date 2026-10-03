import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { WarningCircle } from '@phosphor-icons/react'
import { Button, Logo, PasswordField, PhoneField } from '@/components/ui'
import { paginaInicial, useSessao } from '@/app/sessao/sessaoContexto'
import { lerAvisoEntrar } from '@/app/sessao/avisos'
import { mensagemDeErro } from '@/lib/erros'
import { EsqueciSenha } from './EsqueciSenha'

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Digite o seu usuário'),
  senha: z.string().min(1, 'Digite a sua senha'),
})
type Dados = z.infer<typeof esquema>

/** /entrar — usuário (WhatsApp, com ou sem máscara) e senha. Logo no topo, nada mais. */
export default function Entrar() {
  const { entrar, modoVendedora } = useSessao()
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(() => lerAvisoEntrar())
  const [esqueci, setEsqueci] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({ resolver: zodResolver(esquema), defaultValues: { usuario: '', senha: '' } })

  const enviar = handleSubmit(async (dados) => {
    setErro(null)
    try {
      const usuaria = await entrar(dados.usuario, dados.senha)
      navegar(paginaInicial(usuaria, modoVendedora), { replace: true })
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : mensagemDeErro(e))
    }
  })

  return (
    <div className="flex min-h-tela flex-col items-center justify-center px-gutter py-10 area-segura-topo">
      <form onSubmit={enviar} noValidate className="flex w-full max-w-folha flex-col gap-6">
        <div className="flex justify-center pb-4">
          <Logo className="text-h1" />
        </div>

        <Controller
          name="usuario"
          control={control}
          render={({ field }) => (
            <PhoneField
              rotulo="Usuário"
              ajuda={errors.usuario ? undefined : 'O seu WhatsApp com DDD'}
              erro={errors.usuario?.message}
              autoFocus
              autoComplete="username"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
        <PasswordField rotulo="Senha" autoComplete="current-password" erro={errors.senha?.message} {...register('senha')} />

        {erro && (
          <p role="alert" className="flex items-center gap-2 rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
            <WarningCircle weight="light" className="h-icone w-icone shrink-0" />
            {erro}
          </p>
        )}

        <Button type="submit" tamanho="grande" larguraTotal carregando={isSubmitting}>
          Entrar
        </Button>
        <div className="flex justify-center">
          <Button variante="texto" onClick={() => setEsqueci(true)}>
            Esqueci a senha
          </Button>
        </div>
      </form>
      <EsqueciSenha aberta={esqueci} onFechar={() => setEsqueci(false)} />
    </div>
  )
}
