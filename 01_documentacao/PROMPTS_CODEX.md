# PROMPTS_CODEX.md
## Instruções iniciais para Codex / Claude Code

> **LEIA ESTE ARQUIVO PRIMEIRO.** Você é o agente responsável por construir o produto **Oi Nora** — uma plataforma SaaS B2B brasileira de Recrutamento & Seleção + Gestão de Pessoas + Jurídico Trabalhista. Este documento define o que você precisa saber para começar.

---

## 1. Contexto do produto

**Oi Nora** é uma consultoria/SaaS brasileira que atende **empresas-clientes** (com foco inicial em construção civil — empresas de 50 a 500 empregados) oferecendo:

- **Recrutamento & Seleção** (ATS completo)
- **Gestão de Pessoas** (ficha do empregado, folha, ponto, férias, treinamentos)
- **Jurídico Trabalhista** (gestão de processos, cálculo de risco, integração com ex-empregados)
- **Headcount & Quadro de Posições** (gestão orçamentária de pessoas)

A plataforma é **multi-tenant**: a Oi Nora atende múltiplas empresas-clientes, cada uma com sua base de dados isolada via RLS.

**Personagens do universo (use nos seeds):**
- **Cláudia Vasconcelos** — CEO da Oi Nora (super_admin)
- **Roberto Aurora** — Dir. RH da Construtora Aurora (owner do tenant Aurora)
- **Fernando Lacerda Costa** — Eng. Civil Sr. da Aurora (empregado · MAT 0112)
- **Paula Marques Souza** — Coord. RH admitida 26/05/2026 (em onboarding)
- **Letícia Ferraz Almeida** — candidata vaga afirmativa #2026-0042
- **Dr. Henrique Vasconcellos** — advogado terceirizado (Vasconcellos & Associados)
- **José Roberto Pinheiro** — ex-pedreiro com processo trabalhista em curso

---

## 2. Stack obrigatória

### Frontend
- **Next.js 15** (App Router, Server Components, Server Actions)
- **React 19** (incluindo `useActionState`, `useOptimistic`)
- **TypeScript 5.x** (modo strict)
- **CSS Modules + Design Tokens** (sem Tailwind, sem shadcn — manter identidade Book Antiqua/laranja/marinho do protótipo)
- **Radix UI Primitives** (`@radix-ui/react-dialog`, `react-popover`, `react-select`, `react-tabs`, etc.) — apenas headless, estilizados com nosso CSS
- **Lucide React** para ícones
- **Recharts** para gráficos
- **date-fns** + locale `pt-BR` para datas
- **zod** para validação de schemas
- **next-safe-action** para Server Actions tipadas

### Backend / Dados
- **Supabase**:
  - PostgreSQL 16
  - Auth (email/senha + magic link + SSO via Google/Microsoft)
  - Row Level Security (RLS) obrigatória em TODAS as tabelas
  - Storage (documentos, CVs, holerites em PDF, peças jurídicas)
  - Realtime (chat, notificações)
  - **pgvector** habilitado para embeddings de IA
- **Prisma** como ORM (gera tipos TypeScript a partir do schema Supabase)

### IA
- **Anthropic Claude API** (`@anthropic-ai/sdk`):
  - `claude-opus-4-7` para análise jurídica complexa (cálculo de risco, sugestão de acordo)
  - `claude-sonnet-4-6` para sugestões de RH (descrição de vaga, feedback)
  - `claude-haiku-4-5` para classificação rápida (triagem de CV, categorização de processos)
- **Voyage AI** (`voyage-3` ou `voyage-3-large`) para embeddings
- **pgvector** para busca semântica (currículos similares, processos similares)
- **Streaming responses** via Server-Sent Events para chat e relatórios

### Pagamentos & Billing
- **Stripe** (Subscriptions + Customer Portal)
- 3 planos: **Essencial** (R$ 990/mês até 30 emp), **Profissional** (R$ 2.490/mês até 100 emp), **Premium** (R$ 4.990/mês até 500 emp)

