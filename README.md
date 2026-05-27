# 🧡 Oi Nora · Pacote de Handoff

> **Para o sócio que vai abrir isto agora**: este é o pacote completo para construir a Oi Nora — plataforma SaaS B2B de Recrutamento + Gestão de Pessoas + Folha + Ponto + Jurídico Trabalhista. Você tem aqui **17+3 telas funcionais** em HTML para mostrar aos sócios, **6 documentos técnicos** para entregar ao Codex/Claude Code, e **uma estrutura pronta** para virar produto real em ~4 meses.

---

## 📦 O que tem nesta pasta

```
oinora_handoff/
├── 📄 README.md                          ← você está aqui
│
├── 📁 01_documentacao/                   ← PARA O CODEX/CLAUDE CODE
│   ├── PROMPTS_CODEX.md                  · Instruções iniciais (LEIA PRIMEIRO!)
│   ├── MODELO_DE_DADOS.md                · Schema Supabase completo
│   ├── ROADMAP_IMPLEMENTACAO.md          · 7 fases · 13-19 semanas
│   ├── MATRIZ_PERMISSOES.md              · 10 papéis + RLS
│   ├── MODULOS_E_PLANOS.md               · 18 módulos + pricing
│   ├── BRIEFING_TECNICO.md               · Negócio + integrações BR
│   └── ROTEIRO_APRESENTACAO.md           · Script 20min para sócios
│
├── 📁 02_prototipo_visual/               ← PARA OS SÓCIOS
│   ├── 00_indice.html                    · ENTRY POINT · abra primeiro
│   ├── 00_login.html
│   ├── 01_portal_candidato.html          · Letícia se candidatando
│   ├── 02_empresa_recrutamento.html      · Mariana no ATS
│   ├── 03_empresa_gestao_pessoas.html    · Roberto na RH
│   ├── 04_area_empregado.html            · Fernando empregado
│   ├── 05_console_oinora.html            · Cláudia como CEO
│   ├── 06_avaliacao_pesquisas_analytics.html
│   ├── 07_gerenciar_usuarios.html
│   ├── 08_modulos_planos.html
│   ├── 09_wizard_vaga.html               · Criando vaga afirmativa
│   ├── 10_ficha_empregado.html           · Ficha do Fernando
│   ├── 11_folha_pagamento.html           · Folha R$ 2.789K
│   ├── 12_ponto_eletronico_rh.html       · Geofence + biometria
│   ├── 13_configuracoes_empresa.html     · Setup Aurora
│   ├── 14_onboarding.html                · Paula DIA 1
│   ├── 15_treinamentos_trilhas.html      · Trilha BIM Fernando
│   ├── 16_headcount_quadro.html          · Quadro autorizado vs preench.
│   ├── 17_juridico_trabalhista.html      · Dr. Henrique + processos
│   ├── 18_dashboard_executivo.html       · ★ NOVO · Roberto visão única
│   ├── 19_mobile_empregado.html          · ★ NOVO · App celular
│   ├── 20_avaliacao_9box.html            · ★ NOVO · 9-Box + PDI
│   └── diagrama_papeis.html              · Mapa visual dos 10 roles
│
└── 📁 03_assets/
    └── LOGO_OI_NORA.PNG                  · Logo original
```

**Total: 28 arquivos · ~2.0 MB**

---

## ⏱ Quero entender em 5 minutos

1. **Abra** `02_prototipo_visual/00_indice.html` no navegador
2. **Clique** no card destacado "★ Dashboard Executivo" (Tela 18)
3. **Veja** todos os módulos conectados em uma tela só

Em 5 minutos você entende o produto.

## ⏱ Quero apresentar para os sócios em 20 minutos

Abra **`01_documentacao/ROTEIRO_APRESENTACAO.md`**. Tem script slide-a-slide, com:
- 3 minutos por tela
- O que falar
- O que perguntar
- Tempo total: **20 minutos** ou **45 minutos** (versão estendida)

