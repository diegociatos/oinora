# MATRIZ_PERMISSOES.md
## Sistema de papéis e permissões · Oi Nora v2

> Define os **10 papéis** do sistema, suas permissões granulares e como implementar via Row Level Security (RLS) no Supabase. Atualizado para incluir o módulo Jurídico Trabalhista.

---

## 1. Os 10 papéis

### Visão geral

| # | Papel (role) | Quem usa | Escopo | Persona-exemplo |
|---|---|---|---|---|
| 1 | `super_admin` | Oi Nora | **Global · todos tenants** | Cláudia Vasconcelos · CEO |
| 2 | `recrutador_oinora` | Oi Nora | **Vários tenants** que atende | Mariana Costa · Recrutadora Sr |
| 3 | `owner` | Empresa-cliente | **Seu tenant** (1 por tenant) | Roberto Aurora · Dir. RH |
| 4 | `admin` | Empresa-cliente | Seu tenant | Carla Aurora · Coord. RH |
| 5 | `gestor` | Empresa-cliente | Sua **equipe direta** | Luísa Mendonça · Dir. Eng. |
| 6 | `hr_ops` | Empresa-cliente | Seu tenant (operacional) | Bruna Lima · DP |
| 7 | `empregado` | Empresa-cliente | **Apenas seus dados** | Fernando Lacerda · Eng. Civil Sr |
| 8 | `candidato` | Externo | **Apenas suas candidaturas** | Letícia Ferraz · candidata |
| 9 | `advogado_externo` | Escritório terceirizado | **Tenants que o escritório atende** | Dr. Henrique Vasconcellos · OAB/MG 78.452 |
| 10 | `advogado_interno` | Empresa-cliente | Seu tenant (jurídico) | Advogado CLT da empresa |

### Princípios

- **Um usuário pode ter múltiplos papéis em múltiplos tenants** (via `tenant_memberships`)
- **Mariana** pode ser `recrutador_oinora` para Aurora e Pluma simultaneamente
- **Dr. Henrique** pode ser `advogado_externo` para 3 tenants (Aurora, Horizonte, Pluma)
- **Roberto** é `owner` apenas da Aurora
- **Fernando** é `empregado` da Aurora (não tem acesso a outros tenants)
- Roles são acumulativos: alguém pode ser `empregado` E `gestor` ao mesmo tempo

---

## 2. Matriz de permissões por módulo

### Legenda

- ✅ **Total**: criar, ler, atualizar, deletar
- 👁 **Ler**: apenas visualizar
- ✏️ **Editar**: ler + atualizar (sem criar/deletar)
- 🔒 **Próprio**: apenas seus próprios dados
- 🚫 **Bloqueado**
- ⚠️ **Condicional**: depende de regra adicional (ex: aprovação)

### Módulo: **Empresa & Configurações**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Dados cadastrais empresa | ✅ | 👁 | ✅ | ✏️ | 🚫 | 👁 | 🚫 | 🚫 | 👁 | 👁 |
| Logo da empresa | ✅ | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Plano e módulos ativos | ✅ | 🚫 | ✏️ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Departamentos | ✅ | 🚫 | ✅ | ✅ | 👁 | 👁 | 👁 | 🚫 | 🚫 | 🚫 |
| Cargos | ✅ | 👁 | ✅ | ✅ | 👁 | 👁 | 👁 | 🚫 | 🚫 | 🚫 |
| Centros de custo | ✅ | 🚫 | ✅ | ✅ | 👁 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |
| Locais de trabalho | ✅ | 🚫 | ✅ | ✅ | 👁 | 👁 | 👁 | 🚫 | 🚫 | 🚫 |
| Jornadas | ✅ | 🚫 | ✅ | ✅ | 👁 | ✏️ | 👁 | 🚫 | 🚫 | 🚫 |
| Políticas (férias, banco horas) | ✅ | 🚫 | ✅ | ✏️ | 🚫 | 👁 | 👁 | 🚫 | 🚫 | 🚫 |
| Convenções coletivas (CCT) | ✅ | 🚫 | ✅ | ✏️ | 🚫 | 👁 | 👁 | 🚫 | 🚫 | ✏️ |

