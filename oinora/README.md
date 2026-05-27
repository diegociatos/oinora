# Oi Nora · app

Aplicação Next.js 16 + React 19 + Supabase da plataforma **Oi Nora** — SaaS B2B brasileira que integra Recrutamento, Gestão de Pessoas, Folha, Ponto e Jurídico Trabalhista.

> **Documentação de produto, schema de banco e roadmap** estão em [`../01_documentacao/`](../01_documentacao/).
> **Protótipo visual** de referência em [`../02_prototipo_visual/`](../02_prototipo_visual/).

## Status

- ✅ **MVP 0** — Setup técnico + landing institucional
- ⬜ **MVP 1** — Auth + multi-tenant + CRUD empregados
- ⬜ **MVP 2** — Recrutamento (ATS + portal candidato)
- ⬜ **MVP 3** — Gestão de Pessoas (onboarding + treinamentos + headcount)
- ⬜ **MVP 4** — Folha & Ponto + eSocial
- ⬜ **MVP 5** — Jurídico Trabalhista + IA cálculo de risco
- ⬜ **MVP 6** — Console Oi Nora + Stripe billing

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Estilo | CSS Modules + Design Tokens (fonte Book Antiqua) |
| Backend | Supabase (PG 16 + Auth + RLS + Storage + pgvector) |
| ORM | Prisma |
| IA | Anthropic Claude API (Opus 4.7 / Sonnet 4.6 / Haiku 4.5) + Voyage embeddings |
| Billing | Stripe Subscriptions |
| Email | Resend |
| Hospedagem | Netlify |

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local preenchendo os valores reais

# 3. Subir dev server
npm run dev

# 4. Abrir
# http://localhost:3000
```

## Scripts

- `npm run dev` — dev server com Turbopack
- `npm run build` — build de produção
- `npm run start` — serve build de produção
- `npm run lint` — ESLint

## Identidade visual

Cores e fontes em [`styles/tokens.css`](./styles/tokens.css). **NÃO ALTERAR sem aprovação**:

- Laranja `#E8633A` · Marinho `#1F2A44` · Roxo Jurídico `#5B3FA0`
- Fonte serif: Book Antiqua → Palatino → Georgia
- Cards com `border-radius: 2px` (cantos quase retos)

## Deploy

Push em `main` → deploy automático em Netlify.