## ⏱ Quero entregar para o Codex/Claude Code agora

Veja a seção **"🤖 Como subir no Codex"** abaixo. Resumo:
1. Compacte a pasta inteira em `.zip`
2. Suba no Claude Code ou Codex
3. Diga: "Leia `01_documentacao/PROMPTS_CODEX.md` e siga as instruções"
4. O agente vai construir o produto seguindo o roadmap

---

## 👥 As 10 personas-chave

Antes de abrir qualquer tela, conheça quem está usando:

| # | Nome | Papel | Onde aparece |
|---|---|---|---|
| 1 | **Cláudia Vasconcelos** | CEO Oi Nora · super_admin | Console (Tela 05) |
| 2 | **Mariana Costa** | Recrutadora Sr Oi Nora · 142% meta | ATS (Tela 02), Wizard (Tela 09) |
| 3 | **Roberto Aurora** | Dir. RH Construtora Aurora · owner | Dashboard (Tela 18), Gestão (Tela 03) |
| 4 | **Carla Aurora** | Coord. RH · admin · mentora da Paula | Onboarding (Tela 14) |
| 5 | **Bruna Lima** | HR Ops · DP · folha e ponto | Folha (Tela 11), Ponto (Tela 12) |
| 6 | **Luísa Mendonça** | Dir. Engenharia · 22 liderados | 9-Box (Tela 20) |
| 7 | **Fernando Lacerda** | Eng. Civil Sr · ★ Estrela 9-Box | Ficha (Tela 10), Trilhas (Tela 15), Mobile (Tela 19) |
| 8 | **Paula Marques** | Coord. RH admitida hoje (26/05) | Onboarding (Tela 14) |
| 9 | **Letícia Ferraz** | Candidata vaga afirmativa #2026-0042 | Portal (Tela 01) |
| 10 | **Dr. Henrique Vasconcellos** | Advogado terceirizado · 3 tenants | Jurídico (Tela 17) |

E como dramatizações:
- **José Roberto Pinheiro** — ex-pedreiro com audiência HOJE 14:30
- **Marcelo Andrade** — Eng. Civil com NR-18 vencida há 14 dias
- **João Sampaio** — ex-empregado que processou após sair em 15/05

---

## 🎬 Fluxo narrativo (a ordem ideal para apresentar)

```
📍 HOJE é terça, 26 de maio de 2026 · 08:42

1. Roberto chega ao trabalho → abre o Dashboard (Tela 18)
   • Vê: audiência em 5h, Paula DIA 1, Marcelo NR vencida
   • Decide: confirmar acordo com Dr. Henrique até 12h

2. Roberto checa pipeline (Tela 02) com Mariana
   • Letícia em proposta da vaga #2026-0042
   • Workflow de aprovação CFO acionado

3. Carla recebe Paula (Tela 14 · Onboarding)
   • Checklist DIA 1: 12 itens
   • S-2200 eSocial já enviado em 23/05

4. Bruna fecha conferência da folha (Tela 11)
   • R$ 2.789K · variação Fernando +18% explicada (banco horas)
   • 4-eyes: Bruna calcula → Carla confere

5. Fernando bate ponto no canteiro (Tela 19 · mobile)
   • Geofence Sítio II ✓ · NRs válidas ✓
   • Diferente do Marcelo: bloqueado por NR-18 vencida

6. Roberto faz calibração 9-Box (Tela 20)
   • Fernando aparece como ★ Estrela
   • Nora·IA sugere antecipar promoção e atribuir Vila Aurora

7. 14:30 · Roberto e Dr. Henrique na 1ª VT BH
   • Acordo R$ 80-110k (vs cenário realista R$ 186k)
   • Tela 17 mostra similaridade com processos passados

8. Final do dia · Cláudia (CEO Oi Nora) no Console (Tela 05)
   • Aurora: tenant Premium · MRR R$ 4.990
   • 24 outros tenants ativos · ARR projetado R$ 900K
```

