# BRIEFING_TECNICO.md
## Briefing técnico de negócio · Oi Nora v2

> Contexto completo de negócio que o agente Codex precisa internalizar antes de codificar. Cobre o "porquê" do produto, integrações brasileiras obrigatórias, regras CLT hardcoded e particularidades do mercado de construção civil.

---

## 1. O que é a Oi Nora

### Pitch em uma frase

Plataforma SaaS B2B brasileira que unifica **Recrutamento & Seleção + Gestão de Pessoas + Folha + Ponto + Jurídico Trabalhista** em um único produto, com IA nativa, voltada inicialmente para **construção civil** no Brasil.

### Por que esse mix?

A maioria dos concorrentes BR resolve **um pedaço**:
- **Gupy / Vagas.com** — só recrutamento
- **Convenia / Sólides** — RH operacional
- **Pontotel / Tangerino** — só ponto
- **Senior / TOTVS** — folha pesada e antiga
- **Software jurídico (Astrea, ADVBox)** — só escritório, não conversa com RH

**A dor**: o Dir. RH precisa de 4-5 sistemas que não conversam. Quando um empregado se desliga e processa a empresa 6 meses depois, o advogado pede holerites, espelhos de ponto, treinamentos NR — e o RH passa **2-3 semanas** garimpando dados em 4 sistemas para enviar ao escritório.

**A solução Oi Nora**: tudo no mesmo banco, com **integração nativa**. Quando o Dr. Henrique cadastra um processo do José Roberto, com 1 clique ele acessa: ficha completa, holerites de 8 anos, espelhos de ponto, certificados NR, histórico de mudanças.

### Visão de 3 anos

- **Ano 1 (2026)**: 25 tenants · ARR R$ 900k · foco SP/MG construção civil
- **Ano 2 (2027)**: 100 tenants · ARR R$ 6M · expandir para indústria pesada
- **Ano 3 (2028)**: 300 tenants · ARR R$ 24M · serie A · expansão LATAM

---

## 2. Quem são os personagens (e por que importam para o código)

### Persona 1: **Cláudia Vasconcelos** — CEO Oi Nora

- 47 anos, ex-Dir. RH de construtora, fundou a Oi Nora em 2024 com 2 sócios
- Vê a plataforma da perspectiva de **negócio**: MRR, churn, NPS
- **Tecnicamente importa para**: Console Oi Nora (`/console`) com métricas SaaS

### Persona 2: **Mariana Costa** — Recrutadora Sênior Oi Nora

- 34 anos, atende 8 empresas-clientes simultaneamente
- **142% de meta em maio/2026** (KPI usado nas telas)
- Vive no Kanban de candidatos
- **Tecnicamente importa para**: multi-tenant para recrutador, performance (1.000+ candidatos), embeddings rápidos

### Persona 3: **Roberto Aurora** — Dir. RH Construtora Aurora (owner)

- 52 anos, dono da empresa-cliente "modelo" do protótipo
- **128 empregados ativos** na Aurora (referência repetida em tudo)
- Owner do tenant, decide planos, aprova promoções > 15%
- **Tecnicamente importa para**: dashboard executivo unificado, aprovações em workflow

### Persona 4: **Fernando Lacerda Costa** — Eng. Civil Sr (empregado · MAT 0112)

- 38 anos, 4 anos de casa, salário R$ 12.500
- Em trilha BIM (65% concluída)
- ★ Estrela 9-Box (potencial 3, desempenho 3)
- Promoção prevista para 02/08/2026 (R$ 12.500 → R$ 16.500)
- **Tecnicamente importa para**: persona "empregado feliz" — todas as features de visão do funcionário

### Persona 5: **Paula Marques Souza** — Coord. RH admitida em 26/05/2026

- 29 anos, **DIA 1 hoje** (data atual do sistema)
- Mentora: Carla Aurora
- **Tecnicamente importa para**: fluxo de onboarding completo, S-2200 eSocial enviado em 23/05

### Persona 6: **Letícia Ferraz Almeida** — candidata vaga afirmativa #2026-0042

- 34 anos, mulher, analista financeira sênior
- Match IA 87% com a vaga de Eng. Civil Pleno (afirmativa)
- **Tecnicamente importa para**: portal externo + IA triagem + multi-empresa

### Persona 7: **Dr. Henrique Vasconcellos** — advogado trabalhista terceirizado

- OAB/MG 78.452
- Escritório Vasconcellos & Associados
- Atende **3 empresas-clientes** (Aurora, Horizonte, Pluma)
- **18 processos ativos** no total · **R$ 1.86M em risco**
- **Tecnicamente importa para**: módulo Jurídico, RLS multi-tenant para escritório, IA opus para cálculo de risco