### Módulo: **Usuários & Permissões**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Convidar usuários | ✅ | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Atribuir role `owner` | ✅ | 🚫 | ⚠️* | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Atribuir roles admin/gestor/hr_ops | ✅ | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Atribuir role advogado_externo | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Suspender / reativar usuário | ✅ | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver lista de usuários | ✅ | 👁 | ✅ | ✅ | 👁 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |
| Audit log de usuários | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

*Transferência de ownership requer confirmação por email + senha do owner atual.*

### Módulo: **Empregados (Ficha de Pessoa)**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Listar empregados | 👁 | 👁 | ✅ | ✅ | 👁¹ | ✅ | 🚫 | 🚫 | 👁³ | 👁 |
| Criar empregado | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver dados pessoais (CPF, RG, endereço, banco) | 👁 | 🚫 | 👁 | 👁 | 🚫 | 👁 | 🔒 | 🚫 | 🚫 | 🚫 |
| Editar dados pessoais | 🚫 | 🚫 | ✏️ | ✏️ | 🚫 | ✏️ | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver vínculo (cargo, salário) | 👁 | 🚫 | 👁 | 👁 | 👁¹ | 👁 | 🔒 | 🚫 | 👁³ | 👁 |
| Editar vínculo (mudança cargo/salário) | 🚫 | 🚫 | ⚠️² | ⚠️² | 🚫 | ⚠️² | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver dependentes | 🚫 | 🚫 | 👁 | 👁 | 🚫 | 👁 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver documentos (RG, CTPS, ASO) | 👁 | 🚫 | 👁 | 👁 | 🚫 | 👁 | 🔒 | 🚫 | 🚫 | 🚫 |
| Anexar documentos | 🚫 | 🚫 | ✏️ | ✏️ | 🚫 | ✏️ | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver histórico (movimentações) | 👁 | 🚫 | 👁 | 👁 | 👁¹ | 👁 | 🔒 | 🚫 | 👁³ | 👁³ |
| Desligar empregado | 🚫 | 🚫 | ⚠️² | ⚠️² | 🚫 | ⚠️² | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver foto | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁⁴ | 🚫 | 👁 | 👁 |

*¹ Gestor vê apenas empregados de sua hierarquia (FK `gestor_id`).*
*² Mudança de cargo ou salário requer workflow de aprovação (definir em `fluxos_aprovacao`).*
*³ Advogado externo vê apenas empregados envolvidos em processos. Advogado interno vê apenas dados relevantes (CPF, vínculo, histórico).*
*⁴ Empregado vê fotos de outros empregados do mesmo tenant (organograma público).*

### Módulo: **Recrutamento (ATS)**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Criar vaga | 🚫 | ✅⁵ | ✅ | ✅ | ⚠️⁶ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Aprovar vaga | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Publicar vaga | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Editar vaga | 🚫 | ✏️ | ✅ | ✅ | ⚠️⁶ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Cancelar vaga | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver pipeline de candidatos | 🚫 | 👁⁵ | 👁 | 👁 | 👁⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Mover candidato no pipeline | 🚫 | ✅ | ✅ | ✅ | ⚠️⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver dados do candidato (CV, CPF) | 🚫 | 👁⁵ | 👁 | 👁 | 👁⁷ | 🚫 | 🚫 | 🔒 | 🚫 | 🚫 |
| Enviar proposta | 🚫 | ✏️ | ✅ | ✅ | ⚠️⁶⁸ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Contratar (criar empregado) | 🚫 | ✅⁵ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Banco de talentos (busca) | 🚫 | 👁 | 👁 | 👁 | 👁⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Listar vagas públicas | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 |
| Candidatar-se à vaga | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 |
| Ver minhas candidaturas | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🔒 | 🚫 | 🚫 |

*⁵ Recrutador Oi Nora age em nome do tenant. Vê só vagas dos tenants que atende.*
*⁶ Gestor pode criar vaga para sua equipe, sujeita à aprovação do owner.*
*⁷ Gestor vê pipeline apenas das vagas de sua área.*
*⁸ Proposta acima do range salarial requer aprovação CFO ou owner.*

