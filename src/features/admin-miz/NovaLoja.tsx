import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { WarningCircle } from '@phosphor-icons/react'
import { BottomSheet, Button, Overline, PhoneField, SelectField, TextField } from '@/components/ui'
import { AcessoCriado } from '@/components/shared/AcessoCriado'
import { chamarFuncao, type AcessoCriado as Acesso } from '@/lib/funcoes'
import { mascararCnpj, validarCnpj } from '@/lib/cnpj'
import { mensagemDeErro } from '@/lib/erros'
import { whatsappValido } from '@/lib/whatsapp'
import { UFS } from './api'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Digite o nome da loja'),
  cnpj: z.string().refine(validarCnpj, 'Confira o CNPJ'),
  cidade: z.string().trim().min(2, 'Digite a cidade'),
  uf: z.string().refine((v) => UFS.includes(v), 'Escolha a UF'),
  whatsappLoja: z.string().refine((v) => v.trim() === '' || whatsappValido(v), 'Digite o WhatsApp com DDD'),
  donaNome: z.string().trim().min(2, 'Digite o nome da dona'),
  donaWhatsapp: z.string().refine(whatsappValido, 'Digite o WhatsApp com DDD'),
})
type Dados = z.infer<typeof esquema>

/** "+ Loja": folha lateral no computador. Cria a loja e a dona (ADM) pela Edge Function. */
export function NovaLoja({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient()
  const [acesso, setAcesso] = useState<Acesso | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: { nome: '', cnpj: '', cidade: '', uf: '', whatsappLoja: '', donaNome: '', donaWhatsapp: '' },
  })

  const fechar = () => {
    setAcesso(null)
    setErro(null)
    reset()
    onFechar()
  }

  const enviar = handleSubmit(async (d) => {
    setErro(null)
    try {
      const r = await chamarFuncao('mizloja-criar-loja', {
        loja: { nome: d.nome, cnpj: d.cnpj, cidade: d.cidade, uf: d.uf, whatsapp: d.whatsappLoja || null },
        dona: { nome: d.donaNome, whatsapp: d.donaWhatsapp },
      })
      setAcesso(r)
      await queryClient.invalidateQueries({ queryKey: ['miz', 'lojas'] })
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  })

  return (
    <BottomSheet aberta={aberta} onFechar={fechar} titulo={acesso ? undefined : 'Nova loja'} computador="lateral">
      {acesso ? (
        <div className="pt-4">
          <AcessoCriado acesso={acesso} titulo="Loja criada" onConcluir={fechar} />
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5 pb-2">
          <Overline>Loja</Overline>
          <TextField rotulo="Nome da loja" obrigatorio erro={errors.nome?.message} {...register('nome')} />
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <TextField
                rotulo="CNPJ"
                obrigatorio
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                erro={errors.cnpj?.message}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(mascararCnpj(e.target.value))}
              />
            )}
          />
          <div className="grid grid-cols-3 gap-3">
            <TextField className="col-span-2" rotulo="Cidade" obrigatorio erro={errors.cidade?.message} {...register('cidade')} />
            <SelectField rotulo="UF" obrigatorio placeholder="UF" opcoes={UFS.map((u) => ({ valor: u, rotulo: u }))} erro={errors.uf?.message} {...register('uf')} />
          </div>
          <Controller
            name="whatsappLoja"
            control={control}
            render={({ field }) => <PhoneField rotulo="WhatsApp da loja" value={field.value} onChange={field.onChange} onBlur={field.onBlur} erro={errors.whatsappLoja?.message} />}
          />

          <Overline className="pt-2">Dona (ADM)</Overline>
          <TextField rotulo="Nome da dona" obrigatorio erro={errors.donaNome?.message} {...register('donaNome')} />
          <Controller
            name="donaWhatsapp"
            control={control}
            render={({ field }) => (
              <PhoneField
                rotulo="WhatsApp da dona"
                obrigatorio
                ajuda={errors.donaWhatsapp ? undefined : 'Vira o usuário de acesso dela'}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                erro={errors.donaWhatsapp?.message}
              />
            )}
          />

          {erro && (
            <p role="alert" className="flex items-center gap-2 rounded-md bg-danger-soft px-4 py-3 text-body-sm text-danger">
              <WarningCircle weight="light" className="h-icone w-icone shrink-0" />
              {erro}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variante="secundario" className="flex-1" onClick={fechar} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" carregando={isSubmitting}>
              Criar loja
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  )
}