### Persona 8: **José Roberto Pinheiro** — ex-pedreiro (reclamante)

- Ex-empregado Aurora 2014-2022 (8 anos casa)
- Processo CNJ 0011234-56.2024.5.03.0021
- Pleitos: HE + insalubridade NR-15 + diferença FGTS
- Valor causa R$ 248k · provisão R$ 186k · **audiência hoje 14:30**
- **Tecnicamente importa para**: integração ficha histórica, cálculo CPC 25, IA RAG

### Persona 9: **Marcelo Andrade Lima** — Eng. Civil Sr · NR-18 vencida há 14 dias

- **Risco trabalhista imediato** para a Aurora
- Não pode entrar no canteiro Sítio II
- **Tecnicamente importa para**: bloqueio de ponto por NR + alerta vermelho no dashboard

### Persona 10: **João Sampaio** — ex-servente, saiu 15/05/2026, processou em 22/05

- Coerência cross-módulo: aparece em Movimentações (Tela 8) → Jurídico (Tela 17)
- **Tecnicamente importa para**: feature "alerta rescisão indireta — risco jurídico"

---

## 3. Universo "Construtora Aurora" (use como seed)

### Dados oficiais

- **Razão social**: Construtora Aurora Ltda
- **CNPJ**: 12.345.678/0001-90
- **Inscrição Estadual**: 062.123.456.7891
- **CNAE principal**: 41.20-4-00 (Construção de edifícios)
- **Endereço sede**: Av. Olegário Maciel, 2520 · Lourdes · Belo Horizonte · MG · CEP 30180-110
- **CCT**: SINTRAICCMG (Sindicato dos Trabalhadores na Indústria da Construção Civil de MG)
- **Data-base**: 01/04
- **FAP**: 1.2317
- **RAT**: 3.00
- **Banco**: Banco do Brasil ag. 1234-5 cc. 67.890-1
- **128 empregados ativos · 135 autorizados · 5 em recrutamento · 2 vagas em aberto**
- **R$ 2.789.000/mês de folha**
- **Plano contratado**: Premium R$ 4.990/mês (ativo desde jan/2026)

### Estrutura organizacional

```
CEO Alfredo Aurora (fundador · 62 anos)
├── Dir. Operações: Carlos Aurora (filho · 35 anos)
│   ├── Obra Sítio II · 45 empregados
│   ├── Obra Vila Aurora · 18 empregados (em planejamento)
│   └── Obra Pampulha (encerrada 2022)
├── Dir. Engenharia: Luísa Mendonça (não-família)
│   ├── 22 engenheiros (1 vaga aberta + 2 em recrutamento)
│   └── inclui o Fernando Lacerda
├── Dir. Financeiro: Eduardo Santos (não-família)
│   ├── 12 pessoas
│   └── aprovador de propostas > R$ 50k
├── Dir. RH: Roberto Aurora (sobrinho do Alfredo · 52 anos)
│   ├── Carla Aurora (Coord. RH · admin)
│   ├── Bruna Lima (HR Ops · DP)
│   └── Paula Marques (Coord. RH · admitida 26/05)
├── Dir. Comercial: (vago · Carlos Aurora acumula)
└── Suprimentos: Gabriela Tavares (Coord.)
```

### 6 departamentos

