import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { Campo, type CampoBaseProps } from './Campo'
import { classesCaixa } from './estilos'

export interface TextFieldProps extends CampoBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Conteúdo fixo à esquerda (ex.: "R$") */
  prefixo?: ReactNode
  /** Conteúdo à direita (ex.: botão mostrar senha) */
  sufixo?: ReactNode
  classeCaixa?: string
  classeInput?: string
}

/** Campo de texto base (seção 7). Compatível com react-hook-form (register). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { rotulo, obrigatorio, erro, ajuda, className, prefixo, sufixo, classeCaixa, classeInput, disabled, id, ...props },
  ref,
) {
  return (
    <Campo rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} className={className} idCampo={id}>
      {({ id: idCampo, descricao }) => (
        <div className={cn(classesCaixa({ erro: !!erro, desabilitado: disabled }), 'flex h-campo items-center gap-2', classeCaixa)}>
          {prefixo}
          <input
            ref={ref}
            id={idCampo}
            disabled={disabled}
            aria-invalid={erro ? true : undefined}
            aria-describedby={descricao}
            aria-required={obrigatorio || undefined}
            className={cn('h-full min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed', classeInput)}
            {...props}
          />
          {sufixo}
        </div>
      )}
    </Campo>
  )
})

/** Senha com botão mostrar/ocultar. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, 'type' | 'sufixo'>>(function PasswordField(
  props,
  ref,
) {
  const [visivel, setVisivel] = useState(false)
  return (
    <TextField
      ref={ref}
      type={visivel ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      {...props}
      sufixo={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="foco alvo-48 flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
        >
          {visivel ? <EyeSlash weight="light" className="h-icone w-icone" /> : <Eye weight="light" className="h-icone w-icone" />}
        </button>
      }
    />
  )
})