### Integrações externas (deixar abstraídas atrás de adapters)
- **eSocial** (S-1200 folha, S-2200 admissão, S-2210 SST, S-2299 desligamento) → gateway Pinhais ou Tagplus
- **Sienge ERP** (construção civil — sincronização de centros de custo, medições)
- **PJe / e-SAJ** (consulta de andamentos processuais — opcional fase posterior)
- **DataValid** ou **Serpro** (validação de CPF, NIS, biometria facial para ponto)
- **Resend** ou **Postmark** para emails transacionais

### Hospedagem
- **Netlify** com Next.js Runtime (suporta App Router, Server Components, Edge Functions)
- **Supabase** hospedado (free tier para dev, Pro para produção)
- **Stripe** hospedado
- **CDN** para assets estáticos (logo, ícones, fonte Book Antiqua via Adobe Fonts ou self-hosted)

---

## 3. Princípios de arquitetura

### Multi-tenancy
- Cada **empresa-cliente** = um tenant
- Todas as tabelas de domínio têm coluna `tenant_id UUID NOT NULL`
- RLS isola dados por `tenant_id` baseado em `auth.uid()` e `tenant_membership`
- Super admin (Oi Nora) tem acesso cross-tenant via policy específica

### Autenticação & Autorização
- **10 papéis (roles)**:
  1. `super_admin` (Oi Nora interna)
  2. `recrutador_oinora` (atende vários tenants)
  3. `owner` (cliente · dono do tenant)
  4. `admin` (cliente · admin do tenant)
  5. `gestor` (cliente · líder de equipe)
  6. `hr_ops` (cliente · operações de RH)
  7. `empregado` (cliente · funcionário)
  8. `candidato` (externo · sem tenant)
  9. `advogado_externo` (escritório terceirizado · atende vários tenants)
  10. `advogado_interno` (cliente · advogado CLT do tenant)
- Permissões granulares definidas em `MATRIZ_PERMISSOES.md`

### Acessibilidade
- **WCAG 2.1 AA** obrigatório
- Contraste mínimo 4.5:1 (já testado no protótipo)
- Navegação por teclado completa
- ARIA labels em todos os interativos
- Texto alternativo em todas as imagens

### Mobile-first
- 80% dos empregados em obra acessam por celular
- Telas de **bater ponto**, **holerite**, **férias**, **comunicados** devem ser mobile-first
- Considerar PWA (Service Worker para funcionar offline em canteiro com sinal fraco)

### Compliance
- **LGPD**: todas as ações sobre dados pessoais devem ser logadas em `audit_log`
- **eSocial**: timestamps em hora oficial de Brasília (TZ `America/Sao_Paulo`)
- **CPC 25**: classificação contábil de processos (provisões trabalhistas)
- **CCT**: convenções coletivas configuráveis por empresa (ex: SINTRAICCMG para Aurora)

---

## 4. Ordem de implementação (resumo · ver ROADMAP_IMPLEMENTACAO.md para detalhes)

| Fase | Sprint | Conteúdo |
|---|---|---|
| **MVP 1** | 1-2 sem | Auth + Multi-tenant + Empresas + Empregados + Ficha + Audit log |
| **MVP 2** | 2-3 sem | Recrutamento (vagas + candidatos + ATS + Portal candidato) + Wizard de vaga |
| **MVP 3** | 3-4 sem | Onboarding + Treinamentos + Trilhas + Headcount + Movimentações |
| **MVP 4** | 2-3 sem | Ponto eletrônico + Folha de pagamento + eSocial básico |
| **MVP 5** | 2-3 sem | Jurídico Trabalhista (3 modelos de advogado) + Cálculo de risco IA |
| **MVP 6** | 1-2 sem | Console Oi Nora (admin global) + Billing Stripe + Plans |

---

## 5. Padrões de código

