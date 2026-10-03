import { forwardRef, type SelectHTMLAttributes } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { Campo, type CampoBaseProps } from './Campo'
import { classesCaixa } from './estilos'

export interface SelectFieldProps extends CampoBaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  opcoes: Array<{ valor: string; rotulo: string }>
  placeholder?: string
}

/** Lista suspensa nativa (para listas longas, como UF). Listas curtas usam chips. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { rotulo, obrigatorio, erro, ajuda, className, opcoes, placeholder, id, disabled, ...props },
  ref,
) {
  return (
    <Campo rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} className={className} idCampo={id}>
      {({ id: idCampo, descricao }) => (
        <div className={cn(classesCaixa({ erro: !!erro, desabilitado: disabled }), 'relative flex h-campo items-center')}>
          <select
            ref={ref}
            id={idCampo}
            disabled={disabled}
            aria-invalid={erro ? true : undefined}
            aria-describedby={descricao}
            className="h-full w-full appearance-none bg-transparent pr-8 outline-none"
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {opcoes.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
          <CaretDown weight="light" className="pointer-events-none absolute right-4 h-icone w-icone text-text-secondary" aria-hidden="true" />
        </div>
      )}
    </Campo>
  )
})
