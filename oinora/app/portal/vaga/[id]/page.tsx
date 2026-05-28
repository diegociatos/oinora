import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/utils/format";
import { FormCandidatura } from "./_form";

export default async function PortalVagaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vaga } = await supabase
    .from("vagas")
    .select(
      `id, codigo, titulo, status, afirmativa, publico_alvo,
       descricao_completa, responsabilidades,
       requisitos_obrigatorios, requisitos_desejaveis, beneficios,
       salario_min_centavos, salario_max_centavos, jornada, modelo_trabalho,
       tenant:tenant_id(nome_fantasia, razao_social),
       local:local_trabalho_id(nome)`,
    )
    .eq("id", id)
    .eq("status", "publicada")
    .maybeSingle();

  if (!vaga) notFound();

  const tenant = Array.isArray(vaga.tenant) ? vaga.tenant[0] : vaga.tenant;
  const local = Array.isArray(vaga.local) ? vaga.local[0] : vaga.local;
  const empresaNome = tenant?.nome_fantasia || tenant?.razao_social || "—";

  return (
    <>
      <Link
        href="/portal"
        style={{
          color: "var(--cinza)",
          fontFamily: "var(--ui)",
          fontSize: 13,
          marginBottom: 24,
          display: "inline-block",
        }}
      >
        ← Ver todas as vagas
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
        <div>
          <span
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              color: "var(--cinza)",
              fontSize: 14,
            }}
          >
            {vaga.codigo} · {empresaNome}
          </span>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: 32,
              color: "var(--marinho)",
              fontWeight: 400,
              margin: "8px 0 16px",
              lineHeight: 1.2,
              letterSpacing: "-0.3px",
            }}
          >
            {vaga.titulo}
          </h1>

          {vaga.afirmativa ? (
            <div
              style={{
                padding: "12px 16px",
                background: "var(--laranja-cl)",
                border: "1px solid var(--laranja)",
                borderRadius: "var(--radius-sharp)",
                fontFamily: "var(--ui)",
                fontSize: 13,
                color: "var(--laranja-esc)",
                marginBottom: 24,
              }}
            >
              <strong>★ Vaga afirmativa</strong>
              {vaga.publico_alvo ? ` · público-alvo: ${vaga.publico_alvo}` : ""}
            </div>
          ) : null}

          {vaga.descricao_completa ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={hStyle()}>Descrição</h2>
              <p style={pStyle()}>{vaga.descricao_completa}</p>
            </section>
          ) : null}

          {vaga.responsabilidades ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={hStyle()}>Responsabilidades</h2>
              <p style={pStyle()}>{vaga.responsabilidades}</p>
            </section>
          ) : null}

          {vaga.requisitos_obrigatorios && vaga.requisitos_obrigatorios.length > 0 ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={hStyle()}>Requisitos obrigatórios</h2>
              <ul style={{ paddingLeft: 20, fontFamily: "var(--ui)", fontSize: 14, lineHeight: 1.7, color: "var(--marinho)" }}>
                {vaga.requisitos_obrigatorios.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {vaga.requisitos_desejaveis && vaga.requisitos_desejaveis.length > 0 ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={hStyle()}>Diferenciais</h2>
              <ul style={{ paddingLeft: 20, fontFamily: "var(--ui)", fontSize: 14, lineHeight: 1.7, color: "var(--marinho)" }}>
                {vaga.requisitos_desejaveis.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {vaga.beneficios && vaga.beneficios.length > 0 ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={hStyle()}>Benefícios</h2>
              <ul style={{ paddingLeft: 20, fontFamily: "var(--ui)", fontSize: 14, lineHeight: 1.7, color: "var(--marinho)" }}>
                {vaga.beneficios.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside>
          <div
            style={{
              background: "var(--branco)",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              padding: 24,
              position: "sticky",
              top: 90,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                color: "var(--marinho)",
                marginBottom: 8,
                fontWeight: 400,
              }}
            >
              Candidate-se nesta <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>vaga</em>
            </h3>
            <p style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)", marginBottom: 16, lineHeight: 1.5 }}>
              {local ? `Local: ${local.nome}. ` : ""}
              {vaga.salario_min_centavos && vaga.salario_max_centavos
                ? `Faixa salarial: ${formatarMoeda(vaga.salario_min_centavos)} – ${formatarMoeda(vaga.salario_max_centavos)}.`
                : ""}
            </p>
            <FormCandidatura vagaId={vaga.id} />
          </div>
        </aside>
      </div>
    </>
  );
}

function hStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--ui)",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--cinza)",
    fontWeight: 700,
    marginBottom: 12,
  };
}

function pStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--serif)",
    fontSize: 15,
    lineHeight: 1.7,
    color: "var(--marinho)",
    whiteSpace: "pre-wrap",
  };
}
