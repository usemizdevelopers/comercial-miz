# Pendências e decisões em aberto

Itens conhecidos que ficaram para depois. Os testes que dependem de rede estão em [TESTES-PENDENTES.md](TESTES-PENDENTES.md).

## Dependem da Miz / da dona do projeto

| Item | Situação | O que falta |
| --- | --- | --- |
| WhatsApp de suporte da Miz | Provisório `5531999999999` (número de mentira) | Número oficial. **Obrigatório antes de publicar** (build arg `VITE_WHATSAPP_SUPORTE_MIZ`, ver [DEPLOY-EASYPANEL.md](DEPLOY-EASYPANEL.md)) |
| Logo oficial | O site usa o logotipo em texto (`Logo`, Quicksand) e um favicon simples | Arquivo SVG da marca MIZ Loja; trocar em `src/components/ui/Navegacao.tsx` (`Logo`) e `public/favicon.svg` |
| Domínio do site | — | Definir (ex.: `loja.usemiz.app`) para o Easypanel, `APP_URL`, `ALLOWED_ORIGINS` e a Site URL do Auth |

## Segurança e Auth

| Item | Situação | O que falta |
| --- | --- | --- |
| Recuperação de senha por e-mail | v1: "Esqueci a senha" manda falar com a dona (vendedora) ou com a Miz (dona). A ADM já informa o e-mail na troca de senha | Fluxo de redefinição pelo e-mail real da ADM (o login usa e-mail técnico que não recebe nada). Precisa de SMTP próprio no Supabase |
| Proteção contra senhas vazadas | Aviso do advisor de segurança do Supabase (vale para o projeto inteiro, inclusive o app MIZ) | Ligar em Authentication → Policies/Passwords ("Leaked password protection"). Decisão da dona do projeto, porque afeta também o app MIZ |
| Funções temporárias | `mizloja-primeiro-admin` (versão desligada no repositório, nunca publicada ainda) e `mizloja-seed-demo` (não publicada) | Depois de usar (TESTES-PENDENTES itens 1 e 7): deixar a `primeiro-admin` publicada só na versão desligada ou removê-la; remover a `seed-demo` quando a demonstração não for mais necessária |
| `ALLOWED_ORIGINS` / `APP_URL` | Padrão `http://localhost:5173` | Ajustar nos Secrets das Edge Functions depois do deploy |

## Banco

| Item | Situação | O que falta |
| --- | --- | --- |
| Migration `mizloja_sem_imagens` | Escrita em `supabase/migrations-pendentes/`, **não aplicada** (o conector trava em comando de apagar) | Aplicar no SQL Editor e mover para `supabase/migrations/` (TESTES-PENDENTES item 0) |
| Linha antiga de `mizloja_admins` (conta `usemizdigital@gmail.com`) | Continua lá até o Admin Miz novo ser criado | A `primeiro-admin` remove a linha (só ela; a conta no Auth e no app MIZ não muda) |

## Produto (próximas etapas)

- Painel da vendedora pronto (Prompt 3). Próximo: painel da ADM (rotas `/adm/*` ainda "Em construção"); depois, a revisão final.
- Sincronização futura do catálogo com `public.pecas` do app MIZ: hoje é cópia única (`origem_id` só como referência); qualquer sincronização precisa de aprovação explícita.