### Módulo: **Folha de Pagamento**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Ver dashboard folha | 👁 | 🚫 | 👁 | 👁 | 🚫 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |
| Abrir competência | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Calcular folha | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Lançar eventos manuais | 🚫 | 🚫 | ✏️ | ✏️ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Conferir folha (workflow 4-eyes) | 🚫 | 🚫 | ⚠️⁹ | ⚠️⁹ | 🚫 | ⚠️⁹ | 🚫 | 🚫 | 🚫 | 🚫 |
| Fechar folha | 🚫 | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Reabrir folha | 🚫 | 🚫 | ⚠️¹⁰ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver holerite (próprio) | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver holerite (de outro) | 👁 | 🚫 | 👁 | 👁 | 🚫 | 👁 | 🚫 | 🚫 | ⚠️¹¹ | ⚠️¹¹ |
| Liberar holerites aos empregados | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Gerar relatórios contábeis | 🚫 | 🚫 | 👁 | 👁 | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Exportar para Sienge | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Enviar S-1200 eSocial | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

*⁹ Quem calcula NÃO pode conferir (princípio 4-eyes).*
*¹⁰ Reabertura de folha fechada exige justificativa + audit log destacado.*
*¹¹ Advogados veem holerite apenas se for documento de processo onde o empregado é parte.*

### Módulo: **Ponto Eletrônico**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Bater ponto (próprio) | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver espelho próprio | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver espelho de outro empregado | 👁 | 🚫 | 👁 | 👁 | 👁⁷ | 👁 | 🚫 | 🚫 | ⚠️¹¹ | ⚠️¹¹ |
| Solicitar ajuste de ponto | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Aprovar ajustes solicitados | 🚫 | 🚫 | ✅ | ✅ | ⚠️⁷ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Override (forçar ajuste) | 🚫 | 🚫 | ✅ | 🚫 | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver banco de horas | 🚫 | 🚫 | 👁 | 👁 | 👁⁷ | 👁 | 🔒 | 🚫 | 🚫 | 🚫 |
| Fechar competência de ponto | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Geofence / configurar locais | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Módulo: **Onboarding**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Criar template de onboarding | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Aplicar template a empregado | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver onboarding (próprio) | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver onboarding (de mentorado) | 🚫 | 🚫 | 👁 | 👁 | 👁¹² | 👁 | 👁¹² | 🚫 | 🚫 | 🚫 |
| Marcar item como concluído | 🚫 | 🚫 | ✏️ | ✏️ | ✏️¹² | ✏️ | 🔒¹³ | 🚫 | 🚫 | 🚫 |
| Dashboard onboardings em andamento | 🚫 | 🚫 | 👁 | 👁 | 👁¹² | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |

*¹² Mentor (que pode ser gestor ou outro empregado) vê e marca itens do mentorado.*
*¹³ Empregado pode marcar apenas itens marcados como "responsável: empregado".*

### Módulo: **Treinamentos & Trilhas**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Configurar trilhas | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Importar curso do catálogo Oi Nora | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Atribuir curso a empregado | 🚫 | 🚫 | ✅ | ✅ | ⚠️¹⁴ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver catálogo | 🚫 | 🚫 | 👁 | 👁 | 👁 | 👁 | 👁 | 🚫 | 🚫 | 🚫 |
| Fazer curso (próprio) | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Inscrever-se em curso opcional | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver progresso (próprio) | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver progresso (de outros) | 👁 | 🚫 | 👁 | 👁 | 👁⁷ | 👁 | 🚫 | 🚫 | ⚠️¹¹ | 🚫 |
| Dashboard conformidade NR | 👁 | 🚫 | 👁 | 👁 | 👁⁷ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |
| Enviar S-2210 eSocial | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Emitir certificado | Auto | 🚫 | 👁 | 👁 | 🚫 | 👁 | 🔒 | 🚫 | 🚫 | 🚫 |

*¹⁴ Gestor atribui cursos a sua equipe direta apenas.*

