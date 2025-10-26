# Quero Voltar — Instalação técnica

Este documento descreve os passos técnicos para instalar, configurar e rodar a aplicação Quero Voltar em ambiente de desenvolvimento e orientações para deploy.

Pré-requisitos

- Node.js (v18+ recomendado)
- npm (v8+) ou yarn/pnpm
- PostgreSQL acessível (local ou serviço gerenciado como Neon, Supabase, AWS RDS)
- Conta/credenciais Google para OAuth (Client ID / Client Secret)
- Servidor SMTP para envio de emails (ou serviço como SendGrid/Mailgun)

Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

- DATABASE_URL: string de conexão com PostgreSQL
- NEXTAUTH_URL: URL pública (ex.: http://localhost:3000)
- NEXTAUTH_SECRET: segredo longo para NextAuth
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: credenciais OAuth do Google
- EMAIL_SERVER_HOST / EMAIL_SERVER_PORT / EMAIL_SERVER_USER / EMAIL_SERVER_PASS / EMAIL_FROM: configuração SMTP
- EMAIL_SERVER_SECURE: "true" ou "false" (opcional)

Instalação (desenvolvimento)

1. Instale dependências

```bash
npm install --legacy-peer-deps
```

Observação: se houver conflito de peer-deps, o `--legacy-peer-deps` costuma resolver. Em ambientes onde preferir usar `pnpm` ou `yarn`, adapte o comando.

2. Gerar Prisma Client

```bash
npx prisma generate
```

3. Criar e aplicar migração inicial

```bash
npx prisma migrate dev --name init
```

Este comando cria a(s) tabela(s) no banco configurado em `DATABASE_URL` e atualiza `prisma/migrations`.

4. Rodar aplicação em desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000` por padrão.

Scripts úteis

- `npm run dev` — inicia Next.js em modo desenvolvimento
- `npm run build` — build da aplicação
- `npm run start` — inicia o servidor em produção
- `npm run prisma:generate` — gera Prisma Client
- `npm run prisma:migrate` — roda migrações (usa `prisma migrate dev`)

Prisma

- Schema em `prisma/schema.prisma`. Ele já contém os modelos usados pelo NextAuth (User, Account, Session, VerificationToken).
- Para adicionar modelos (ex.: Shop, Purchase, Coupon), atualize `schema.prisma`, gere o client (`npx prisma generate`) e crie nova migração (`npx prisma migrate dev --name add-coupons`).

NextAuth / Autenticação

- Configuração em `pages/api/auth/[...nextauth].js`.
- Provedores configurados: Google e Email (magic link).
- NEXTAUTH_SECRET deve ser definido com uma string segura. Você pode gerar uma com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Emails e Magic Links

- A função de envio de emails está em `lib/email.js` usando Nodemailer. Configure seu SMTP no `.env`.
- Em produção, considere provedores com boa entregabilidade (SendGrid, Mailgun, Amazon SES) ou um SMTP dedicado.

Migrações e Shadow DB

- Em ambientes CI/produção, você pode precisar de um `DATABASE_URL_SHADOW` para migrações com Prisma quando usar bancos gerenciados que exigem isolamento.

Deploy

- Vercel: recomendado para Next.js — configure as variáveis de ambiente no dashboard do projeto.
- Outras opções: Docker + VPS, Railway, Render, Fly.io.

Exemplo rápido (Vercel)

1. Crie um projeto no Vercel apontando para este repositório.
2. Defina variáveis de ambiente no painel:
   - `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EMAIL_SERVER_*`, `EMAIL_FROM`.
3. Deploy automático ao push na branch `main`.

Observações e troubleshooting

- Erro ao instalar `@prisma/client`: pode ser causado por versões lockadas ou registry; verifique `npm config get registry` e que o registry está acessível.
- Se encontrar problemas com peer-deps, tente `npm install --legacy-peer-deps` ou use `pnpm`.

Segurança

- Nunca comite `.env` com segredos reais.
- Use HTTPS em produção e configure HTTP headers adequados.
- Rotacione `NEXTAUTH_SECRET` se houver suspeita de vazamento (isso invalidará sessões existentes).

Próximos passos técnicos sugeridos

- Modelagem de dados para Shops / Purchases / Coupons (posso criar os modelos e as migrações).
- Endpoints API para registrar compras, listar cupons e validar/resgatar cupom.
- Painel administrativo para lojas.

---

Se quiser, eu crio agora os modelos Prisma para Lojas, Compras e Cupons e gero a migração (posso aplicar automaticamente se você confirmar).
