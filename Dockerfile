# MIZ Loja · imagem do site (ver docs/DEPLOY-EASYPANEL.md)
# Etapa 1: build com Node. As variáveis VITE_* entram no build (ficam no JavaScript do site),
# por isso são build args. Nunca passar a service role key aqui.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_WHATSAPP_SUPORTE_MIZ
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_WHATSAPP_SUPORTE_MIZ=$VITE_WHATSAPP_SUPORTE_MIZ

# Falha o build se faltar alguma variável (melhor que publicar um site quebrado)
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" && test -n "$VITE_WHATSAPP_SUPORTE_MIZ" \
    || (echo "Faltam build args: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_WHATSAPP_SUPORTE_MIZ" && exit 1)
RUN npm run build

# Etapa 2: só os arquivos prontos, servidos pelo nginx na porta 80
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/saude || exit 1