### Módulo: **Headcount & Quadro**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Ver dashboard headcount | 👁 | 🚫 | 👁 | 👁 | 👁⁷ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |
| Configurar quadro autorizado | 🚫 | 🚫 | ✅ | ✏️ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Aumentar headcount autorizado | 🚫 | 🚫 | ⚠️¹⁵ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver projeção 12 meses | 🚫 | 🚫 | 👁 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Editar cenários de projeção | 🚫 | 🚫 | ✅ | ✏️ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver movimentações | 👁 | 🚫 | 👁 | 👁 | 👁⁷ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 |
| Aprovar promoções/reajustes | 🚫 | 🚫 | ⚠️² | ⚠️² | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Exportar relatório p/ CFO | 🚫 | 🚫 | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Enviar CAGED | 🚫 | 🚫 | ✅ | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

*¹⁵ Aumentar quadro autorizado requer aprovação CFO (configurável em `fluxos_aprovacao`).*

### Módulo: **Avaliação & PDI**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Criar ciclo de avaliação | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Avaliar (gestor → empregado) | 🚫 | 🚫 | ⚠️¹⁶ | ⚠️¹⁶ | ✅⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Autoavaliação | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Avaliação 360 (pares/subordinados) | 🚫 | 🚫 | ✏️ | ✏️ | ✏️⁷ | 🚫 | ✏️¹⁷ | 🚫 | 🚫 | 🚫 |
| Ver 9-Box | 🚫 | 🚫 | 👁 | 👁 | 👁⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Calibração 9-Box | 🚫 | 🚫 | ✅ | ✅ | ✏️⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver PDI (próprio) | 🚫 | 🚫 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 |
| Ver PDI (da equipe) | 🚫 | 🚫 | 👁 | 👁 | 👁⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Editar PDI | 🚫 | 🚫 | ✏️ | ✏️ | ✏️⁷ | 🚫 | ✏️¹⁸ | 🚫 | 🚫 | 🚫 |

*¹⁶ Owner/admin pode avaliar empregados quando é gestor direto (override).*
*¹⁷ Empregado responde 360 quando convidado a avaliar par ou subordinado.*
*¹⁸ Empregado edita PDI próprio em conjunto com gestor (workflow colaborativo).*

### Módulo: **Jurídico Trabalhista**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Ver dashboard jurídico | 👁 | 🚫 | 👁¹⁹ | 👁¹⁹ | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Listar processos | 👁 | 🚫 | 👁¹⁹ | 👁¹⁹ | 🚫 | 🚫 | 🚫 | 🚫 | 👁²⁰ | 👁 |
| Cadastrar processo | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Editar processo | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✏️²⁰ | ✏️ |
| Ver ficha do processo | 👁 | 🚫 | 👁²¹ | 👁²¹ | 🚫 | 🚫 | 🚫 | 🚫 | 👁²⁰ | 👁 |
| Registrar andamentos | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Anexar documentos | 🚫 | 🚫 | ✏️²² | ✏️²² | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Calcular risco IA | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Anotações privadas (escritório) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰²³ | 🚫 |
| Anotações privadas (tenant) | 🚫 | 🚫 | ✅ | ✏️ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Comentar / responder advogado | 🚫 | 🚫 | ✏️ | ✏️ | 🚫 | 🚫 | 🚫 | 🚫 | ✏️ | ✏️ |
| Cadastrar acordo | 🚫 | 🚫 | ⚠️²⁴ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Aprovar acordo (financeiro) | 🚫 | 🚫 | ⚠️²⁴ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver provisão contábil | 👁 | 🚫 | 👁 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 👁²⁰ | 👁 |
| Exportar relatório mensal | 🚫 | 🚫 | 👁 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | ✅²⁰ | ✅ |
| Integração ficha ex-empregado | 🚫 | 🚫 | 👁 | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 👁²⁵ | 👁²⁵ |

*¹⁹ Tenant vê apenas processos contra a sua empresa.*
*²⁰ Advogado externo vê apenas processos dos tenants do seu escritório.*
*²¹ Tenant vê ficha mas NÃO vê anotações privadas do escritório.*
*²² Tenant pode anexar documentos próprios (ex: contracheques) mas não peças do advogado.*
*²³ Anotações privadas do escritório nunca são visíveis ao tenant.*
*²⁴ Acordo acima de R$ 50k requer aprovação CFO.*
*²⁵ Acesso à ficha histórica do empregado é registrado no audit_log com motivo justificado.*

