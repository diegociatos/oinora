import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData, calcularTempoCasa } from "@/lib/utils/format";

export default async function MeusDadosHome() {
  const session = await requireSession();
  const supabase = await createClient();

  // Dados do empregado
  const { data: emp } = await supabase
    .from("empregados")
    .select(
      "id, nome_completo, matricula, data_admissao, salario_centavos, cargo:cargo_id(nome, nivel), departamento:departamento_id(nome)",
    )
    .eq("id", session.empregadoId!)
    .maybeSingle();

  // Holerites liberados (últimos 3)
  const { data: holerites } = await supabase
    .from("folha_holerites")
    .select("id, competencia_id, total_liquido_centavos, competencia:competencia_id(competencia)")
    .eq("empregado_id", session.empregadoId!)
    .eq("liberado_para_empregado", true)
    .order("created_at" as never, { ascending: false })
    .limit(3);

  // Cursos em curso
  const { data: cursos } = await supabase
    .from("empregado_curso_matriculas")
    .select("id, status, percentual_concluido, curso:curso_id(titulo)")
    .eq("empregado_id", session.empregadoId!)
    .neq("status", "concluido")
    .limit(5);

  // Batidas de hoje
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: batidasHoje } = await supabase
    .from("batidas_ponto")
    .select("id, horario, tipo")
    .eq("empregado_id", session.empregadoId!)
    .eq("data", hoje)
    .order("horario");

  const cargo = emp?.cargo ? (Array.isArray(emp.cargo) ? emp.cargo[0] : emp.cargo) : null;
  const dept = emp?.departamento ? (Array.isArray(emp.departamento) ? emp.departamento[0] : emp.departamento) : null;

  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--marinho), var(--marinho-esc))",
          color: "var(--papel)",
          padding: "32px 28px",
          borderRadius: "var(--radius-sharp)",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontFamily: "var(--ui)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,247,242,0.6)", fontWeight: 700 }}>
          Bem-vindo · matrícula {emp?.matricula}
        </div>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 400, margin: "8px 0 4px" }}>
          Oi, <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>{emp?.nome_completo.split(" ")[0]}</em>
        </h1>
        <p style={{ fontFamily: "var(--ui)", fontSize: 14, opacity: 0.85 }}>
          {cargo?.nome ?? "—"}{cargo?.nivel ? ` · ${cargo.nivel}` : ""} · {dept?.nome ?? ""}
          {" · "}
          <span style={{ color: "var(--laranja)" }}>{calcularTempoCasa(emp?.data_admissao)} de casa</span>
        </p>
      </section>

      {/* Cards de atalho */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Card
          href="/meus-dados/holerites"
          titulo="Holerites"
          desc={
            holerites && holerites.length > 0
              ? `Último líquido: ${formatarMoeda(holerites[0].total_liquido_centavos)}`
              : "Nenhum holerite liberado ainda"
          }
          contador={holerites?.length ?? 0}
        />
        <Card
          href="/meus-dados/cursos"
          titulo="Meus cursos"
          desc={
            cursos && cursos.length > 0
              ? `${cursos.length} ${cursos.length === 1 ? "em curso" : "em curso"}`
              : "Nenhum curso ativo"
          }
          contador={cursos?.length ?? 0}
        />
        <Card
          href="/meus-dados/ponto"
          titulo="Meu ponto"
          desc={
            batidasHoje && batidasHoje.length > 0
              ? `${batidasHoje.length} ${batidasHoje.length === 1 ? "batida" : "batidas"} hoje`
              : "Nenhuma batida hoje"
          }
          contador={batidasHoje?.length ?? 0}
        />
        <Card
          href="/meus-dados/ficha"
          titulo="Minha ficha"
          desc="Dados pessoais, dependentes, contato"
          contador="✓"
        />
      </div>

      {/* Próximas ações sugeridas */}
      <div
        style={{
          background: "var(--branco)",
          border: "1px solid var(--cinza-cl)",
          borderRadius: "var(--radius-sharp)",
          padding: 24,
        }}
      >
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--marinho)", fontWeight: 400, marginBottom: 12 }}>
          <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>Próximas ações</em>
        </h2>
        <ul style={{ listStyle: "none", padding: 0, fontFamily: "var(--ui)", fontSize: 14, lineHeight: 1.8 }}>
          {batidasHoje?.length === 0 ? (
            <li>📍 Você ainda não bateu ponto hoje · <Link href="/meus-dados/ponto" style={{ color: "var(--laranja)" }}>Bater agora</Link></li>
          ) : null}
          {cursos && cursos.length > 0 ? (
            <li>📚 {cursos.length === 1 ? "1 curso em andamento" : `${cursos.length} cursos em andamento`} · <Link href="/meus-dados/cursos" style={{ color: "var(--laranja)" }}>Continuar</Link></li>
          ) : null}
          {holerites && holerites.length > 0 ? (
            <li>💰 {holerites.length === 1 ? "1 holerite disponível" : `${holerites.length} holerites disponíveis`} · <Link href="/meus-dados/holerites" style={{ color: "var(--laranja)" }}>Ver</Link></li>
          ) : null}
        </ul>
      </div>
    </>
  );
}

function Card({
  href,
  titulo,
  desc,
  contador,
}: {
  href: string;
  titulo: string;
  desc: string;
  contador: number | string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--branco)",
        border: "1px solid var(--cinza-cl)",
        borderRadius: "var(--radius-sharp)",
        padding: 20,
        textDecoration: "none",
        color: "var(--marinho)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 400 }}>{titulo}</h3>
        <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 32, color: "var(--laranja)", lineHeight: 1 }}>
          {contador}
        </span>
      </div>
      <p style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)", margin: 0 }}>{desc}</p>
    </Link>
  );
}
