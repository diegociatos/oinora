# ROADMAP_IMPLEMENTACAO.md
## Plano de implementação · Oi Nora MVP

> Cronograma de 5 fases (MVPs incrementais) para construir o produto Oi Nora do zero até a operação completa. Cada MVP é entregável e gera valor isolado.

---

## Visão geral

| Fase | Duração | Equipe | Marco | Status |
|---|---|---|---|---|
| **MVP 0 · Setup** | 1 sem | 1 dev | Stack rodando, deploy CI/CD | ⬜ A iniciar |
| **MVP 1 · Foundation** | 2-3 sem | 1-2 devs | Auth + Multi-tenant + Empregados | ⬜ |
| **MVP 2 · Recrutamento** | 2-3 sem | 1-2 devs | ATS completo + Portal candidato | ⬜ |
| **MVP 3 · Gestão de Pessoas** | 3-4 sem | 2 devs | Onboarding + Treinamentos + Headcount | ⬜ |
| **MVP 4 · Folha & Ponto** | 2-3 sem | 2 devs | Folha + Ponto + eSocial básico | ⬜ |
| **MVP 5 · Jurídico** | 2-3 sem | 1 dev + Dr. Henrique | Processos + IA cálculo de risco | ⬜ |
| **MVP 6 · Console & Billing** | 1-2 sem | 1 dev | Cláudia · Console Oi Nora + Stripe | ⬜ |
| **TOTAL** | **13-19 sem** | **1-2 devs full-time** | **Produto operacional** | |

**Estimativa conservadora**: ~4 meses solo developer · ~2.5 meses com 2 devs paralelos.

---

## 🛠 MVP 0 · Setup técnico

**Objetivo**: Stack rodando localmente e em produção (Netlify) com CI/CD. Sem features ainda.

### Tarefas

1. **Criar projeto Next.js 15**
   ```bash
   npx create-next-app@latest oinora --typescript --app --no-tailwind --no-src-dir --turbopack
   ```