### Estrutura de pastas

```
/oinora
├── /app                          ← Next.js App Router
│   ├── /(auth)                   ← group de rotas públicas
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── /(rh)                     ← group autenticado · RH
│   │   ├── empregados/page.tsx
│   │   ├── empregados/[id]/page.tsx
│   │   ├── folha/page.tsx
│   │   ├── ponto/page.tsx
│   │   └── layout.tsx            ← shell com sidebar marinho
│   ├── /(juridico)               ← group autenticado · Jurídico
│   │   ├── processos/page.tsx
│   │   ├── processos/[cnj]/page.tsx
│   │   └── layout.tsx            ← shell com sidebar roxo
│   ├── /(candidato)              ← group autenticado · candidato externo
│   │   └── portal/page.tsx
│   ├── /(empregado)              ← group autenticado · empregado
│   │   └── meus-dados/page.tsx
│   ├── /(oinora)                 ← group · Oi Nora interno
│   │   └── console/page.tsx
│   ├── /api                      ← Route Handlers (webhooks Stripe, eSocial)
│   │   ├── webhook/stripe/route.ts
│   │   └── webhook/esocial/route.ts
│   └── layout.tsx                ← root layout (font Book Antiqua)
│
├── /lib
│   ├── /supabase                 ← client + server + middleware
│   ├── /ai                       ← Claude API + Voyage embeddings
│   │   ├── client.ts             ← Anthropic SDK instance
│   │   ├── prompts.ts            ← prompts versionados
│   │   └── nora.ts               ← interface "Nora·IA"
│   ├── /esocial                  ← adapter eSocial
│   ├── /stripe                   ← billing
│   ├── /db                       ← Prisma client
│   └── /utils                    ← helpers (CPF, CNPJ, CNJ, datas BR)
│
├── /components
│   ├── /ui                       ← primitivos Radix + estilo Oi Nora
│   │   ├── Button/Button.tsx
│   │   ├── Button/Button.module.css
│   │   ├── Dialog/...
│   │   ├── Tabs/...
│   │   ├── DataTable/...
│   │   └── ...
│   ├── /shell                    ← sidebars, topbars, breadcrumbs
│   ├── /domain                   ← componentes de domínio
│   │   ├── EmpregadoCard/
│   │   ├── ProcessoCard/
│   │   ├── VagaCard/
│   │   └── ...
│   └── /charts                   ← Recharts wrappers
│
├── /server
│   ├── /actions                  ← Server Actions tipadas
│   │   ├── empregados.ts
│   │   ├── folha.ts
│   │   ├── processos.ts
│   │   └── ...
│   └── /queries                  ← funções de query reutilizáveis
│
├── /styles
│   ├── tokens.css                ← design tokens (cores, fontes, espaçamentos)
│   ├── globals.css               ← reset + base
│   └── fontes.css                ← Book Antiqua + UI sans
│
├── /supabase
│   ├── /migrations               ← SQL versionado
│   ├── /functions                ← Edge Functions (eSocial, IA cron jobs)
│   └── seed.sql                  ← dados iniciais (Aurora + 128 empregados)
│
├── /public
│   ├── /logo/LOGO_OI_NORA.png
│   └── /fonts/BookAntiqua-*.woff2
│
└── /prototipo                    ← HTML do protótipo visual (referência apenas)
    └── *.html
```

### Convenções

- **TypeScript strict mode** em tudo
- **Server Components por padrão**, Client Components só quando necessário (`'use client'` no topo)
- **Server Actions** para todas as mutations (com `next-safe-action` para validação Zod)
- **CSS Modules** com prefixo `.<componente>__<elemento>` (BEM-like)
- **Design tokens** em `:root` (cores, fontes, espaçamentos)
- **Datas sempre em UTC no banco**, conversão para `America/Sao_Paulo` na UI
- **Valores monetários em centavos** (BIGINT) no banco, formatação na UI
- **CPF/CNPJ/CNJ sem máscara** no banco, com máscara na UI (utilitários em `/lib/utils/br.ts`)