### Módulo: **Console Oi Nora (super_admin)**

| Recurso | super_admin | recrutador_oinora | owner | admin | gestor | hr_ops | empregado | candidato | adv_ext | adv_int |
|---|---|---|---|---|---|---|---|---|---|---|
| Ver todos tenants | ✅ | 👁²⁶ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Criar tenant | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Suspender tenant | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Cancelar tenant | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Mudar plano de tenant | ✅ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver MRR, ARR, churn | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver custo IA por tenant | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Acessar dados de tenant | ✅²⁷ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Ver audit log global | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Tickets de suporte | ✅ | 👁 | ✏️ | ✏️ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

*²⁶ Recrutador vê apenas tenants que atende.*
*²⁷ Super admin acessando dados de tenant gera registro destacado no audit_log (compliance LGPD).*

---

## 3. Workflows de aprovação (`fluxos_aprovacao`)

Algumas ações requerem aprovação multi-papel. Exemplos:

### Mudança de cargo/salário do empregado

```
solicitante (gestor ou admin)
  → aprovador 1: gestor direto da pessoa
    → aprovador 2: dir. financeiro (Eduardo)
      → aprovador 3: owner (Roberto)
```

Configurável: aprovação só obrigatória se aumento > 15% OU acima do range salarial.

### Criação de vaga afirmativa

```
solicitante (gestor)
  → aprovador 1: dir. RH (Roberto)
    → aprovador 2: dir. financeiro (Eduardo · se acima orçamento)
```

### Acordo jurídico > R$ 50.000

```
solicitante (advogado externo)
  → aprovador 1: dir. RH (Roberto)
    → aprovador 2: dir. financeiro (Eduardo)
      → aprovador 3: CEO (Alfredo)
```

### Fechamento de folha

```
calculador (hr_ops ou admin)
  → conferente (admin · diferente do calculador · princípio 4-eyes)
    → fechador (owner)
```

### Aumento de headcount autorizado

```
solicitante (owner ou admin)
  → aprovador 1: dir. financeiro (Eduardo)
    → registro: CEO informado por email
```

### Estrutura da tabela `fluxos_aprovacao`

```sql
CREATE TABLE fluxos_aprovacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,                     -- ex: 'empregado.mudanca_salario'
  condicao JSONB,                         -- ex: {"aumento_pct": ">15"}
  passos JSONB NOT NULL,                  -- array ordenado de aprovadores
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aprovacoes_pendentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  fluxo_id UUID NOT NULL REFERENCES fluxos_aprovacao(id),
  recurso_tipo TEXT NOT NULL,             -- empregado, vaga, acordo
  recurso_id UUID NOT NULL,
  passo_atual INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pendente',  -- pendente, aprovada, rejeitada
  solicitante_id UUID REFERENCES usuarios(id),
  dados_solicitacao JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aprovacao_decisoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aprovacao_id UUID NOT NULL REFERENCES aprovacoes_pendentes(id) ON DELETE CASCADE,
  aprovador_id UUID REFERENCES usuarios(id),
  decisao VARCHAR(20),                    -- aprovada, rejeitada, devolvida
  comentario TEXT,
  decidido_em TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Implementação RLS (PostgreSQL)

### Funções auxiliares (criar 1 vez)

```sql
-- Tenant ativo do usuário
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_memberships
  WHERE usuario_id = auth.uid() AND ativo = TRUE
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Role atual
CREATE OR REPLACE FUNCTION auth_role() RETURNS role AS $$
  SELECT role FROM tenant_memberships
  WHERE usuario_id = auth.uid() AND tenant_id = auth_tenant_id() AND ativo = TRUE
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- É super admin?
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM tenant_memberships
    WHERE usuario_id = auth.uid() AND role = 'super_admin' AND ativo = TRUE);
$$ LANGUAGE sql STABLE;