| Sigla | Nome | Diretor | Empregados | Custo/mês |
|---|---|---|---|---|
| OPS | Operações & Obra | Carlos Aurora | 78 ativos / 82 autorizados | R$ 1.184k |
| ENG | Engenharia | Luísa Mendonça | 22 / 25 (vaga #2026-0042) | R$ 498k |
| FIN | Financeiro & Adm | Eduardo Santos | 12 / 12 | R$ 248k |
| COM | Comercial | Carlos Aurora | 8 / 8 | R$ 167k |
| SUP | Suprimentos | Gabriela Tavares | 5 / 5 | R$ 92k |
| RH | Recursos Humanos | Roberto Aurora | 3 / 3 (Paula completou) | R$ 50k |

### Cargos típicos da Aurora (com CBO)

| Cargo | CBO | Faixa salarial | Insalub. | Periculos. |
|---|---|---|---|---|
| Engenheiro Civil Sênior | 2142-05 | R$ 11k - R$ 15k | – | – |
| Engenheiro Civil Pleno | 2142-05 | R$ 8k - R$ 11k | – | – |
| Engenheiro Civil Júnior | 2142-05 | R$ 5k - R$ 7k | – | – |
| Mestre de Obras | 7102-10 | R$ 5k - R$ 8k | 20% | – |
| Encarregado | 7101-15 | R$ 4k - R$ 6k | 20% | – |
| Pedreiro | 7152-10 | R$ 2.5k - R$ 3.5k | 20% | – |
| Servente | 7170-20 | R$ 1.8k - R$ 2.4k | 20% | – |
| Carpinteiro | 7155-10 | R$ 2.8k - R$ 3.8k | 20% | – |
| Eletricista | 7156-10 | R$ 3k - R$ 4.5k | – | 30% |
| Soldador | 7243-15 | R$ 3.2k - R$ 4.5k | 20% | – |
| Coord. RH | 1422-30 | R$ 8k - R$ 11k | – | – |
| Analista R&S | 1422-30 | R$ 5k - R$ 7k | – | – |
| Aux. Administrativo | 4110-05 | R$ 1.8k - R$ 2.8k | – | – |

---

## 4. Regras CLT e particularidades brasileiras

> ⚠️ **CRÍTICO**: estas regras devem estar hardcoded em `/lib/clt/regras.ts` e **NUNCA** ser deduzidas pela IA.

### Jornada de trabalho

- **44 horas/semana** padrão CLT (alterado para 36h em algumas categorias por CCT)
- **8 horas/dia** + 1h almoço (44h: seg-sex 8h + sáb 4h)
- **Adicional noturno**: 20% sobre hora normal (das 22h às 5h)
- **Hora extra 50%** em dias úteis (excedente da jornada normal)
- **Hora extra 100%** em domingos e feriados
- **Intervalo intrajornada**: mínimo 1h se jornada > 6h (CLT art. 71)
- **Intervalo interjornada**: mínimo 11h entre jornadas (CLT art. 66)
- **DSR (Descanso Semanal Remunerado)**: 1 dia preferencialmente domingo

### Insalubridade & Periculosidade (NR-15 / NR-16)

- **Insalubridade NR-15**:
  - Grau mínimo: 10% do salário-mínimo regional
  - Grau médio: 20% do salário-mínimo
  - Grau máximo: 40% do salário-mínimo
  - **Construção civil**: geralmente 20% (poeira, ruído, agentes químicos)
- **Periculosidade NR-16**: 30% sobre **salário base** (não salário-mínimo)
- **Não acumuláveis**: empregado escolhe a maior (Súmula 261 TST · debatido)
- **Empregado pode ter direito a ambas em ações trabalhistas** (jurisprudência divergente — alimenta processos)

### NRs (Normas Regulamentadoras) — obrigatórias

| NR | Tema | Carga horária | Validade |
|---|---|---|---|
| **NR-1** | Disposições gerais + LGPD treinamento | 4h | – |
| **NR-5** | CIPA | varia | 1 ano |
| **NR-6** | EPI | 4h | – |
| **NR-7** | PCMSO (ASO) | – | 1 ano (periódico) |
| **NR-10** | Segurança em instalações elétricas | 40h | 2 anos |
| **NR-11** | Transporte/movimentação materiais | 8h | – |
| **NR-12** | Segurança em máquinas | 8h | 2 anos |
| **NR-15** | Insalubridade (laudo LTCAT) | – | – |
| **NR-16** | Periculosidade (laudo) | – | – |
| **NR-17** | Ergonomia | – | – |
| **NR-18** | **Construção civil** ⭐ | 40h | 2 anos |
| **NR-33** | Espaços confinados | 16h | 2 anos |
| **NR-35** | **Trabalho em altura** ⭐ | 8h | 2 anos |

**Estrela = uso intenso na Aurora**.

### Cálculo de horas extras (lógica para folha)

```typescript
// /lib/clt/folha.ts
const HORA_NORMAL = salarioMensal / 220;  // 220 = jornada média mensal (44h × 5)
const HORA_EXTRA_50 = HORA_NORMAL * 1.5;
const HORA_EXTRA_100 = HORA_NORMAL * 2.0;

// Adicional noturno
const HORA_NOTURNA = HORA_NORMAL * 1.20;
// Hora noturna reduzida: 52 minutos e 30 segundos (CLT art. 73 § 1º)
// Hora noturna em obra é diferente — verificar CCT
```

### Tabela INSS 2026 (referência — atualizar conforme gov.br)

| Faixa salarial | Alíquota | Dedução |
|---|---|---|
| até R$ 1.412,00 | 7,5% | – |
| R$ 1.412,01 a R$ 2.666,68 | 9% | R$ 21,18 |
| R$ 2.666,69 a R$ 4.000,03 | 12% | R$ 101,18 |
| R$ 4.000,04 a R$ 7.786,02 | 14% | R$ 181,18 |
| > R$ 7.786,02 | teto: R$ 908,86 | – |

Fórmula: `inss = faixa.aliquota * salario - faixa.deducao` (limitado ao teto)

### Tabela IRRF 2026 (referência)

| Base de cálculo | Alíquota | Dedução |
|---|---|---|
| até R$ 2.259,20 | isento | – |
| R$ 2.259,21 a R$ 2.826,65 | 7,5% | R$ 169,44 |
| R$ 2.826,66 a R$ 3.751,05 | 15% | R$ 381,44 |
| R$ 3.751,06 a R$ 4.664,68 | 22,5% | R$ 662,77 |
| > R$ 4.664,68 | 27,5% | R$ 896,00 |

- Dedução por dependente: R$ 189,59
- Base IRRF = salário bruto − INSS − dependentes × R$ 189,59

### FGTS

- **8% sobre salário** (recolhido pela empresa · não desconta do empregado)
- **Multa de 40% sobre saldo FGTS** em rescisão sem justa causa
- **Multa de 20%** em acordo Art. 484-A
- **Sem multa** em pedido demissão

### Férias

- **30 dias corridos** após 12 meses (período aquisitivo)
- **Salário das férias + 1/3 constitucional**
- Concessão em até 12 meses após o período aquisitivo
- Pode ser fracionada em até 3 períodos (Reforma Trabalhista 2017)
- Adicional 1/3: salário + (salário ÷ 3)

### 13º salário

- **1ª parcela**: até 30/11 (50% do salário)
- **2ª parcela**: até 20/12 (50% do salário menos INSS + IRRF)
- Cálculo: (meses trabalhados ÷ 12) × salário

### Rescisão (cálculo)

| Tipo | Aviso prévio | Saldo salário | Férias venc/prop | 13º prop | Multa FGTS | Saque FGTS | Seguro Desemprego |
|---|---|---|---|---|---|---|---|
| **Sem justa causa** | ✅ pago | ✅ | ✅ | ✅ | 40% | ✅ | ✅ |
| **Pedido demissão** | ⚠️ trabalha 30 dias | ✅ | ✅ | ✅ | – | – | – |
| **Acordo (Art. 484-A)** | 50% | ✅ | ✅ | ✅ | 20% | 80% | – |
| **Justa causa** | – | ✅ | ⚠️ vencidas | – | – | – | – |

### Aviso prévio (Lei 12.506/2011)

- **30 dias** base + **3 dias por ano completo**
- Máximo: **90 dias** (após 20 anos de empresa)
- Indenizado (sem trabalhar) ou trabalhado (− 2h diárias ou − 7 dias corridos)

### Convenção Coletiva (CCT)

Cada categoria tem sua CCT. A Aurora usa **SINTRAICCMG-CONST-CIVIL-MG** (2025/2026):

- Reajuste salarial 01/04 (data-base)
- Vale-refeição: R$ 25/dia útil
- Adicional insalubridade: 20% (NR-15)
- Adicional periculosidade: 30% (NR-16) — somente eletricidade/explosivos/inflamáveis
- Banco de horas: máximo 6 meses para compensação
- Aviso prévio: padrão CLT
- Multas convencionais: 1 salário-mínimo regional por descumprimento

---

## 5. eSocial — eventos obrigatórios

### Layout S-1.3 (versão 2026)

A plataforma deve enviar os seguintes eventos via gateway terceirizado (Pinhais ou Tagplus):

| Evento | Quando enviar | Prazo |
|---|---|---|
| **S-1000** | Cadastro do empregador (1x) | antes de qualquer outro |
| **S-1005** | Estabelecimentos | atualização cadastral |
| **S-1010** | Tabela de rubricas (folha) | antes do S-1200 |
| **S-1020** | Lotações tributárias | atualização cadastral |
| **S-1030** | Cargos / funções | antes do S-2200 |
| **S-2200** | **Admissão de trabalhador** | até **24h antes** do início |
| **S-2205** | Alteração cadastral | até dia 15 do mês seguinte |
| **S-2206** | Alteração de contrato | até dia 15 do mês seguinte |
| **S-2210** | **Acidente de trabalho (CAT)** | até 1º dia útil seguinte |
| **S-2220** | Monitoramento da saúde (ASO) | até dia 15 do mês seguinte |
| **S-2230** | Afastamento temporário | varia |
| **S-2240** | Condições ambientais (insalubridade) | até dia 15 do mês seguinte |
| **S-2299** | **Desligamento** | até **10 dias** ou D+1 (sem aviso) |
| **S-1200** | **Remuneração / folha** | até dia 15 do mês seguinte |
| **S-1210** | Pagamentos | até dia 15 |
| **S-1280** | Informações complementares | conforme caso |
| **S-1299** | Fechamento dos eventos periódicos | até dia 15 |

### Estratégia de implementação

1. **Usar gateway terceirizado** (Pinhais ou Tagplus) — abstrai mudanças de layout
2. **Tabela `esocial_eventos`** registra cada envio com XML, protocolo, recibo
3. **Edge Function** roda diariamente verificando eventos pendentes e enviando
4. **Webhook** `/api/webhook/esocial` recebe retornos do gateway
5. **Painel de monitoramento** com status (verde/amarelo/vermelho)
6. **Retentativas automáticas** em caso de rejeição transitória

### Custo

- **Pinhais**: a partir de R$ 0,50/evento
- **Tagplus**: a partir de R$ 0,35/evento

Para Aurora (128 empregados): ~150 eventos/mês = **R$ 75/mês** custo eSocial.

### Erros comuns no eSocial

| Código | Erro | Solução |
|---|---|---|
| MS001 | Schema XML inválido | validar XML antes de enviar |
| MS003 | Empregador não cadastrado | enviar S-1000 primeiro |
| MS028 | CPF inválido | validar dígito |
| MS091 | Vínculo não encontrado | enviar S-2200 primeiro |
| MS220 | Rubrica não cadastrada | enviar S-1010 |
| EFD-Reinf | Inconsistência | sincronizar com Receita |

---

## 6. Integrações brasileiras

### Sienge ERP (construção civil)

**Necessário para tenants de construção** (Aurora etc.) — sincroniza com o ERP de obra.

- **Sienge Cloud**: API REST com OAuth
- **Sienge On-Premise**: API SOAP (legado)
- **Dados sincronizados**:
  - Centros de custo (obra A, obra B)
  - Apropriação de horas (espelhos de ponto → medições)
  - Folha consolidada (exportação CSV mensal)
  - Suprimentos × empregados alocados

**Implementação**:
- Adapter em `/lib/integrations/sienge.ts`
- OAuth via Supabase Vault (encrypted)
- Sincronização incremental (cron diário)
- Mapeamento de centros de custo configurável

**Custo**: licença Sienge é do cliente (Oi Nora não cobra extra · valor agregado)

### eSocial gateway (Pinhais ou Tagplus)

Já detalhado na seção 5.

### PJe / e-SAJ (jurídico — opcional fase 2)

**Sistema Processo Judicial Eletrônico** (todos os tribunais brasileiros).

- **API CNJ**: consulta pública de andamentos por CNJ
- **Datajud** (CNJ): API estatística
- **PJe Office**: para peticionamento eletrônico (requer certificado digital A3)

**Implementação fase 5** (Jurídico):
- Cron diário consulta andamentos novos via API CNJ
- Sincroniza com `processo_andamentos`
- Notifica advogado quando há movimento
- Cadastro de processo aceita CNJ e pré-preenche dados via API

**Custo**: API CNJ é gratuita.

### Resend (emails transacionais)

- **Preço**: R$ 0,001/email (≈ 1.000 emails grátis/mês)
- **Volume Aurora**: ~3.000 emails/mês (R$ 3/mês)
- Templates em React Email

### Stripe (pagamentos)

- **Taxas**: 4,99% + R$ 0,39 por transação aprovada
- **Boleto**: 3,49% + R$ 3,49
- **Pix**: 0,99% (sem taxa fixa)
- **Subscriptions**: gestão automática + customer portal
- **Webhooks** essenciais: `customer.subscription.*`, `invoice.payment_*`

### DataValid / Serpro (validação CPF + biometria)

**Opcional · MVP 4+** (para reconhecimento facial no ponto):

- **Validação CPF + nome**: R$ 0,05/consulta
- **Biometria facial**: R$ 0,80/match
- **Liveness detection**: R$ 1,20/teste

Volume Aurora: ~3.840 batidas/mês × biometria = R$ 3.072/mês (alto demais — só Premium)

**Alternativa**: usar apenas geofence + foto (sem biometria) no MVP 4. Biometria fica para roadmap 2027.

### Anthropic API (Nora·IA)

- **Claude Opus 4.7**: $15/MTok input, $75/MTok output
- **Claude Sonnet 4.6**: $3/MTok input, $15/MTok output
- **Claude Haiku 4.5**: $0.80/MTok input, $4/MTok output

Câmbio jan/2026 ≈ R$ 5,00/USD.

**Volume Aurora (Premium)**:
- Triagem CV (Haiku): 500/mês × 2k tokens = R$ 80/mês
- Sugestão vaga (Sonnet): 50/mês × 4k = R$ 60
- Cálculo risco processo (Opus): 200/mês × 8k = R$ 1.200
- Sugestão acordo (Opus): 50/mês × 8k = R$ 300
- Análise quadro (Sonnet): 12/ano × 16k = R$ 6
- Chat Nora streaming (Sonnet): 5.000/mês × 2k = R$ 200

**Total**: ~R$ 1.846/mês para Aurora Premium.

⚠️ **Atenção**: a estimativa inicial do `PROMPTS_CODEX.md` (R$ 410/mês) foi conservadora. Com uso real esperado, o custo IA da Aurora Premium fica entre **R$ 1.500-2.000/mês**.

**Margem ajustada Premium**:
- Receita: R$ 4.990
- Custos diretos: R$ 200 (Supabase) + R$ 75 (eSocial) + R$ 50 (Resend/Stripe) + **R$ 1.846 (IA)** = R$ 2.171
- **Margem bruta: 56%** (não 85% como estimado inicialmente)

**Soluções**:
1. **Cache agressivo** em chamadas IA (pode reduzir 40% do custo)
2. **Limites no plano** (ex: Premium = 500 triagens, 50 cálculos risco, 10k mensagens chat)
3. **Cobrança por excedente** (R$ 0,10/chamada Opus extra)
4. **Subir preço Premium para R$ 5.990** se necessário

### Voyage AI (embeddings)

- **voyage-3**: $0.06/MTok
- Embeddings de CVs: 1.000/mês × 4k tokens = R$ 1,20/mês (irrelevante)

---

## 7. Compliance e regulações

### LGPD (Lei 13.709/2018)

**Obrigações**:
- Consentimento explícito ao coletar dados (candidato no portal)
- Direito de acesso (empregado pode ver seus dados)
- Direito de retificação (empregado pede correção)
- Direito de portabilidade (download de todos os dados em PDF/JSON)
- Direito ao esquecimento (deleção após desligamento + período legal)
- Audit log completo

**DPO obrigatório**: Cláudia indica DPO interno + DPO de cada tenant.

### eSocial (Decreto 8.373/2014)

Implementação obrigatória para empresas com qualquer empregado CLT.

### Reforma Trabalhista 2017 (Lei 13.467/2017)

- Banco de horas individual permitido (até 6 meses)
- Acordo Art. 484-A (rescisão por acordo mútuo)
- Negociação coletiva pode reduzir intervalos
- Trabalho intermitente legalizado

### NR-1 atualizada (Portaria SEPRT 6.730/2020)

- Gerenciamento de riscos ocupacionais (GRO)
- Programa de gerenciamento de riscos (PGR) substitui PPRA

### PCMSO atualizado (NR-7)

- Atestado de Saúde Ocupacional (ASO) periódico, admissional, demissional
- Validade: 1 ano (depende da função e exposição)

---

## 8. Datas oficiais do universo (use no seed e nos testes)

| Data | Evento | Persona |
|---|---|---|
| **15/02/2014** | José Roberto admitido como pedreiro | José Roberto |
| **15/03/2022** | Fernando entra como Eng. Civil Sr | Fernando |
| **10/03/2022** | José Roberto desligado sem justa causa | José Roberto |
| **02/03/2026** | Fernanda Toledo admitida (Analista R&S Jr) | Fernanda |
| **04/05/2026** | Daniel Pereira admitido (Eng. Pleno) | Daniel |
| **15/05/2026** | João Sampaio pede demissão | João |
| **22/05/2026** | Marcos Reis rescisão Art. 484-A | Marcos |
| **22/05/2026** | João Sampaio ajuíza ação rescisão indireta | João |
| **23/05/2026** | Paula recebe contrato + S-2200 enviado | Paula |
| **26/05/2026** | **HOJE** · Paula DIA 1 · audiência José Roberto 14:30 | – |
| **01/07/2026** | Letícia admitida (vaga #2026-0042) | Letícia |
| **02/08/2026** | Fernando conclui trilha BIM + promoção | Fernando |
| **10/2026** | Pico operacional Vila Aurora (154 empregados) | – |
| **01/04/2027** | Data-base SINTRAICCMG · reajuste +5% | todos |

### NRs com vencimento crítico (referenciadas em alertas)

- **Marcelo Andrade Lima**: NR-18 venceu 12/05/2026 (**14 dias atrasado**)
- **Henrique Lopes**: NR-35 venceu 18/05/2026 (8 dias atrasado)
- **Roberto Almeida**: NR-18 vence 27/05/2026 (amanhã)

---

## 9. Casos de teste obrigatórios (E2E)

O agente Codex deve construir e validar os seguintes cenários ponta-a-ponta:

### Cenário 1: Onboarding novo tenant (E2E)

```
1. Cláudia (super_admin) cria tenant "Construtora Aurora" com Roberto como owner
2. Roberto recebe magic link, cria senha, faz login pela 1ª vez
3. Sistema mostra tour de onboarding em 3 passos
4. Roberto convida Carla (admin), Bruna (hr_ops), Luísa (gestor)
5. Roberto seleciona plano Premium · trial 14 dias
6. Sistema cria seed de cargos, departamentos, jornadas padrão
7. Roberto cadastra primeiro empregado: ele mesmo
```

### Cenário 2: Recrutar Letícia (E2E)

```
1. Roberto solicita vaga afirmativa Eng. Civil Pleno para Luísa
2. Luísa cria vaga via wizard, sugere descrição com IA
3. Roberto aprova (acima de 30k → workflow)
4. Vaga publicada · #2026-0042
5. Letícia entra no portal, vê vaga, faz upload CV PDF
6. IA gera score 87% match
7. Mariana triagem · agendar entrevista
8. Pipeline: aplicado → triagem → entrevista_rec → entrevista_gestor → proposta
9. Proposta R$ 9.500 enviada · Letícia aceita
10. Sistema cria empregado Letícia · tenant Aurora · cargo Eng. Pleno
11. Onboarding automático aplicado (template Eng. Civil Pleno)
12. eSocial S-2200 enviado em 30/06 (1 dia antes da admissão)
```

### Cenário 3: Fechar folha de maio (E2E)

```
1. Dia 1/06 · Bruna abre competência 05/2026
2. Sistema importa ponto fechado · gera holerites preview
3. Bruna lança eventos manuais (prêmio Carla R$ 500)
4. Bruna marca como "calculada"
5. Carla (admin) abre conferência · valida totalizadores
6. Carla detecta variação Fernando +18% vs abril (banco de horas)
7. Carla marca "conferida"
8. Roberto fecha folha · sistema gera 128 PDFs
9. Holerites liberados aos empregados no app
10. S-1200 enviado ao eSocial em até 15/06
11. Total: R$ 2.789.000 (deve bater)
```

### Cenário 4: Dr. Henrique cadastra novo processo (E2E)

```
1. Dr. Henrique loga · vê dashboard das 3 empresas que atende
2. Seleciona Aurora · clica "+ Cadastrar processo"
3. Wizard passo 1: CNJ 0033456-78.2026.5.03.0021, vara, juiz
4. Wizard passo 2: autocomplete José Augusto Mendes pelo CPF
   - sistema encontra ex-empregado Aurora (MAT histórica 0067)
   - vincula automaticamente
5. Wizard passo 3: IA classifica POSSÍVEL · valor R$ 168.500 · provisão R$ 84k
6. IA encontra processo José Roberto Pinheiro como 83% similar
7. Sugere estratégia: acordo R$ 60-80k · economia ~R$ 75k
8. Wizard passo 4: anexa petição inicial PDF
9. Salva · sistema cria processo + provisão contábil
10. Roberto Aurora é notificado por email · vê resumo no dashboard
11. Audit log registra acesso de Dr. Henrique aos dados da Aurora
```

### Cenário 5: Bloqueio de ponto por NR vencida (E2E)

```
1. Marcelo (NR-18 venceu 12/05) tenta bater ponto em Sítio II via app
2. App identifica geofence Sítio II · obra
3. Sistema verifica NR-18: VENCIDA HÁ 14 DIAS
4. App MOSTRA alerta: "Bloqueio · NR-18 vencida"
5. Marcelo NÃO consegue bater ponto
6. Sistema notifica Bruna (HR Ops) + Roberto (RH)
7. Alerta vermelho no dashboard "3 NRs vencidos"
8. Marcelo é redirecionado para o catálogo de cursos → curso NR-18
```

---

## 10. Glossário (termos brasileiros que o agente deve conhecer)

| Termo | Significado |
|---|---|
| **CCT** | Convenção Coletiva de Trabalho |
| **ACT** | Acordo Coletivo de Trabalho |
| **CTPS** | Carteira de Trabalho e Previdência Social |
| **CBO** | Classificação Brasileira de Ocupações |
| **CNAE** | Classificação Nacional de Atividades Econômicas |
| **CNJ** | Conselho Nacional de Justiça (formato do número de processo) |
| **CPC 25** | Pronunciamento Contábil sobre provisões (provável/possível/remoto) |
| **CAT** | Comunicação de Acidente do Trabalho |
| **FAP** | Fator Acidentário de Prevenção (impacto na contribuição patronal) |
| **RAT** | Risco de Acidente do Trabalho (1%, 2%, 3% por CNAE) |
| **TRT-3** | Tribunal Regional do Trabalho da 3ª Região (Minas Gerais) |
| **OAB** | Ordem dos Advogados do Brasil |
| **ASO** | Atestado de Saúde Ocupacional |
| **PCMSO** | Programa de Controle Médico de Saúde Ocupacional |
| **PGR** | Programa de Gerenciamento de Riscos |
| **PIS/PASEP** | Programa de Integração Social |
| **DSR** | Descanso Semanal Remunerado |
| **HE** | Horas Extras |
| **DARF** | Documento de Arrecadação Federal |
| **GFIP** | Guia de Recolhimento do FGTS |
| **GPS** | Guia da Previdência Social |
| **CAGED** | Cadastro Geral de Empregados e Desempregados (extinto, agora via eSocial) |
| **RAIS** | Relação Anual de Informações Sociais |
| **DIRF** | Declaração do Imposto de Renda Retido na Fonte |
| **SST** | Saúde e Segurança do Trabalho |
| **CIPA** | Comissão Interna de Prevenção de Acidentes |
| **PJe** | Processo Judicial Eletrônico |
| **e-SAJ** | Sistema de Automação da Justiça |
| **Datajud** | Painel estatístico do CNJ |
| **EFD-Reinf** | Escrituração Fiscal Digital de Retenções |
| **Sienge** | ERP de construção civil mais usado no BR |
| **MTE** | Ministério do Trabalho e Emprego |
| **NR** | Norma Regulamentadora (NR-1 a NR-37) |
| **SINTRAICCMG** | Sindicato dos Trabalhadores na Indústria da Construção Civil de MG |

---

## 11. O que NÃO está no protótipo (vai surgir no desenvolvimento)

Algumas coisas o protótipo HTML não cobre mas o sistema real precisa:

1. **Recuperação de senha** (esqueci minha senha)
2. **Confirmação de email** após signup
3. **Two-factor authentication** (2FA) — Premium
4. **Sessões ativas** (revogar dispositivos)
5. **Notificações push web** + emails recorrentes
6. **Modo escuro** (dark mode) — fora do escopo MVP
7. **Múltiplos idiomas** (i18n) — só PT-BR no MVP
8. **Acessibilidade**: leitor de tela, navegação por teclado completa
9. **Impressão**: holerite, recibo de férias, TRCT
10. **Importação em massa**: CSV de empregados, planilhas Excel
11. **Backup e restore**: pelo cliente (Premium)
12. **API REST + webhooks**: Premium
13. **SSO**: Google, Microsoft, SAML (Premium)
14. **Trail audit downloadable**: exportar audit_log por período

---

## 12. Anti-patterns e armadilhas

### ⚠️ Coisas para NÃO fazer

1. **Calcular folha sem CCT do tenant**: cada construtora tem CCT diferente · use sempre a configuração do tenant
2. **Confiar em datas do client**: tempo oficial vem do servidor (`new Date()` no servidor, não no cliente)
3. **Acreditar no client para autorização**: sempre revalidar no servidor (RLS + middleware + Server Action)
4. **Misturar tenants em query**: sempre filtrar por `tenant_id` mesmo com RLS (defesa em camadas)
5. **Inventar regra trabalhista**: consulte fonte oficial (gov.br) ou hardcode em `/lib/clt/regras.ts`
6. **Considerar mês "comercial" de 30 dias**: usa o mês civil real (30, 31, 28 ou 29)
7. **Esquecer fuso horário**: salvar UTC, exibir `America/Sao_Paulo`
8. **Cálculo monetário em float**: usar SEMPRE `BIGINT` (centavos) ou `decimal.js`
9. **CPF/CNPJ com máscara no banco**: salvar apenas dígitos · formatar na UI
10. **Confiar que o eSocial nunca falha**: sempre logue + retry + alerta

### ⚠️ Erros comuns de IA (Nora)

1. **IA dá conselho jurídico definitivo**: SEMPRE deve ressaltar "sugestão · validar com advogado"
2. **IA inventa CNJ ou jurisprudência**: forçar verificação · TST tem padrão de Súmulas/OJs reais
3. **IA não lembra da CCT**: incluir CCT do tenant no contexto da prompt
4. **IA mistura tenants**: nunca passe dados de outro tenant na prompt
5. **IA recomenda violar LGPD**: prompts devem ter guardrails

---

## 13. Sucesso técnico

O produto Oi Nora será considerado tecnicamente sólido quando:

- ✅ Tempo de resposta P95 < 300ms (queries simples) e < 2s (dashboards com IA)
- ✅ Disponibilidade ≥ 99.5% (Profissional) / 99.9% (Premium)
- ✅ Zero incidentes de vazamento de dados entre tenants em 12 meses
- ✅ Todas as ações sensíveis logadas em audit_log
- ✅ S-1200 enviado a tempo em 99% dos meses
- ✅ Folha bate matematicamente com cálculos manuais (0 centavos de divergência)
- ✅ Sistema operacional para Aurora real em 90 dias após contrato
- ✅ Tour guiado para novo cliente leva < 15 min

---

🤖 Oi Nora · Briefing Técnico v2 · 2026