**Tudo isso acontece no MESMO dia, com personagens que se conectam entre as telas.**

---

## 💰 Pricing & Posicionamento (resumo)

| Plano | Preço | Limite | Diferencial |
|---|---|---|---|
| **Essencial** | R$ 990/mês | 30 empregados | ATS + Empregados básico |
| **Profissional** | R$ 2.490/mês | 100 empregados | + Folha + Ponto + eSocial + Treinamentos |
| **Premium** ★ | R$ 4.990/mês | 500 empregados | + **Jurídico Trabalhista** + IA Nora completa |

**Add-ons disponíveis em todos os planos**: Jurídico R$ 990, Onboarding R$ 390, Treinamentos R$ 590, Avaliação R$ 490, Pesquisas R$ 390, etc.

**Posicionamento único**: Único produto BR que integra **Recrutamento + RH + Folha + Jurídico**. Foco em **construção civil** (50-300 empregados em SP/MG/RJ/PR/SC).

**Meta 12 meses**: 25 tenants · MRR R$ 75K · ARR R$ 900K.

---

## 🤖 Como subir no Codex / Claude Code

### Opção A: Tudo de uma vez

1. Compacte `oinora_handoff/` em `.zip`
2. Upload no Claude Code (ou Codex)
3. Mensagem inicial: 
   > "Leia o arquivo `01_documentacao/PROMPTS_CODEX.md` por completo. Depois inspecione `02_prototipo_visual/00_indice.html` para entender o escopo. Em seguida, comece pelo MVP 0 (setup) conforme `ROADMAP_IMPLEMENTACAO.md`."

### Opção B: Documentação primeiro, código depois

1. Suba apenas `01_documentacao/*.md`
2. Discuta com o agente: arquitetura, decisões técnicas, validações
3. Quando estiver alinhado, suba também o protótipo visual
4. Inicie o MVP 0

### Stack que o Codex vai usar (já decidida)

- **Frontend**: Next.js 15 + App Router + Server Components + TypeScript
- **Estilo**: CSS Modules + Design Tokens (preserva Book Antiqua)
- **UI primitives**: Radix UI headless
- **Backend**: Supabase (PG16 + Auth + RLS + Storage + pgvector)
- **ORM**: Prisma
- **IA**: Anthropic Claude API (Opus 4.7 + Sonnet 4.6 + Haiku 4.5) + Voyage embeddings
- **Pagamentos**: Stripe + 3 planos + Customer Portal
- **eSocial**: gateway Pinhais ou Tagplus
- **Hospedagem**: Netlify (Next.js runtime + Edge Functions)
- **Email**: Resend

---

## 🗄 Setup técnico inicial (resumo)

### 1. Criar projeto Supabase
```bash
# https://supabase.com/dashboard/new
# Salvar: SUPABASE_URL + SUPABASE_ANON_KEY + SERVICE_ROLE_KEY
```

### 2. Executar migrations (em ordem)
```bash
# Conteúdo em 01_documentacao/MODELO_DE_DADOS.md
# Executar via Supabase SQL Editor:
#   1. Extensões (uuid-ossp, pgcrypto, pgvector, pg_trgm)
#   2. Enums (role, plano, candidato_stage, etc.)
#   3. Tabelas (~45 tabelas em ordem de FK)
#   4. RLS policies
#   5. Triggers (set_atualizado_em, auditar)
```

### 3. Criar projeto Next.js 15
```bash
npx create-next-app@latest oinora --typescript --app --no-tailwind --no-src-dir --turbopack
cd oinora
npm install @supabase/supabase-js @prisma/client prisma @anthropic-ai/sdk \
  voyageai stripe @radix-ui/react-dialog @radix-ui/react-popover \
  @radix-ui/react-tabs zod next-safe-action date-fns recharts lucide-react resend
```

