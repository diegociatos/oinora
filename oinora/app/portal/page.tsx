import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/utils/format";
import styles from "./layout.module.css";

export default async function PortalPage() {
  const supabase = await createClient();
  // RLS permite SELECT em vagas publicadas para anon
  const { data: vagas } = await supabase
    .from("vagas")
    .select(
      "id, codigo, titulo, afirmativa, publico_alvo, salario_min_centavos, salario_max_centavos, modelo_trabalho, tenant:tenant_id(nome_fantasia, razao_social), local:local_trabalho_id(nome)",
    )
    .eq("status", "publicada")
    .order("data_publicacao", { ascending: false });

  return (
    <>
      <section className={styles.portalHero}>
        <h1>
          Trabalhe com <em>quem cuida</em> de pessoas
        </h1>
        <p>
          Vagas abertas em empresas brasileiras que usam a Oi Nora para gerir
          gente. Construção civil, RH, engenharia. Cadastro gratuito, dados
          protegidos por LGPD.
        </p>
      </section>

      <h2
        style={{
          fontFamily: "var(--serif)",
          fontSize: "var(--fs-2xl)",
          color: "var(--marinho)",
          fontWeight: 400,
          marginBottom: "var(--space-2)",
        }}
      >
        {vagas?.length ?? 0} vagas abertas
      </h2>
      <p
        style={{
          fontFamily: "var(--ui)",
          fontSize: "var(--fs-sm)",
          color: "var(--cinza)",
          marginBottom: "var(--space-6)",
        }}
      >
        Clique em uma vaga para ver detalhes e se candidatar.
      </p>

      <div className={styles.portalCards}>
        {(vagas ?? []).map((v) => {
          const t = Array.isArray(v.tenant) ? v.tenant[0] : v.tenant;
          const l = Array.isArray(v.local) ? v.local[0] : v.local;
          return (
            <Link
              key={v.id}
              href={`/portal/vaga/${v.id}`}
              className={styles.portalVagaCard}
            >
              <span className={styles.portalVagaCardCodigo}>{v.codigo}</span>
              <h3 className={styles.portalVagaCardTitulo}>{v.titulo}</h3>
              {v.afirmativa ? (
                <span className={styles.portalAfirmativa}>
                  ★ Vaga afirmativa
                </span>
              ) : null}
              <div className={styles.portalMeta}>
                <strong style={{ color: "var(--marinho)" }}>
                  {t?.nome_fantasia || t?.razao_social}
                </strong>
                {l ? ` · ${l.nome}` : ""}
                {v.modelo_trabalho ? ` · ${v.modelo_trabalho}` : ""}
                {v.salario_min_centavos && v.salario_max_centavos ? (
                  <div style={{ marginTop: 4 }}>
                    {formatarMoeda(v.salario_min_centavos)} – {formatarMoeda(v.salario_max_centavos)}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
