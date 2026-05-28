import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";
import { FormBatida } from "./_form-batida";

export const metadata = { title: "Ponto eletrônico" };

export default async function PontoPage() {
  await requireSession();
  const supabase = await createClient();

  // Espelhos do mês atual
  const competencia = new Date().toISOString().slice(0, 7) + "-01";
  const { data: espelhos } = await supabase
    .from("espelhos_ponto")
    .select(
      "id, competencia, total_horas_trabalhadas, horas_extras_50, horas_extras_100, banco_horas_saldo, faltas, atrasos_minutos, fechado, empregado:empregado_id(nome_completo, matricula, cargo:cargo_id(nome))",
    )
    .order("empregado(nome_completo)")
    .limit(100);

  // Últimas batidas (sample)
  const { data: batidas } = await supabase
    .from("batidas_ponto")
    .select("id, data, horario, tipo, metodo, ajustada, empregado:empregado_id(nome_completo, matricula), local:local_id(nome)")
    .order("horario", { ascending: false })
    .limit(20);

  // Opções pra registrar batida
  const [{ data: empregadosList }, { data: locaisList }] = await Promise.all([
    supabase
      .from("empregados")
      .select("id, nome_completo, matricula")
      .eq("status", "ativo")
      .order("nome_completo"),
    supabase
      .from("locais_trabalho")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
  ]);
  const empregadosLista = empregadosList ?? [];
  const locaisLista = locaisList ?? [];

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Ponto eletrônico</em>
        </h1>
        <div className={layout.topbarActions}>
          {batidas?.length ?? 0} batidas recentes
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Espelhos e <em>batidas</em>
          </h2>
          <p>
            Web + mobile PWA. Geofence por local de trabalho. Biometria/foto
            quando configurada com DataValid/Serpro.
          </p>
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Registrar batida</h3>
          <FormBatida
            empregados={empregadosLista.map((e) => ({
              id: e.id,
              label: `${e.nome_completo} · mat. ${e.matricula}`,
            }))}
            locais={locaisLista.map((l) => ({ id: l.id, label: l.nome }))}
          />
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Espelhos do mês ({espelhos?.length ?? 0})</h3>
          {(espelhos ?? []).length === 0 ? (
            <p style={{ fontFamily: "var(--ui)", color: "var(--cinza)" }}>
              Nenhum espelho fechado ainda. Espelhos são gerados ao fechar a folha.
            </p>
          ) : (
            <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Empregado", "Horas trabalhadas", "H.E. 50%", "H.E. 100%", "Banco saldo", "Faltas", "Atrasos", "Fechado"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--cinza)", padding: "8px 12px", borderBottom: "1px solid var(--cinza-cl)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(espelhos ?? []).map((e) => {
                  const emp = Array.isArray(e.empregado) ? e.empregado[0] : e.empregado;
                  return (
                    <tr key={e.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                      <td style={{ padding: "10px 12px", color: "var(--marinho)" }}>{emp?.nome_completo}</td>
                      <td style={tdRight()}>{e.total_horas_trabalhadas ?? "—"}h</td>
                      <td style={tdRight()}>{e.horas_extras_50 ?? 0}h</td>
                      <td style={tdRight()}>{e.horas_extras_100 ?? 0}h</td>
                      <td style={tdRight()}>{e.banco_horas_saldo ?? 0}h</td>
                      <td style={tdRight()}>{e.faltas}</td>
                      <td style={tdRight()}>{e.atrasos_minutos}min</td>
                      <td style={{ ...tdRight() }}>
                        {e.fechado ? <span style={{ color: "var(--verde)" }}>✓</span> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Batidas recentes</h3>
          {(batidas ?? []).length === 0 ? (
            <p style={{ fontFamily: "var(--ui)", color: "var(--cinza)" }}>
              Nenhuma batida registrada ainda. App mobile + web entram quando integração de geofence/biometria for ativada.
            </p>
          ) : (
            <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Empregado", "Data", "Hora", "Tipo", "Método", "Local", "Ajustada"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--cinza)", padding: "8px 12px", borderBottom: "1px solid var(--cinza-cl)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(batidas ?? []).map((b) => {
                  const emp = Array.isArray(b.empregado) ? b.empregado[0] : b.empregado;
                  const l = Array.isArray(b.local) ? b.local[0] : b.local;
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                      <td style={{ padding: "10px 12px" }}>{emp?.nome_completo}</td>
                      <td style={{ padding: "10px 12px" }}>{new Date(b.data).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--serif)", fontStyle: "italic" }}>
                        {new Date(b.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{b.tipo}</td>
                      <td style={{ padding: "10px 12px" }}>{b.metodo ?? "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{l?.nome ?? "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{b.ajustada ? "⚠ sim" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function tdRight(): React.CSSProperties {
  return { padding: "10px 12px", textAlign: "right", color: "var(--marinho)" };
}