### 4. Configurar variáveis de ambiente
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
VOYAGE_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
ESOCIAL_GATEWAY_KEY=...  # Pinhais ou Tagplus
```

### 5. Criar projeto Netlify
```bash
# https://app.netlify.com
# Conectar GitHub repo
# Configurar Next.js Runtime
# Adicionar mesmas env vars
# Configurar domínio customizado (opcional)
```

### 6. Configurar Stripe
```bash
# https://dashboard.stripe.com
# Criar 3 produtos: Essencial, Profissional, Premium
# Configurar webhook endpoint: https://seu-dominio.com/api/webhook/stripe
# Anotar webhook secret
```

### 7. Rodar local
```bash
npm run dev
# Acessa http://localhost:3000
```

### 8. Deploy
```bash
git push origin main
# Netlify faz deploy automático
```

---

## ✅ Checklist antes de entregar ao Codex

- [ ] Logo Oi Nora em alta resolução (`03_assets/LOGO_OI_NORA.PNG`)
- [ ] Conta Anthropic com créditos (US$ 500+ recomendado para MVP)
- [ ] Conta Supabase (free tier OK para dev, Pro para prod)
- [ ] Conta Stripe (test mode)
- [ ] Conta Netlify (free tier OK)
- [ ] Conta Resend (free tier OK)
- [ ] Conta Voyage AI (US$ 50+ para embeddings)
- [ ] Domínio próprio (oinora.com.br ou similar)
- [ ] Gateway eSocial contratado (Pinhais R$ 0,50/evento ou Tagplus R$ 0,35)
- [ ] Decisão: hostear fonte Book Antiqua self-hosted ou usar alternativa (Palatino, EB Garamond, GFS Didot)

---

## 📞 Quando algo der errado

### Codex faz alguma coisa estranha?
- Verifique se ele leu **TODOS** os arquivos `.md` de `01_documentacao/`
- Especialmente `PROMPTS_CODEX.md` (instruções) e `MATRIZ_PERMISSOES.md` (RLS)
- Force releitura: "Releia `PROMPTS_CODEX.md` e me explique a stack obrigatória"

### Codex está inventando regra trabalhista?
- Aponte para `BRIEFING_TECNICO.md` seção 4 (Regras CLT)
- Force uso do helper `/lib/clt/regras.ts`
- Se persistir, mande consultar gov.br oficial

### Custo IA disparou?
- Veja `BRIEFING_TECNICO.md` seção 6 — descobrimos que Aurora Premium custa **R$ 1.846/mês** real (não R$ 410 estimado)
- 4 soluções propostas: cache, limites por plano, cobrança por excedente, ajustar preço

### Tela não bate com o protótipo?
- Mostre o HTML correspondente em `02_prototipo_visual/`
- Cores e Book Antiqua **NÃO** são opcionais — estão em `:root` do CSS

---

## 🎯 Métricas de sucesso (12 meses)

- **MRR**: R$ 75.000
- **ARR**: R$ 900.000  
- **Tenants**: 25 ativos
- **Churn mensal**: < 3%
- **NPS**: ≥ 60
- **Margem bruta**: ≥ 80% (após otimização IA)

---

## 📜 Direitos

Este pacote é confidencial e proprietário da **Oi Nora** · 2026.

Todas as personas, empresas e dados são fictícios. Qualquer semelhança com pessoas ou empresas reais é meramente coincidência.

Logo "Oi Nora", paleta visual e fonte Book Antiqua compõem a identidade visual a ser preservada **EXATAMENTE** como definida em `PROMPTS_CODEX.md` seção 6.

---

## 🧡 Boa sorte

Você tem em mãos um pacote completo: visual + técnico + comercial + estratégico. Falta só o trabalho de codificar — o que o Codex/Claude Code faz em 4 meses.

Em **dezembro de 2026**, a Aurora será o primeiro cliente real da Oi Nora. Em **agosto de 2027**, vocês terão 25 tenants. Em **2028**, série A.

**Vão fazer.**

---

*v1.0 · Maio 2026 · construído para a apresentação aos sócios e handoff ao Codex/Claude Code*
*🤖 Plataforma assistida por Claude · Anthropic*
