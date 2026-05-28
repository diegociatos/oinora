import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/utils/format";

export default async function MeusCursosPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: matriculas } = await supabase
    .from("empregado_curso_matriculas")
    .select(
      `id, status, percentual_concluido, data_matricula, data_inicio, data_conclusao,
       data_expiracao, nota_final, certificado_url,
       curso:curso_id(titulo, descricao, categoria, carga_horaria_horas, nr_codigo, obrigatorio)`,
    )
    .eq("empregado_id", session.empregadoId!)
    .order("data_matricula", { ascending: false });

  const emCurso = (matriculas ?? []).filter((m) => m.status !== "concluido");
  const concluidos = (matriculas ?? []).filter((m) => m.status === "concluido");

  return (
    <>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: 28,
          color: "var(--marinho)",
          fontWeight: 400,
          marginBottom: 8,
        }}
      >
        Meus <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>cursos</em>
      </h1>
      <p
        style={{
          fontFamily: "var(--ui)",
          fontSize: 14,
          color: "var(--cinza)",
          marginBottom: 24,
        }}
      >
        Cursos obrigatórios (NRs, LGPD) e trilhas de desenvolvimento.
      </p>

      {emCurso.length > 0 ? (
        <>
          <h2
            style={{
              fontFamily: "var(--ui)",
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--cinza)",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Em andamento ({emCurso.length})
          </h2>
          <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
            {emCurso.map((m) => (
              <CursoCard key={m.id} matricula={m} />
            ))}
          </div>
        </>
      ) : null}

      {concluidos.length > 0 ? (
        <>
          <h2
            style={{
              fontFamily: "var(--ui)",
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--cinza)",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Concluídos ({concluidos.length})
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {concluidos.map((m) => (
              <CursoCard key={m.id} matricula={m} />
            ))}
          </div>
        </>
      ) : null}

      {(matriculas ?? []).length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "var(--branco)",
            border: "1px dashed var(--cinza-cl)",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--ui)",
            color: "var(--cinza)",
          }}
        >
          Nenhuma matrícula. Fale com o RH se houver cursos obrigatórios pro seu cargo.
        </div>
      ) : null}
    </>
  );
}

type Matricula = {
  id: string;
  status: string;
  percentual_concluido: number;
  data_matricula: string;
  data_conclusao: string | null;
  data_expiracao: string | null;
  nota_final: number | null;
  certificado_url: string | null;
  curso: { titulo: string; descricao: string | null; categoria: string | null; carga_horaria_horas: number | null; nr_codigo: string | null; obrigatorio: boolean }[] | { titulo: string; descricao: string | null; categoria: string | null; carga_horaria_horas: number | null; nr_codigo: string | null; obrigatorio: boolean } | null;
};

function CursoCard({ matricula }: { matricula: Matricula }) {
  const c = Array.isArray(matricula.curso) ? matricula.curso[0] : matricula.curso;
  const vencido = matricula.data_expiracao && new Date(matricula.data_expiracao) < new Date();
  return (
    <article
      style={{
        background: "var(--branco)",
        border: `1px solid ${vencido ? "var(--vermelho)" : "var(--cinza-cl)"}`,
        borderRadius: "var(--radius-sharp)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--marinho)" }}>
            {c?.titulo}
            {c?.obrigatorio ? (
              <span style={{ marginLeft: 8, fontSize: 10, letterSpacing: 1, color: "var(--vermelho)", fontFamily: "var(--ui)", fontWeight: 700 }}>
                OBRIGATÓRIO
              </span>
            ) : null}
            {c?.nr_codigo ? (
              <span style={{ marginLeft: 8, fontSize: 10, letterSpacing: 1, color: "var(--juridico)", fontFamily: "var(--ui)", fontWeight: 700 }}>
                {c.nr_codigo}
              </span>
            ) : null}
          </div>
          {c?.descricao ? (
            <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)", marginTop: 4 }}>
              {c.descricao}
            </div>
          ) : null}
          <div style={{ fontFamily: "var(--ui)", fontSize: 11, color: "var(--cinza)", marginTop: 6, letterSpacing: 0.3 }}>
            {c?.carga_horaria_horas ? `${c.carga_horaria_horas}h · ` : ""}
            {c?.categoria ?? ""}
            {matricula.data_expiracao
              ? vencido
                ? ` · ⚠ vencido em ${formatarData(matricula.data_expiracao)}`
                : ` · válido até ${formatarData(matricula.data_expiracao)}`
              : ""}
            {matricula.nota_final ? ` · nota ${matricula.nota_final}` : ""}
          </div>
        </div>
        {matricula.status === "concluido" ? (
          <span style={{ color: "var(--verde)", fontFamily: "var(--ui)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
            ✓ Concluído
          </span>
        ) : null}
      </div>
      {matricula.status !== "concluido" ? (
        <div style={{ marginTop: 12, height: 6, background: "var(--cinza-fundo)", borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              width: `${matricula.percentual_concluido}%`,
              height: "100%",
              background: "var(--laranja)",
            }}
          />
        </div>
      ) : null}
      <div style={{ marginTop: 8, fontFamily: "var(--ui)", fontSize: 11, color: "var(--cinza)" }}>
        {matricula.status !== "concluido"
          ? `${matricula.percentual_concluido}% concluído`
          : `Concluído em ${formatarData(matricula.data_conclusao)}`}
      </div>
    </article>
  );
}