2. **Configurar TypeScript strict** (`tsconfig.json` com `strict: true`, `noUncheckedIndexedAccess: true`)
3. **Criar projeto Supabase** (free tier para dev, pro para prod)
4. **Criar projeto Stripe** (test mode)
5. **Criar projeto Netlify** + conectar GitHub
6. **Configurar variáveis de ambiente**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `VOYAGE_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
7. **Instalar Prisma**: `npm i prisma @prisma/client && npx prisma init`
8. **Configurar fontes**:
   - Self-host Book Antiqua em `/public/fonts/BookAntiqua-{Regular,Italic,Bold}.woff2` OU usar Adobe Fonts
   - System UI sans-serif via `font-family` chain
9. **Configurar design tokens** em `/styles/tokens.css` (copiar paleta do `PROMPTS_CODEX.md`)
10. **Configurar CSS Modules** + base layout em `/app/layout.tsx`
11. **Configurar GitHub Actions** (lint + typecheck + build em PRs)
12. **Configurar Netlify** com Next.js Runtime + build command `next build`
13. **Adicionar Sentry** ou similar para error tracking
14. **Adicionar PostHog** ou Plausible para analytics
15. **Adicionar Resend** para emails transacionais

### Critérios de aceite

- ✅ `npm run dev` roda local
- ✅ Push em `main` faz deploy automático em Netlify
- ✅ Página `/` carrega com Book Antiqua aplicada e paleta correta
- ✅ Variáveis de ambiente lendo corretamente
- ✅ TypeScript sem erros (`tsc --noEmit`)
- ✅ Lint passa (`next lint`)
- ✅ Supabase acessível via client SDK
- ✅ Anthropic SDK testado com prompt "hello world"

### Riscos

- ⚠️ Book Antiqua é fonte proprietária Microsoft — verificar licença para uso comercial. **Alternativa free e similar**: **Palatino** (também serif elegante) ou usar **GFS Didot** do Google Fonts.

---

## 🏗 MVP 1 · Foundation (Auth + Multi-tenant + Empregados)

**Objetivo**: Roberto Aurora consegue se cadastrar, criar a Construtora Aurora como tenant, e cadastrar empregados manualmente (Fernando, Paula, etc.).

### Backend (Supabase)

1. **Executar migrations** do `MODELO_DE_DADOS.md` em ordem:
   - 001: extensions
   - 002: enums
   - 003: tabelas core (tenants, usuarios, tenant_memberships, departamentos, cargos, centros_custo, locais_trabalho, jornadas, empregados, empregado_dependentes, empregado_documentos, empregado_movimentacoes)
   - 004: RLS policies
   - 005: triggers + audit log
2. **Configurar Auth Supabase**: email/senha + magic link
3. **Criar Edge Function** `on_user_signup` que cria registro em `usuarios` automaticamente após signup
4. **Seed inicial** com Construtora Aurora (CNPJ + dados + Roberto como owner)

### Frontend

5. **Telas públicas**:
   - `/` landing page institucional (pode reaproveitar `00_indice.html` adaptado)
   - `/login` (email/senha + magic link)
   - `/signup` (cria usuario + ofertas trial)
   - `/recuperar-senha`
6. **Shell autenticado**:
   - Sidebar marinho (`/app/(rh)/layout.tsx`) com navegação adaptada por role
   - Topbar com avatar + tenant atual + notificações
   - Breadcrumb
   - Dark mode? — **fora do escopo MVP 1**
7. **Onboarding inicial** (primeiro login do owner):
   - Wizard de 3 passos: dados da empresa + escolher plano (trial 14 dias) + convidar primeiros membros
8. **CRUD Empregados** (`/app/(rh)/empregados`):
   - Listagem com filtros (departamento, status, busca por nome)
   - Ficha completa em 7 abas (replica `10_ficha_empregado.html`):
     - Resumo
     - Dados pessoais
     - Endereço & contato
     - Vínculo & cargo
     - Dependentes
     - Documentos (upload via Supabase Storage)
     - Histórico de movimentações
   - Server Actions: criar, atualizar, desligar, transferir
9. **CRUD Departamentos / Cargos / Centros de custo** (`/app/(rh)/configuracoes`)
10. **CRUD Usuários** (`/app/(rh)/usuarios`):
    - Convidar membro por email (envia magic link via Resend)
    - Atribuir role
    - Suspender/reativar
11. **Audit log viewer** (`/app/(rh)/auditoria`) — só `owner` vê

### Critérios de aceite

- ✅ Roberto se cadastra, cria Aurora, faz login
- ✅ Roberto convida Carla (admin) e Fernando (empregado)
- ✅ Carla cadastra 10 empregados manualmente
- ✅ Fernando entra com seu login e vê só seus próprios dados (RLS funcionando)
- ✅ Mudança de cargo registra em `empregado_movimentacoes`
- ✅ Toda alteração de empregado aparece em `audit_log`
- ✅ Owner consegue ver auditoria, Carla não consegue
- ✅ Multi-tenant: criar 2º tenant (Pluma Tecnologia) e validar isolamento

### Não fazer ainda

- ❌ Onboarding automático com checklist (vai no MVP 3)
- ❌ Integração eSocial S-2200 (vai no MVP 4)
- ❌ Avaliação 9-Box (vai no MVP 3)

---

## 🎯 MVP 2 · Recrutamento (ATS + Portal Candidato)

**Objetivo**: Mariana (recrutadora Oi Nora) cria a vaga afirmativa #2026-0042 a pedido do Roberto, recebe candidatos via portal externo, faz triagem com IA, conduz Letícia até a contratação.

### Backend

1. **Migrations**: tabelas `vagas`, `candidatos`, `candidatura_vaga`, `entrevistas`
2. **Storage bucket** `cvs` para upload de currículos
3. **Edge Function** para extração de texto de CV em PDF (usando `pdf-parse`)
4. **Edge Function** para gerar embedding do CV (Voyage API)
5. **Edge Function** semanal: recalcular embeddings de vagas ativas

### IA

6. **Prompt `triagem_curriculo_v1`** (Claude Haiku 4.5):
   - Input: descrição da vaga + texto do CV
   - Output: score 0-100, parecer em 3 frases, pontos fortes, gaps
7. **Prompt `descricao_vaga_v1`** (Claude Sonnet 4.6):
   - Input: cargo, nível, principais requisitos
   - Output: descrição completa + responsabilidades + requisitos formatados (no padrão Oi Nora)
8. **Match semântico**: query `pgvector` para encontrar top-10 CVs similares à descrição da vaga
9. **Logar todas as chamadas IA** em `ia_chamadas` com custo

### Frontend interno (Mariana / Roberto)

10. **Wizard de criação de vaga** em 5 passos (replica `09_wizard_vaga.html`):
    - 1: Identificação (cargo, departamento, gestor solicitante, tipo)
    - 2: Detalhes (descrição com **sugestão IA**, requisitos, salário)
    - 3: Vaga afirmativa? (público-alvo, justificativa)
    - 4: Aprovação (workflow de aprovação se acima do faixa)
    - 5: Publicação (canais: portal interno, LinkedIn, Gupy via API)
11. **Pipeline de candidatos** (Kanban arrastar e soltar):
    - Colunas: Aplicado · Triagem · Entrevista Rec · Teste · Entrevista Gestor · Proposta · Contratado
    - Card mostra nome + score IA + tags
    - Server Action `mover_candidato_stage`
12. **Ficha do candidato**:
    - Header com foto, dados, match%, CV em iframe
    - Timeline de interações
    - Botões: agendar entrevista, enviar feedback, mover stage
13. **Banco de talentos** (`/recrutamento/banco-talentos`):
    - Busca textual + semântica
    - Filtros: cargo, cidade, pretensão salarial
    - Convite para nova vaga em 1 clique
14. **Dashboard de recrutamento** (replica `02_empresa_recrutamento.html`):
    - KPIs (vagas abertas, candidatos por stage, tempo médio de contratação)
    - Gráfico de funil
    - Top recrutadores

### Frontend externo (Portal Candidato — Letícia)

15. **Portal candidato** (`/portal`) — domínio próprio ou subdomínio:
    - Listagem de vagas públicas com filtros
    - Página da vaga + botão "Candidatar-se"
    - Upload de CV (PDF/DOCX)
    - Formulário de dados pessoais + consentimento LGPD
    - Após aplicar: dashboard "minhas candidaturas" + status de cada uma
    - Notificações por email a cada mudança de stage

### Critérios de aceite

- ✅ Mariana cria vaga #2026-0042 via wizard com sugestão IA
- ✅ Letícia se cadastra no portal, faz upload do CV, aplica na vaga
- ✅ Sistema gera embedding do CV e calcula score (deve ficar >80% match)
- ✅ Triagem IA gera parecer com 3 pontos fortes e 2 gaps
- ✅ Mariana move Letícia pelo pipeline até "Contratado"
- ✅ Ao contratar, sistema **cria empregado automaticamente** no tenant Aurora
- ✅ Auditoria registra cada mudança de stage
- ✅ Candidato vê portal mobile-first responsivo

---

## 👥 MVP 3 · Gestão de Pessoas (Onboarding + Treinamentos + Headcount + Avaliação)

**Objetivo**: Paula (admitida ontem) inicia onboarding automático. Fernando faz curso BIM. Roberto controla quadro autorizado vs preenchido.

### Backend

1. **Migrations**: tabelas de onboarding, treinamentos (cursos, trilhas, matrículas), headcount (quadro, projeções), avaliação (ciclos, avaliações, PDI)
2. **Catálogo de cursos seed**:
   - 8 NRs (NR-6, NR-10, NR-12, NR-15, NR-18, NR-33, NR-35, LGPD)
   - 5 cursos internos (BIM, Lean Construction, Liderança, Sienge, Inglês Técnico)
3. **Cron Edge Function** diária: detectar treinamentos próximos do vencimento (30 dias) → criar notificações

### Frontend · Onboarding

4. **Templates de onboarding** (`/onboarding/templates`):
   - CRUD de templates por cargo (RH cria template "Coord. RH" com 30 itens)
   - Itens com `dia_alvo` (D+0, D+5, D+30)
5. **Aplicar template ao novo admitido**:
   - Ao criar empregado no MVP 1 / contratar no MVP 2 → checklist personalizado automaticamente
   - Atribuir mentor (FK gestor ou outro)
6. **Visão Paula (empregada · em onboarding)**:
   - `/meus-dados/onboarding` → lista de tarefas por dia, % concluído, encontro com mentor agendado
   - Notificações no DIA 1, DIA 5, DIA 30
7. **Visão Carla (mentora · RH)**:
   - `/onboarding/dashboard` → lista de pessoas em onboarding + atrasos
   - Visão da Paula com checklist completo (replica `14_onboarding.html`)

### Frontend · Treinamentos & Trilhas

8. **Catálogo público** (`/treinamentos/catalogo`):
   - Cards de cursos com filtros (categoria, duração, provedor)
   - Inscrição em curso opcional
9. **Trilhas configuráveis** (`/treinamentos/trilhas`):
   - Owner/Admin configura trilha "Eng. Civil Sr → Especialista" com sequência de cursos
   - Inscrição automática de empregados que pertencem ao cargo
10. **Visão do empregado** (`/meus-dados/treinamentos`):
    - "Suas trilhas" com progresso, badges
    - Player de curso (vídeo + quiz + certificado)
11. **Visão RH** (`/treinamentos/dashboard`):
    - Conformidade NR (% empregados com NRs em dia)
    - Alertas de vencimento
    - **Banner urgente "3 NRs vencidos"** (Marcelo NR-18, Henrique NR-35)
    - Botão "Enviar S-2210 SST eSocial"

### Frontend · Headcount & Quadro de Posições

12. **Dashboard Headcount** (`/headcount`):
    - KPIs (128 ativos / 135 autorizados, 5 em recrutamento, custo mês)
    - Barras por departamento (autorizado vs preenchido)
    - Indicadores RH (turnover, idade média, % diversidade)
13. **Configuração de quadro** (`/headcount/quadro`):
    - Owner define `posicoes_autorizadas` por departamento × cargo × ano
    - Workflow de aprovação CFO se aumentar
14. **Projeção 12 meses** (`/headcount/projecao`):
    - 3 cenários (conservador, realista, otimista)
    - Gráfico de barras mês a mês com pico em outubro (Vila Aurora)
    - **Prompt IA `analise_quadro_v1`** sugere otimizações
15. **Movimentações** (`/headcount/movimentacoes`):
    - Lista filtrada (admissão, desligamento, promoção, transferência, reajuste)
    - Cards com impacto financeiro

### Frontend · Avaliação 9-Box & PDI

16. **Ciclo de avaliação** (`/avaliacao/ciclos`):
    - Admin cria ciclo (ex: Q1/2026)
    - Define participantes (todos do tenant ou seletivos)
17. **9-Box visual** (`/avaliacao/9box`):
    - Grid 3×3 com pessoas plotadas
    - Drag & drop para recalibrar
    - Filtro por departamento
18. **PDI individual** (`/empregados/[id]/pdi`):
    - Objetivos, ações, prazos, recursos
    - Vincula ações a cursos/trilhas do catálogo
    - **Sugestão IA `pdi_v1`** baseada em 9-Box

### Critérios de aceite

- ✅ Paula vê DIA 1 com 12 itens no checklist
- ✅ Carla (mentora) é notificada quando Paula atrasa item
- ✅ Fernando completa Módulo 6 do curso BIM e ganha badge
- ✅ Sistema notifica Roberto sobre Marcelo NR-18 vencendo
- ✅ Bloqueio de canteiro: empregado sem NR-18 não pode bater ponto no local de obra (validar no MVP 4)
- ✅ Roberto vê 96% de conformidade NR no dashboard
- ✅ Fernando aparece como "Estrela" no 9-Box (desempenho 3, potencial 3)
- ✅ PDI do Fernando inclui automaticamente o curso "Liderança Técnica" sugerido por IA

---

## 💰 MVP 4 · Folha de Pagamento + Ponto Eletrônico + eSocial

**Objetivo**: Bruna (HR Ops) fecha a folha de maio/2026 (R$ 2.789K). Fernando bate ponto pelo celular. Sistema envia S-1200 e S-2200 ao eSocial.

### Backend

1. **Migrations**: tabelas folha (competências, holerites, eventos, tabelas INSS/IRRF), batidas_ponto, espelhos_ponto, esocial_eventos
2. **Tabelas oficiais INSS e IRRF 2026** (atualizar com valores reais via gov.br)
3. **Cálculo de folha**:
   - Função PostgreSQL `calcular_holerite(empregado_id, competencia)` que:
     - Pega salário base do empregado
     - Soma horas extras do `espelhos_ponto` da competência
     - Aplica insalubridade/periculosidade do cargo
     - Calcula INSS (`tabela_inss`)
     - Calcula IRRF (`tabela_irrf`)
     - Calcula FGTS 8% (separado · não desconta)
     - Gera linhas em `folha_eventos`
4. **Geração de PDF de holerite** via `@react-pdf/renderer` ou similar
5. **Edge Function**: ao fechar folha, gerar XMLs S-1200 para cada empregado
6. **Edge Function**: integração com gateway eSocial (Pinhais/Tagplus) — enviar lote
7. **Webhook receiver** `/api/webhook/esocial` para receber retornos do gateway

### Frontend · Folha (Bruna · HR Ops)

8. **Dashboard Folha** (`/folha`):
   - Competências dos últimos 12 meses
   - Status atual (aberta, calculando, conferência, fechada)
   - Totais em destaque
9. **Lançamento de eventos** (`/folha/eventos`):
   - Importar do ponto (auto)
   - Inserir manuais (vale alimentação, prêmios, comissões)
   - Editar lançamentos pendentes
10. **Tela de conferência** (`/folha/conferencia`):
    - Lista de holerites com totalizadores
    - Marcar como conferido (workflow 4-eyes)
    - Alertas (variação > 20% vs mês anterior)
11. **Preview de holerite** (`/folha/holerite/[id]`):
    - Layout idêntico ao impresso (replica `11_folha_pagamento.html`)
    - Botão download PDF
12. **Relatórios** (`/folha/relatorios`):
    - Resumo gerencial
    - DARF, GFIP, GPS
    - Por centro de custo
    - Exportação para Sienge (CSV layout específico)

### Frontend · Ponto (Bruna + Fernando + Luísa gestora)

13. **Bater ponto Web** (`/meu-ponto`):
    - Relógio em tempo real
    - Botões grandes: Entrada / Almoço / Volta / Saída
    - Captura localização (validar geofence)
    - Confirma com foto (opcional)
14. **Bater ponto Mobile** (PWA):
    - **Prioridade alta** — para canteiro
    - Funciona offline (queue de batidas)
    - Sincroniza quando voltar online
15. **Espelho de ponto** (`/meu-ponto/espelho`):
    - Tabela do mês com entradas/saídas/totais
    - Solicitar ajuste com justificativa
16. **Banco de horas** (`/meu-ponto/banco-horas`):
    - Saldo, créditos, débitos
    - Solicitação de compensação
17. **Aprovações** (`/ponto/aprovacoes` · gestor):
    - Luísa aprova ajustes solicitados por Fernando
    - Bruna (HR Ops) faz override em casos especiais
18. **Dashboard RH** (`/ponto`):
    - % empregados batendo ponto
    - Atrasos do dia
    - Banco de horas estourado
    - **Bloqueio NR**: alerta quando empregado sem NR-18 tenta bater no canteiro

### Critérios de aceite

- ✅ Folha de maio fecha com R$ 2.789K (precisão até R$ 100)
- ✅ Holerite do Fernando bate exato com o protótipo (R$ 8.658,00 líquido)
- ✅ Fernando bate ponto pelo celular em obra com sinal fraco (PWA offline)
- ✅ Geofence: empregado fora do canteiro recebe alerta mas pode bater (com flag)
- ✅ S-1200 enviado e retorna recibo do eSocial
- ✅ S-2200 (admissão Paula) enviado em até 24h após cadastro
- ✅ S-2210 (treinamento NR) enviado mensalmente
- ✅ Export Sienge gera CSV no layout esperado
- ✅ Bloqueio NR funciona: Bruno sem NR-18 não bate ponto em obra

---

## ⚖ MVP 5 · Jurídico Trabalhista (Dr. Henrique)

**Objetivo**: Dr. Henrique loga via portal próprio, cadastra processo do José Augusto Mendes, IA calcula risco, sistema sugere acordo, integração com ex-empregado Aurora.

### Backend

1. **Migrations**: processos_juridicos, andamentos, audiências, calculo_parcelas, documentos, anotacoes_privadas, acordos, escritorios_juridicos, escritorio_tenants
2. **RLS especial** para advogado externo (já documentada em `MODELO_DE_DADOS.md`):
   - Vê só tenants que atende
   - Vê suas anotações privadas
   - Não vê anotações privadas do tenant (e vice-versa)
3. **Storage bucket** `documentos-processo` (peças, PDFs)
4. **Edge Function** para upload de peças no PJe (futuro — opcional MVP 5)

### IA

5. **Prompt `calculo_risco_processo_v1`** (Claude Opus 4.7):
   - Input: cargo do reclamante, tempo de casa, pleitos, valor da causa
   - Output: classificação CPC 25 + 3 cenários (melhor/realista/pior) + parcelas detalhadas
6. **Prompt `sugestao_acordo_v1`** (Claude Opus 4.7):
   - Input: dados do processo + histórico de acordos similares (RAG via embeddings)
   - Output: faixa sugerida de acordo + probabilidade de aceite + economia estimada
7. **RAG de processos similares**:
   - Indexar todos processos em `processos_juridicos.resumo_embedding`
   - Query: dado novo processo, retornar top-5 similares

### Frontend

8. **Login com workspace jurídico** (`/login` → roteamento por role):
   - Dr. Henrique: detecta role `advogado_externo` → leva para `/juridico` com sidebar roxa
9. **Dashboard do advogado** (`/juridico`) — replica `17_juridico_trabalhista.html` tela 1:
   - Multi-empresa chips (Aurora, Horizonte, Pluma)
   - KPIs (processos ativos, valor em risco, audiências em 30d, acordos YTD)
   - Banner audiência hoje
   - Lista top 5 processos prioritários
   - Pizza distribuição risco CPC 25
10. **Lista de processos** (`/juridico/processos`) — tela 2:
    - Filtros avançados, busca por CNJ/parte/pleito
    - Tabela densa com pill de risco
    - Resumo por categoria de risco
11. **Ficha do processo** (`/juridico/processos/[cnj]`) — tela 3:
    - Header gigante com CNJ + partes
    - 6 abas: Visão geral, Timeline, Cálculos, Documentos, Partes, Anotações privadas
    - Cálculo de risco com 3 cenários (cards visuais)
    - Tabela detalhada de parcelas
    - Timeline de andamentos (cronológica)
    - Upload de documentos
    - **Integração ficha ex-empregado** (botão "Abrir ficha histórica" se reclamante tinha matrícula no tenant)
12. **Wizard de cadastro** (`/juridico/processos/novo`) — tela 4:
    - 4 passos: Identificação → Partes/Pleitos → Risco → Documentos
    - Autocomplete de ex-empregado por CPF
    - **IA sugere risco e cálculo** durante o preenchimento
    - Preview do processo antes de salvar
13. **Calendário de audiências** (`/juridico/audiencias`):
    - Visão mensal/semanal
    - Filtros por advogado / empresa
    - Notificações 24h antes
14. **Relatório mensal** (`/juridico/relatorios`):
    - Geração automática para enviar ao tenant (Roberto)
    - Acordos do mês, audiências, evolução de risco
    - **PDF gerado pela IA** com narrativa executiva

### Frontend tenant (Roberto · acesso parcial)

15. **Visão do tenant sobre processos** (`/juridico` quando role = owner):
    - Vê resumo dos processos da SUA empresa
    - NÃO vê outros tenants do escritório
    - NÃO vê anotações privadas do escritório
    - Pode comentar / responder ao advogado

### Critérios de aceite

- ✅ Dr. Henrique loga e vê só Aurora, Horizonte e Pluma (3 empresas que atende)
- ✅ Cadastra processo José Augusto via wizard em <5 min
- ✅ IA classifica risco como POSSÍVEL e sugere R$ 84k provisão
- ✅ Sistema encontra processo José Roberto Pinheiro como 83% similar
- ✅ Sugestão IA de acordo R$ 60-80k aparece com justificativa
- ✅ Roberto (Aurora · owner) vê processo no seu dashboard mas SEM anotações privadas
- ✅ Provisão R$ 842k aparece em relatório contábil exportável
- ✅ Audit log registra acesso de Dr. Henrique a dados do tenant

---

## 🏢 MVP 6 · Console Oi Nora + Billing Stripe

**Objetivo**: Cláudia gerencia tenants, vê MRR, NPS, contratos. Plataforma cobra automaticamente via Stripe.

### Backend

1. **Migrations**: stripe_customer_id, stripe_subscription_id em `tenants`
2. **Webhook Stripe** (`/api/webhook/stripe`):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. **Atualização automática de status do tenant** baseado em pagamento

### Frontend

4. **Console Oi Nora** (`/console` — role super_admin):
   - Lista de tenants com filtros (status, plano, MRR)
   - KPIs globais (MRR, ARR, churn, NPS)
   - Métricas de IA (chamadas, custo, modelos mais usados)
5. **Detalhe do tenant**:
   - Resumo da conta
   - Faturas Stripe
   - Uso (empregados ativos, vagas criadas, processos cadastrados)
   - Health score (engagement, NPS, suporte aberto)
6. **Gestão de planos**:
   - Configurar features por plano (módulos ativos)
   - Promoções, descontos, trial estendido
7. **Customer Success**:
   - Tickets de suporte
   - Notas internas
   - Onboarding de novos tenants

### Stripe

8. **Criar 3 produtos** no Stripe:
   - Essencial · R$ 990/mês até 30 emp
   - Profissional · R$ 2.490/mês até 100 emp
   - Premium · R$ 4.990/mês até 500 emp
9. **Customer Portal** habilitado (cliente atualiza método de pagamento)
10. **Cobrança extra** por empregado acima do limite (R$ 39/empregado · Premium)
11. **Fatura mensal** com PDF automático

### Critérios de aceite

- ✅ Cláudia vê 3 tenants ativos: Aurora (Premium), Pluma (Profissional), Horizonte (Essencial)
- ✅ MRR total calculado corretamente
- ✅ Aurora atinge 135 empregados → trigger upgrade automático ou cobrança adicional
- ✅ Tentativa de pagamento falha → tenant entra em status "inadimplente" → bloqueia novos usuários
- ✅ Trial de 14 dias da Pluma expira → conversão automática ou cancelamento
- ✅ Cláudia consegue estender trial manualmente

---

## 🚀 Pós-MVP · Features futuras (Roadmap 2027)

| Feature | Quando | Esforço |
|---|---|---|
| App mobile nativo (React Native) | Q1 2027 | 2-3 meses |
| Integração WhatsApp Business (avisos para empregados) | Q1 2027 | 3 sem |
| Pesquisa de clima / eNPS recorrente | Q2 2027 | 2 sem |
| Reconhecimento facial no ponto (DataValid) | Q2 2027 | 4 sem |
| Marketplace de cursos externos (Alura, Udemy via API) | Q2 2027 | 4 sem |
| Chatbot Nora·IA (24/7) para empregados | Q2 2027 | 4 sem |
| Integração PJe automática (consulta andamentos) | Q3 2027 | 6 sem |
| Recrutamento internacional (i18n + EOR) | Q3 2027 | 8 sem |
| Microcrédito para empregados (parceria fintech) | Q4 2027 | 6 sem |
| OKRs / Metas / Performance Reviews avançado | Q4 2027 | 6 sem |
| BI / Data Warehouse (dbt + Metabase) | 2028 | 8 sem |

---

## 📋 Convenções para o agente Codex executar

### Por sprint (1-2 semanas)

1. Ler critérios de aceite da fase atual
2. Implementar **uma feature de cada vez** (não pular)
3. Cada feature deve:
   - Ter migration SQL (se aplicável)
   - Ter RLS validada
   - Ter Server Action tipada com Zod
   - Ter UI replicando padrão visual do protótipo HTML correspondente
   - Ter audit log se afeta dado sensível
   - Ter ao menos 1 teste de integração (Vitest + Playwright)
4. Ao fim do sprint: rodar **smoke test** com personagens (Roberto loga, faz X, vê Y)
5. Deploy em staging Netlify para validação

### Ordem de implementação dentro de uma feature

1. Migration SQL + seeds adicionais (se preciso)
2. Tipos TypeScript (Prisma generate)
3. Server queries (`/server/queries/<feature>.ts`)
4. Server actions (`/server/actions/<feature>.ts`)
5. Componentes de UI (`/components/domain/<feature>/`)
6. Página(s) (`/app/<rota>/page.tsx`)
7. Audit log + notificações se aplicável
8. Teste de integração

---

## ⚠️ Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **eSocial muda layout** | Média | Alto | Usar gateway terceirizado (Pinhais/Tagplus) abstrai mudanças |
| **Custo IA explode** | Baixa | Médio | Logar todas chamadas + cache de resultados similares + limites por plano |
| **Performance com 500+ empregados** | Média | Médio | Indexar pesado · paginação obrigatória · materialized views para dashboards |
| **LGPD: vazamento de dados pessoais** | Baixa | Crítico | RLS rigoroso · audit log completo · pen-test antes de prod |
| **Multi-tenant: bug de isolamento** | Média | Crítico | Testes E2E com 2 tenants simultâneos · revisão obrigatória de queries |
| **Book Antiqua licença** | Alta | Baixo | Plano B: Palatino / GFS Didot / EB Garamond |
| **Codex inventa regra trabalhista** | Alta | Médio | Forçar consulta a fonte oficial · regras hardcoded em `/lib/clt/regras.ts` |

---

## 🎯 Métricas de sucesso do projeto

- **MVP 1 entregue em até 3 sem após setup**
- **Aurora migrando dados reais para o sistema em até 8 sem**
- **2º e 3º tenants captados em até 12 sem**
- **MRR ≥ R$ 10.000 em 6 meses**
- **NPS ≥ 50 em 6 meses**
- **Churn < 5% mensal**
- **Margem de contribuição ≥ 85%** (mesmo com IA)

---

🤖 Oi Nora · Roadmap v1.0 · 2026
