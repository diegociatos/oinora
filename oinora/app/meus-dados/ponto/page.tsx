import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BotoesBaterPonto } from "./_botoes";

const TIPO_LABEL: Record<string, string> = {
  entrada: "🌅 Entrada",
  almoco_saida: "🍴 Saída almoço",
  almoco_volta: "🥤 Volta almoço",
  saida: "🌇 Saída",
  intervalo: "⏸ Intervalo",
};

export default async function MeuPontoPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const inicioMesISO = inicioMes.toISOString().slice(0, 10);

  const [{ data: batidasHoje }, { data: batidasMes }] = await Promise.all([
    supabase
      .from("batidas_ponto")
      .select("id, horario, tipo, metodo, local:local_id(nome)")
      .eq("empregado_id", session.empregadoId!)
      .eq("data", hoje)
      .order("horario"),
    supabase
      .from("batidas_ponto")
      .select("id, data, horario, tipo")
      .eq("empregado_id", session.empregadoId!)
      .gte("data", inicioMesISO)
      .order("horario", { ascending: false })
      .limit(60),
  ]);

  const ultimoTipo = batidasHoje && batidasHoje.length > 0
    ? batidasHoje[batidasHoje.length - 1].tipo
    : null;

  const agora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });

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
        Meu <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>ponto</em>
      </h1>
      <p style={{ fontFamily: "var(--ui)", fontSize: 14, color: "var(--cinza)", marginBottom: 24 }}>
        Bata seu ponto aqui no celular ou no computador. Geofence e foto ativam com integração DataValid/Serpro.
      </p>

      {/* Card de bater ponto */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--marinho), var(--marinho-esc))",
          color: "var(--papel)",
          padding: 24,
          borderRadius: "var(--radius-sharp)",
          marginBottom: 24,
        }}
      >
        <div style={{ fontFamily: "var(--ui)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,247,242,0.6)", fontWeight: 700 }}>
          {dataHoje}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 48, color: "var(--laranja)", lineHeight: 1.1, margin: "8px 0 16px" }}>
          {agora}
        </div>
        <BotoesBaterPonto
          empregadoId={session.empregadoId!}
          ultimoTipo={ultimoTipo}
        />
      </div>

      {/* Batidas de hoje */}
      <div style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 400, color: "var(--marinho)", marginBottom: 12 }}>
          Hoje
        </h2>
        {(batidasHoje ?? []).length === 0 ? (
          <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)" }}>
            Você ainda não bateu ponto hoje.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, fontFamily: "var(--ui)", fontSize: 14, display: "grid", gap: 8 }}>
            {(batidasHoje ?? []).map((b) => (
              <li key={b.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{TIPO_LABEL[b.tipo] ?? b.tipo}</span>
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)" }}>
                  {new Date(b.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mês corrente */}
      <div style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 400, color: "var(--marinho)", marginBottom: 12 }}>
          Últimas batidas do mês ({batidasMes?.length ?? 0})
        </h2>
        {(batidasMes ?? []).length === 0 ? (
          <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)" }}>—</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, fontFamily: "var(--ui)", fontSize: 13, display: "grid", gap: 4 }}>
            {(batidasMes ?? []).map((b) => (
              <li key={b.id} style={{ display: "flex", gap: 16, padding: "6px 0", borderBottom: "1px dashed var(--cinza-cl)" }}>
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)", minWidth: 80 }}>
                  {new Date(b.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)", minWidth: 60 }}>
                  {new Date(b.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                </span>
                <span>{TIPO_LABEL[b.tipo] ?? b.tipo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