-- É advogado externo deste tenant?
CREATE OR REPLACE FUNCTION is_advogado_externo_de(t_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM tenant_memberships tm
    JOIN escritorio_tenants et ON et.tenant_id = t_id
    JOIN escritorios_juridicos e ON e.id = et.escritorio_id
    WHERE tm.usuario_id = auth.uid()
      AND tm.role = 'advogado_externo'
      AND tm.ativo = TRUE
      AND (et.data_fim IS NULL OR et.data_fim >= CURRENT_DATE)
  );
$$ LANGUAGE sql STABLE;

-- Empregado é da hierarquia do gestor logado?
CREATE OR REPLACE FUNCTION e_subordinado_de(empregado_id UUID) RETURNS BOOLEAN AS $$
  WITH RECURSIVE subordinados AS (
    SELECT id FROM empregados WHERE gestor_id = (
      SELECT id FROM empregados WHERE usuario_id = auth.uid() LIMIT 1
    )
    UNION
    SELECT e.id FROM empregados e
    JOIN subordinados s ON e.gestor_id = s.id
  )
  SELECT EXISTS(SELECT 1 FROM subordinados WHERE id = empregado_id);
$$ LANGUAGE sql STABLE;

-- É o próprio empregado?
CREATE OR REPLACE FUNCTION sou_eu(empregado_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM empregados
    WHERE id = empregado_id AND usuario_id = auth.uid());
$$ LANGUAGE sql STABLE;
```

### Padrões de policies (aplicar em todas tabelas tenant-aware)

```sql
-- SELECT padrão para todas as tabelas com tenant_id
CREATE POLICY <tabela>_select ON <tabela>
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = auth_tenant_id() AND auth_role() IN (<roles_permitidos>))
    OR (<condicoes_especiais>)
  );

-- INSERT padrão
CREATE POLICY <tabela>_insert ON <tabela>
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN (<roles_permitidos>)
  );

-- UPDATE padrão
CREATE POLICY <tabela>_update ON <tabela>
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN (<roles_permitidos>)
  );

-- DELETE padrão (mais restrito)
CREATE POLICY <tabela>_delete ON <tabela>
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'owner'
  );
```

### Exemplo completo: tabela `empregados`

```sql
-- Habilitar RLS
ALTER TABLE empregados ENABLE ROW LEVEL SECURITY;

-- SELECT: vários casos
CREATE POLICY empregados_select_padrao ON empregados
  FOR SELECT USING (
    is_super_admin()
    -- Owner, admin, hr_ops veem todos do seu tenant
    OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'))
    -- Gestor vê os seus subordinados (recursivo)
    OR (tenant_id = auth_tenant_id() AND auth_role() = 'gestor' AND e_subordinado_de(id))
    -- Empregado vê apenas si mesmo
    OR (tenant_id = auth_tenant_id() AND auth_role() = 'empregado' AND sou_eu(id))
    -- Advogado externo vê apenas se houver processo vinculado
    OR (is_advogado_externo_de(tenant_id) AND EXISTS(
      SELECT 1 FROM processos_juridicos p
      WHERE p.tenant_id = empregados.tenant_id
      AND p.reclamante_ex_empregado_id = empregados.id
    ))
  );

-- INSERT: owner, admin, hr_ops podem criar
CREATE POLICY empregados_insert ON empregados
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('owner', 'admin', 'hr_ops')
  );

-- UPDATE: vários casos
CREATE POLICY empregados_update_admin ON empregados
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('owner', 'admin', 'hr_ops')
  );

-- Empregado atualiza apenas dados de contato próprio (via Server Action filtrada)
CREATE POLICY empregados_update_self ON empregados
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'empregado'
    AND sou_eu(id)
  )
  WITH CHECK (
    -- Não permite mudar cargo/salário (campos protegidos via trigger BEFORE UPDATE)
    sou_eu(id)
  );

-- Trigger que bloqueia mudanças sensíveis quando o usuário é o próprio empregado
CREATE OR REPLACE FUNCTION protege_campos_sensiveis_empregado() RETURNS TRIGGER AS $$
BEGIN
  IF auth_role() = 'empregado' AND sou_eu(NEW.id) THEN
    -- Não permite mudar salário, cargo, status, matrícula
    IF OLD.salario_centavos IS DISTINCT FROM NEW.salario_centavos OR
       OLD.cargo_id IS DISTINCT FROM NEW.cargo_id OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.matricula IS DISTINCT FROM NEW.matricula OR
       OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
      RAISE EXCEPTION 'Empregado não pode alterar campos sensíveis';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protege_empregado BEFORE UPDATE ON empregados
  FOR EACH ROW EXECUTE FUNCTION protege_campos_sensiveis_empregado();
