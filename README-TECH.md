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
- Para adicionar novos modelos (ex.: Shop, Purchase, Coupon), atualize `schema.prisma`, gere o client (`npx prisma generate`) e crie nova migração (`npx prisma migrate dev --name add-models`).

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

- Modelagem de dados para futuras funcionalidades (Shops, Purchases, Coupons).
- Endpoints API para registrar compras, listar cupons e validar/resgatar cupom.
- Painel administrativo para lojas.

---

## Arquitetura e Implementação Técnica

### Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js    # Configuração NextAuth (App Router)
│   │   ├── countries/route.js             # API de países para WhatsApp
│   │   └── profile/                       # API de perfil do usuário
│   │       └── route.js
│   ├── globals.css                        # Estilos globais
│   ├── layout.js                          # Layout global (header/footer fixos)
│   ├── page.js                            # Página inicial
│   └── profile/
│       └── page.js                        # Página de perfil/cadastro
├── lib/
│   ├── auth.js                            # Configuração NextAuth
│   └── prisma.js                          # Cliente Prisma
└── prisma/
    └── schema.prisma                      # Schema do banco de dados
```

### APIs Implementadas

#### `/api/auth/[...nextauth]`

- **Framework**: NextAuth.js 4.22.1
- **Provedores**: Google OAuth, Magic Link (Email)
- **Adaptador**: Prisma Adapter
- **Sessões**: Database sessions com JWT

#### `/api/profile`

- **GET**: Retorna dados do perfil do usuário autenticado
- **PUT**: Atualiza perfil com validações completas
- **Validações**:
  - Nome: obrigatório, mínimo 2 caracteres
  - CPF: obrigatório, algoritmo de validação brasileiro completo
  - Data de nascimento: obrigatório, idade 18-120 anos
  - WhatsApp: opcional com máscara por país

#### `/api/countries`

- **GET**: Lista de países com códigos DDI para WhatsApp
- **Formato**: JSON com campos `ddi` e `pais`

### Validações Técnicas

#### Algoritmo de Validação CPF

```javascript
function isValidCPF(cpf) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, "");

  // Verifica 11 dígitos e não todos iguais
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  // Cálculo dos dígitos verificadores
  // Primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  // Segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}
```

### Componentes e Funcionalidades

#### Layout Global (`layout.js`)

- **Header Fixo**: Navegação com logo e links condicionais
- **Footer Fixo**: Copyright e informações da plataforma
- **Responsividade**: Layout centralizado com max-width 1200px
- **Espaçamento**: Margens automáticas para conteúdo (80px top, 60px bottom)

#### Formulários

- **InputMask**: Para CPF (`999.999.999-99`) e telefone
- **Validação**: Frontend e backend com mensagens específicas
- **Estado**: useState para gerenciamento de formulários
- **Feedback**: Exibição de erros em caixa vermelha estilizada

#### Autenticação

- **Proteção de Rotas**: `getServerSession` em APIs
- **Redirecionamento**: Condicional baseado em estado de autenticação
- **Fallback**: Dados de sessão como backup para perfil

### Estilos e UI

- **CSS-in-JS**: Estilos inline para componentes
- **Paleta de Cores**:
  - Primária: `#007bff` (azul)
  - Secundária: `#dc3545` (vermelho)
  - Sucesso: `#28a745` (verde)
  - Cinza: `#6c757d`
- **Layout**: Flexbox para responsividade
- **Tipografia**: Arial como fonte padrão

### Banco de Dados (Prisma Schema)

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  fullName          String?
  birthDate         DateTime?
  cpf               String?  @unique
  whatsapp          String?
  whatsappCountryCode String? @default("55")
  whatsappConsent   Boolean? @default(false)
  emailVerified     DateTime?
  accounts          Account[]
  sessions          Session[]
}

// Modelos NextAuth (Account, Session, VerificationToken) incluídos automaticamente
```

### Desenvolvimento e Build

#### Scripts do Package.json

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

#### Dependências Principais

```json
{
  "@next-auth/prisma-adapter": "^1.0.5",
  "@prisma/client": "^6.18.0",
  "next": "^14.0.0",
  "next-auth": "^4.22.1",
  "nodemailer": "^6.9.4",
  "pg": "^8.11.0",
  "prisma": "^6.18.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-input-mask": "^2.0.4"
}
```

### Segurança e Boas Práticas

- **Validação de Input**: Tanto no frontend quanto backend
- **Sanitização**: Remoção de caracteres especiais onde necessário
- **Autenticação**: Sessões seguras com NextAuth
- **HTTPS**: Recomendado para produção
- **Variáveis de Ambiente**: Segredos nunca no código

### Performance

- **Next.js 14**: App Router com otimizações automáticas
- **Build Estático**: Páginas estáticas onde possível
- **Lazy Loading**: Componentes carregados sob demanda
- **Bundle Size**: Otimizado com tree-shaking

### Testes e Qualidade

- **Build**: Verificação automática em CI/CD
- **Linting**: ESLint configurado (quando disponível)
- **TypeScript**: Verificação de tipos (planejado)
- **Testes**: Estrutura preparada para testes unitários

---

---

_Última atualização: Outubro 2025_

## Debugging e Monitoramento

### Logs de Desenvolvimento

- **NextAuth Debug**: Habilitado automaticamente em desenvolvimento
- **Prisma Logging**: Queries, erros e warnings logados em dev
- **Health Check**: Endpoint `/api/health` para verificar conectividade

### Troubleshooting de Autenticação

#### Problema: "Try signing in with a different account"

**Possíveis causas:**

- Erro na criação do usuário no banco
- Conflito com usuário existente
- Problemas de conexão com o banco

**Soluções:**

1. Verificar logs do Vercel/NextAuth
2. Testar endpoint `/api/health`
3. Verificar variáveis de ambiente no Vercel
4. Reset do banco se necessário

#### Problema: "cached plan must not change result type"

**Causa:** Inconsistência entre schema e banco
**Solução:**

```bash
npx prisma db push --force-reset
npx prisma generate
```

#### Verificação de Deploy

1. **Health Check**: `GET /api/health`
2. **Logs do Vercel**: Verificar function logs
3. **Variáveis de Ambiente**: Confirmar todas configuradas
4. **Banco**: Verificar conexão e tabelas</content>
   <parameter name="oldString">---

Se quiser, eu crio agora os modelos Prisma para Lojas, Compras e Cupons e gero a migração (posso aplicar automaticamente se você confirmar).
