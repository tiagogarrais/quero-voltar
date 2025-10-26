# Quero Voltar

Quero Voltar é uma plataforma para gerar novas visitas a lojas físicas oferecendo cupons de desconto vinculados a compras.

Visão geral

- Ao efetuar uma compra, a loja cadastra/gera um cupom para o cliente.
- O cupom só fica disponível para uso a partir do próximo dia.
- A validade do cupom é definida pela loja (por exemplo: 7 dias).
- O cupom pode ser um desconto em valor, em percentual, ou um brinde.

Objetivo

Facilitar a recompra e o tráfego para lojas físicas, aumentando retenção por meio de incentivos que chegam ao cliente após a compra.

Funcionalidades previstas nesta versão inicial

- Autenticação de usuários: NextAuth com Google e magic links por email.
- Persistência: PostgreSQL com Prisma.
- Envio de emails (magic links e notificações de cupom): Nodemailer (configurável via SMTP).
- API mínima para registro de compras e geração de cupons.

Tech stack

- Next.js (frontend + API routes)
- NextAuth.js (autenticação)
- Prisma + PostgreSQL (ORM e banco de dados)
- Nodemailer (envio de emails)

# Quero Voltar

Quero Voltar é uma plataforma para gerar novas visitas a lojas físicas oferecendo cupons de desconto vinculados a compras.

Visão geral

- Ao efetuar uma compra, a loja cadastra/gera um cupom para o cliente.
- O cupom só fica disponível para uso a partir do próximo dia.
- A validade do cupom é definida pela loja (por exemplo: 7 dias).
- O cupom pode ser um desconto em valor, em percentual, ou um brinde.

Objetivo

Facilitar a recompra e o tráfego para lojas físicas, aumentando retenção por meio de incentivos que chegam ao cliente após a compra.

Funcionalidades previstas nesta versão inicial

- Autenticação de usuários: NextAuth com Google e magic links por email.
- Persistência: PostgreSQL com Prisma.
- Envio de emails (magic links e notificações de cupom): Nodemailer (configurável via SMTP).
- API mínima para registro de compras e geração de cupons.

Tech stack

- Next.js (frontend + API routes)
- NextAuth.js (autenticação)
- Prisma + PostgreSQL (ORM e banco de dados)
- Nodemailer (envio de emails)

Instalação local (resumo)

1. Copie e preencha as variáveis de ambiente:

```bash
cp .env.example .env
# edite .env com suas credenciais (Postgres, Google OAuth, SMTP, NEXTAUTH_SECRET)
```

2. Instale dependências:

```bash
npm install --legacy-peer-deps
```

3. Gere o cliente Prisma:

```bash
npx prisma generate
```

4. Crie e aplique a migração inicial:

```bash
npx prisma migrate dev --name init
```

5. Rode em desenvolvimento:

```bash
npm run dev
```

Configurações importantes

- Google OAuth: crie credenciais no Google Cloud Console e adicione o redirect URI
  `http://localhost:3000/api/auth/callback/google`.
- SMTP (Nodemailer): configure `EMAIL_SERVER_*` no `.env` para que magic links e notificações de
  cupom possam ser enviados.
- NEXTAUTH_SECRET: use uma string longa aleatória em produção.

Banco de dados / Prisma

- O schema Prisma já inclui os modelos necessários para NextAuth (User, Account, Session, VerificationToken).
- Adicione modelos extras para representar Lojas, Compras e Cupons conforme a necessidade — posso ajudar com isso.

API e fluxo de cupons (alta nível)

1. Loja registra/valida uma compra via API (rota protegida por autenticação/credenciais de loja).
2. Backend gera um registro de cupom ligado ao cliente e à compra, com os campos:
   - tipo (valor, percentual, brinde)
   - valor ou descrição
   - dataDisponivel (próximo dia)
   - dataExpiracao (definida pela loja)
   - código único
3. Quando o cupom fica disponível (ou por push/cron), o cliente recebe uma notificação por email com o cupom
   e instruções para uso na loja física.

Próximos passos sugeridos (posso fazer para você)

- Modelagem do Prisma para Lojas, Compras e Cupons + migração.
- Endpoints API para:
  - registrar compras (webhook/manual)
  - listar cupons do cliente
  - validar cupom (usada pela loja no ponto de venda)
- Páginas de administração para lojas (criar cupons manualmente, ver status) e painel do cliente.
- Integração com provedores de email em produção (SendGrid, Mailgun) ou uso de provedores SMTP confiáveis.

Contribuindo

Abra issues ou PRs com melhorias. Se quiser que eu implemente algum dos próximos passos, diga qual e eu continuo.

Licença

Veja `LICENSE.md` no repositório.

Contato