```

### Exemplo: processos jurídicos (mais complexo)

```sql
ALTER TABLE processos_juridicos ENABLE ROW LEVEL SECURITY;

-- SELECT: 3 grupos podem ver
CREATE POLICY processos_select ON processos_juridicos
  FOR SELECT USING (
    is_super_admin()
    -- Tenant: owner, admin, advogado_interno veem processos da empresa
    OR (tenant_id = auth_tenant_id()
        AND auth_role() IN ('owner', 'admin', 'advogado_interno'))
    -- Advogado externo vê processos das empresas que atende
    OR is_advogado_externo_de(tenant_id)
  );

-- INSERT: apenas advogados podem cadastrar
CREATE POLICY processos_insert ON processos_juridicos
  FOR INSERT WITH CHECK (
    is_advogado_externo_de(tenant_id)
    OR (tenant_id = auth_tenant_id() AND auth_role() = 'advogado_interno')
  );

-- UPDATE: apenas advogados podem atualizar
CREATE POLICY processos_update ON processos_juridicos
  FOR UPDATE USING (
    is_advogado_externo_de(tenant_id)
    OR (tenant_id = auth_tenant_id() AND auth_role() = 'advogado_interno')
  );

-- DELETE: apenas super_admin (auditoria)
CREATE POLICY processos_delete ON processos_juridicos
  FOR DELETE USING (is_super_admin());

-- ANOTAÇÕES PRIVADAS · isolamento crítico
ALTER TABLE processo_anotacoes_privadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY anotacoes_select ON processo_anotacoes_privadas
  FOR SELECT USING (
    -- Anotação de escritório: só advogado externo do escritório vê
    (privada_para = 'escritorio' AND is_advogado_externo_de(tenant_id))
    -- Anotação de tenant: só owner/admin/adv_interno do tenant veem
    OR (privada_para = 'tenant'
        AND tenant_id = auth_tenant_id()
        AND auth_role() IN ('owner', 'admin', 'advogado_interno'))
    -- O próprio autor sempre vê
    OR autor_id = auth.uid()
  );
```

---

## 5. Validação no servidor (Server Actions)

Mesmo com RLS, **sempre revalidar permissões em Server Actions** (defesa em camadas):

```typescript
// /server/actions/empregados.ts
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { canDo } from '@/lib/permissions';

const actionClient = createSafeActionClient({
  async middleware() {
    const session = await auth();
    if (!session) throw new Error('Não autenticado');
    return { user_id: session.user.id, tenant_id: session.tenant_id, role: session.role };
  },
});

const desligarSchema = z.object({
  empregado_id: z.string().uuid(),
  data_desligamento: z.string().date(),
  motivo: z.string().min(10),
});

export const desligarEmpregado = actionClient
  .schema(desligarSchema)
  .action(async ({ parsedInput, ctx }) => {
    // CHECAGEM EXTRA além do RLS
    if (!canDo(ctx.role, 'empregado.desligar')) {
      throw new Error('Permissão negada');
    }

    // Workflow de aprovação se necessário
    const fluxo = await db.fluxosAprovacao.findFirst({
      where: { tenant_id: ctx.tenant_id, acao: 'empregado.desligar' }
    });

    if (fluxo) {
      // criar aprovação_pendente e aguardar
      // ...
    } else {
      // desligar direto
      // ...
    }
  });
```

### Helper de permissões `/lib/permissions.ts`

```typescript
type Permission =
  | 'empregado.criar' | 'empregado.editar' | 'empregado.desligar'
  | 'vaga.criar' | 'vaga.aprovar' | 'vaga.publicar'
  | 'folha.fechar' | 'folha.reabrir'
  | 'processo.cadastrar' | 'processo.editar'
  | 'tenant.suspender' // ...