### Padrão de Server Action

```typescript
// /server/actions/empregados.ts
'use server';
import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const criarEmpregadoSchema = z.object({
  cpf: z.string().length(11),
  nome: z.string().min(3),
  cargo_id: z.string().uuid(),
  salario_centavos: z.number().int().positive(),
});

export const criarEmpregado = actionClient
  .schema(criarEmpregadoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const empregado = await db.empregado.create({
      data: {
        ...parsedInput,
        tenant_id: ctx.tenant_id,
        criado_por: ctx.user_id,
      },
    });

    await db.auditLog.create({
      data: {
        acao: 'empregado.criar',
        recurso_id: empregado.id,
        tenant_id: ctx.tenant_id,
        usuario_id: ctx.user_id,
      },
    });

    revalidatePath('/empregados');
    return { sucesso: true, id: empregado.id };
  });
```

---

## 6. Identidade visual obrigatória

Preservar **exatamente** a identidade do protótipo HTML:

```css
:root {
  /* Cores · NÃO ALTERAR */
  --laranja: #E8633A;
  --laranja-esc: #C94E28;
  --laranja-cl: #FDF1EC;
  --marinho: #1F2A44;
  --marinho-esc: #131B2E;
  --marinho-med: #3B4A6B;
  --papel: #FAF7F2;
  --branco: #FFFFFF;
  --cinza: #5C6478;
  --cinza-cl: #E8E4DC;
  --cinza-fundo: #F2EEE6;
  --verde: #2D7D5A;
  --vermelho: #C44545;
  --amarelo: #D4A02C;
  --roxo: #7E5BCC;
  --juridico: #5B3FA0;

  /* Fontes · NÃO ALTERAR */
  --serif: "Book Antiqua", "Palatino Linotype", Palatino, Georgia, serif;
  --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}
```

