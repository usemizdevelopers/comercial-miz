import { forwardRef, useEffect, useRef, type ChangeEvent, type TextareaHTMLAttributes } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { mascararWhatsapp } from '@/lib/whatsapp'
import { formatarValor } from '@/lib/formatadores'
import { Campo, type CampoBaseProps } from './Campo'
import { classesCaixa } from './estilos'
import { TextField, type TextFieldProps } from './TextField'
import type { DataPartes } from './dataPartes'

/* ------------------------------------------------------------------ WhatsApp */

export interface PhoneFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value: string
  onChange: (valorMascarado: string) => void
}

/** WhatsApp com máscara (31) 99999-9999 e teclado numérico. Guarde normalizado com normalizarWhatsapp. */
export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { value, onChange, placeholder = '(31) 99999-9999', ...props },
  ref,
) {
  return (
    <TextField
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      placeholder={placeholder}
      value={mascararWhatsapp(value)}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(mascararWhatsapp(e.target.value))}
      {...props}
    />
  )
})

/* ------------------------------------------------------------------ Valor em R$ */

export interface MoneyFieldProps extends CampoBaseProps {
  /** Valor em reais (ex.: 289.8). null = vazio. */
  value: number | null
  onChange: (valor: number | null) => void
  id?: string
  disabled?: boolean
  autoFocus?: boolean
  name?: string
}

/**
 * Valor em R$ (seção 7): "R$" fixo à esquerda em text-secondary, valor em h2 à direita,
 * altura 64, teclado numérico. Digita como caixa registradora: 2 8 9 8 0 → 289,80.
 */
export function MoneyField({ value, onChange, rotulo, obrigatorio, erro, ajuda, className, id, disabled, autoFocus, name }: MoneyFieldProps) {
  const texto = value === null ? '' : formatarValor(value)
  return (
    <Campo rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} className={className} idCampo={id}>
      {({ id: idCampo, descricao }) => (
        <div className={cn(classesCaixa({ erro: !!erro, desabilitado: disabled }), 'flex h-campo-valor items-center gap-3')}>
          <span className="text-h2 font-regular text-text-secondary" aria-hidden="true">
            R$
          </span>
          <input
            id={idCampo}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus={autoFocus}
            disabled={disabled}
            placeholder="0,00"
            aria-invalid={erro ? true : undefined}
            aria-describedby={descricao}
            value={texto}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10)
              onChange(digitos === '' ? null : Number(digitos) / 100)
            }}
            className="numeros h-full min-w-0 flex-1 bg-transparent text-right text-h2 outline-none"
          />
        </div>
      )}
    </Campo>
  )
}

/* ------------------------------------------------------------------ Busca */

export interface SearchFieldProps {
  value: string
  onChange: (valor: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  rotuloAcessivel?: string
  inputMode?: 'search' | 'text' | 'numeric'
}

/** Busca (seção 7): lupa à esquerda, "x" para limpar, fundo background-muted; ao focar, surface + borda primary. */
export function SearchField({ value, onChange, placeholder = 'Buscar', autoFocus, className, rotuloAcessivel, inputMode = 'search' }: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      className={cn(
        'flex h-campo items-center gap-2 rounded-md border border-transparent bg-background-muted px-4 transition-[background-color,border-color] duration-fast ease-out',
        'focus-within:border-1.5 focus-within:border-primary focus-within:bg-surface',
        className,
      )}
    >
      <MagnifyingGlass weight="light" className="h-icone w-icone shrink-0 text-text-secondary" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        inputMode={inputMode}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={rotuloAcessivel ?? placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            ref.current?.focus()
          }}
          className="foco alvo-48 flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary"
          aria-label="Limpar busca"
        >
          <X weight="light" className="h-icone w-icone" />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Observação */

export interface TextAreaProps extends CampoBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  maximo?: number
}

/** Área de texto de 3 linhas que cresce até 6 (seção 7). */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { rotulo, obrigatorio, erro, ajuda, className, maximo, id, disabled, value, ...props },
  refExterno,
) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const estilo = getComputedStyle(el)
    const linha = parseFloat(estilo.lineHeight) || 24
    const vertical = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)
    el.style.height = 'auto'
    const alvo = Math.min(Math.max(el.scrollHeight, linha * 3 + vertical), linha * 6 + vertical)
    el.style.height = `${alvo}px`
  }, [value])

  const contador = maximo !== undefined && typeof value === 'string' ? `${value.length}/${maximo}` : undefined

  return (
    <Campo rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda ?? contador} className={className} idCampo={id}>
      {({ id: idCampo, descricao }) => (
        <textarea
          ref={(el) => {
            ref.current = el
            if (typeof refExterno === 'function') refExterno(el)
            else if (refExterno) refExterno.current = el
          }}
          id={idCampo}
          rows={3}
          maxLength={maximo}
          disabled={disabled}
          value={value}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao}
          className={cn(classesCaixa({ erro: !!erro, desabilitado: disabled }), 'resize-none py-3 outline-none focus:border-1.5 focus:border-primary')}
          {...props}
        />
      )}
    </Campo>
  )
})

/* ------------------------------------------------------------------ Data de nascimento */


export interface DatePartsProps extends CampoBaseProps {
  value: DataPartes
  onChange: (valor: DataPartes) => void
  id?: string
}

/** Três campos curtos: dia, mês e ano opcional (seção 7). Nunca calendário. */
export function DateParts({ value, onChange, rotulo = 'Data de nascimento', obrigatorio, erro, ajuda = 'Dia e mês bastam; ano é opcional', className, id }: DatePartsProps) {
  const parte = (campo: keyof DataPartes, tamanho: number, rotuloParte: string, classe: string) => (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={rotuloParte}
      aria-label={rotuloParte}
      maxLength={tamanho}
      value={value[campo]}
      onChange={(e) => onChange({ ...value, [campo]: e.target.value.replace(/\D/g, '').slice(0, tamanho) })}
      className={cn(classesCaixa({ erro: !!erro }), 'numeros h-campo text-center outline-none focus:border-1.5 focus:border-primary', classe)}
    />
  )
  return (
    <Campo rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} className={className} idCampo={id}>
      {() => (
        <div className="flex gap-2" role="group" aria-label={rotulo}>
          {parte('dia', 2, 'Dia', 'w-18')}
          {parte('mes', 2, 'Mês', 'w-18')}
          {parte('ano', 4, 'Ano', 'min-w-0 flex-1')}
        </div>
      )}
    </Campo>
  )
}