const MATRIZ: Record<Role, Permission[]> = {
  super_admin: ['*'], // tudo
  owner: ['empregado.criar', 'empregado.editar', 'empregado.desligar', 'vaga.aprovar', 'folha.fechar', /* ... */],
  admin: ['empregado.criar', 'empregado.editar', /* ... */],
  // ...
};

export function canDo(role: Role, permission: Permission): boolean {
  const perms = MATRIZ[role] || [];
  return perms.includes('*') || perms.includes(permission);
}
```

---

## 6. Auditoria das ações por role

Cada Server Action que muda dados deve gerar entrada em `audit_log`:

```typescript
await db.auditLog.create({
  data: {
    tenant_id: ctx.tenant_id,
    usuario_id: ctx.user_id,
    acao: 'empregado.desligar',
    recurso_tipo: 'empregado',
    recurso_id: parsedInput.empregado_id,
    dados_antes: { status: 'ativo' },
    dados_depois: { status: 'desligado', motivo: parsedInput.motivo },
    ip: getClientIP(),
    user_agent: getUserAgent(),
  },
});
```

### Casos especiais de auditoria reforçada

Algumas ações geram audit_log com flag `sensivel = true`:

- Super admin acessando dados de tenant
- Mudança de salário > 30%
- Acesso ao espelho de ponto de outro empregado por gestor não-direto
- Visualização de holerite por advogado externo
- Acesso à ficha histórica de ex-empregado em processo
- Reabertura de folha já fechada
- Cancelamento de tenant
- Mudança de role de qualquer usuário

---

## 7. Testes E2E obrigatórios

Suite Playwright com 10 cenários:

1. **Roberto (owner)** loga, cria empregado → ✅
2. **Carla (admin)** loga, edita empregado → ✅
3. **Carla (admin)** tenta deletar empregado → ❌ (só owner)
4. **Luísa (gestor)** vê apenas equipe direta → ✅
5. **Fernando (empregado)** tenta editar próprio salário → ❌ (trigger bloqueia)
6. **Fernando** vê holerite próprio → ✅; tenta ver holerite do Daniel → ❌
7. **Letícia (candidata)** vê só vagas públicas + suas candidaturas → ✅
8. **Mariana (recrutador_oinora)** vê pipelines Aurora + Pluma, não vê Horizonte → ✅
9. **Dr. Henrique (advogado_externo)** vê processos Aurora; tenta acessar empregado sem processo → ❌
10. **Cláudia (super_admin)** acessa dados de tenant → ✅ + gera audit_log destacado

---

## 8. Convites e onboarding de usuários

### Fluxo do convite

```
Owner/admin envia convite por email
  → Email contém magic link com token único
    → Convidado clica, é levado à tela de signup
      → Cria senha + completa dados pessoais
        → Sistema cria registro em `usuarios` E em `tenant_memberships`
          → Convidado faz login pela 1ª vez
            → Inicia tour guiado do produto
```

### Tabela de convites

```sql
CREATE TABLE convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role role NOT NULL,
  token TEXT UNIQUE NOT NULL,
  enviado_por UUID REFERENCES usuarios(id),
  expira_em TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  aceito_em TIMESTAMPTZ,
  aceito_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Multi-papel: como funciona

Um usuário pode ter múltiplos papéis em múltiplos tenants. Exemplo:

**Carla Aurora** pode ser:
- `admin` na Aurora
- `empregado` na Aurora (ela mesma)
- `mentora` em onboardings (não é role separado, mas tag em `onboarding_empregado.mentor_id`)

**Dr. Henrique** pode ser:
- `advogado_externo` para Aurora
- `advogado_externo` para Pluma
- `advogado_externo` para Horizonte

Quando ele loga, vê seletor de **workspace**:
- 🏢 Vasconcellos & Associados (workspace do escritório)
- 🏗 Construtora Aurora (visualização tenant)
- 🏭 Metalúrgica Horizonte (visualização tenant)
- 🏢 Pluma Tecnologia (visualização tenant)

Cada workspace troca o `auth_tenant_id()` retornado pelas funções RLS.

---

🤖 Oi Nora · Matriz de Permissões v2 · 2026