**Padrões visuais**:
- Logo: `<span class="oi">Oi</span><span class="nora">Nora</span>` (oi laranja itálico + Nora cor da página)
- Sidebar RH: marinho
- Sidebar Jurídico: roxo (#5B3FA0)
- Headers com `border-bottom` discreto
- Cards `.painel` com `border: 1px solid var(--cinza-cl)` e `border-radius: 2px` (cantos quase retos · não usar 8px ou 12px)
- Emphasis `em` em itálico colorido (laranja ou roxo dependendo do contexto)
- Tags coloridas com formato `.tag.laranja`, `.tag.verde`, etc.
- KPIs grandes com `font-family: serif` itálico (números como manuscritos)

---

## 7. Primeira tarefa do agente

Quando o agente começar, deve executar nesta ordem:

1. **Ler todos os arquivos `.md` em `/01_documentacao`** (este, MODELO_DE_DADOS, MATRIZ_PERMISSOES, MODULOS_E_PLANOS, ROADMAP, BRIEFING)
2. **Abrir `/02_prototipo_visual/00_indice.html`** no navegador para entender as 17 telas
3. **Inspecionar 3 telas-chave do protótipo**: `10_ficha_empregado.html`, `11_folha_pagamento.html`, `17_juridico_trabalhista.html` para internalizar o padrão visual
4. **Criar o projeto Next.js 15** com `npx create-next-app@latest oinora --typescript --app --no-tailwind --no-src-dir`
5. **Configurar Supabase**: criar projeto, rodar migrations de `MODELO_DE_DADOS.md`, inserir seed inicial
6. **Configurar design tokens** em `/styles/tokens.css` com as cores e fontes acima
7. **Executar MVP 1** conforme ROADMAP

---

## 8. Conventions de IA (Nora·IA)

Toda interação com Claude API deve passar por `/lib/ai/nora.ts`. Não chamar `anthropic.messages.create()` diretamente nas Server Actions.

### Prompts versionados em `/lib/ai/prompts.ts`

```typescript
export const PROMPTS = {
  triagem_curriculo_v1: {
    model: 'claude-haiku-4-5-20251001',
    system: `Você é um analista de RH brasileiro. Avalie currículos para vagas...`,
    schema: TriagemSchema,
  },
  calculo_risco_processo_v1: {
    model: 'claude-opus-4-7',
    system: `Você é um advogado trabalhista brasileiro especialista em construção civil...`,
    schema: RiscoSchema,
  },
  sugestao_acordo_v1: {
    model: 'claude-opus-4-7',
    system: `Você analisa processos trabalhistas e sugere acordos...`,
    schema: AcordoSchema,
  },
  // ...
};
```

### Cases de uso de IA no produto

| Módulo | Use case | Modelo | Volume estimado |
|---|---|---|---|
| Recrutamento | Triagem de CV | Haiku | 500/mês |
| Recrutamento | Sugestão de descrição de vaga | Sonnet | 50/mês |
| Recrutamento | Match candidato-vaga (embeddings) | Voyage | 1000/mês |
| Onboarding | Resumir histórico do empregado | Haiku | 100/mês |
| Folha | Detectar anomalias na folha | Sonnet | 12/ano |
| Jurídico | Cálculo de risco financeiro | Opus | 200/mês |
| Jurídico | Sugestão de acordo | Opus | 50/mês |
| Jurídico | Similaridade entre processos (RAG) | Voyage + Opus | 200/mês |
| Headcount | Análise de quadro e projeção | Sonnet | 12/ano |
| Avaliação | Sugestão de feedback construtivo | Sonnet | 200/ciclo |
| Geral | Chat "fale com a Nora" | Sonnet streaming | ilimitado |

### Custo estimado mensal (para Aurora · plano Premium)

- Claude Haiku 4.5: ~R$ 30/mês
- Claude Sonnet 4.6: ~R$ 90/mês
- Claude Opus 4.7: ~R$ 250/mês
- Voyage embeddings: ~R$ 40/mês
- **Total IA**: ~R$ 410/mês por empresa-cliente Premium

Esse custo está embutido no plano Premium (R$ 4.990/mês). Margem ~92% mesmo com IA.

---

## 9. O que NÃO fazer

- ❌ Não usar Tailwind CSS (decisão de design — manter CSS próprio com Book Antiqua)
- ❌ Não usar shadcn/ui (usar apenas Radix headless)
- ❌ Não chamar Anthropic API direto de Client Components (sempre via Server Action)
- ❌ Não armazenar segredos em código (usar `.env.local` + Netlify env vars)
- ❌ Não criar tabela sem RLS habilitado
- ❌ Não esquecer auditoria em ações sobre dados pessoais
- ❌ Não usar `any` em TypeScript (`strict: true`)
- ❌ Não fazer query no banco sem `tenant_id` no filtro
- ❌ Não confiar no client para autorização (sempre validar no servidor)
- ❌ Não usar Date.now() para timestamps oficiais (usar `new Date().toISOString()` e converter ao mostrar)

---

## 10. Suporte

Se este agente tiver dúvidas sobre regras de negócio, consultar:
- **Briefing técnico**: `BRIEFING_TECNICO.md`
- **Schema do banco**: `MODELO_DE_DADOS.md`
- **Permissões**: `MATRIZ_PERMISSOES.md`
- **Módulos e planos**: `MODULOS_E_PLANOS.md`
- **Roadmap**: `ROADMAP_IMPLEMENTACAO.md`

Em caso de ambiguidade, **deixar TODO comentado no código** e seguir a interpretação mais conservadora. Não inventar regras de negócio brasileiras (CCT, eSocial, NRs) — usar exatamente como descrito nos docs ou pesquisar fonte oficial (gov.br).

---

**Bom trabalho. Construa um produto que faria a Cláudia Vasconcelos orgulhosa.**

🤖 Oi Nora · v1.0 · 2026
