import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";
import styles from "../configuracoes/page.module.css";
import { FormConvidarMembro } from "./_form";
import { ToggleMembership } from "./_actions";

export const metadata = { title: "Usuários" };

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  recrutador_oinora: "Recrutador Oi Nora",
  owner: "Owner",
  admin: "Admin",
  gestor: "Gestor",
  hr_ops: "HR Ops",
  empregado: "Empregado",
  advogado_externo: "Advogado externo",
  advogado_interno: "Advogado interno",
};

export default async function UsuariosPage() {
  const session = await requireSession();
  if (!["owner", "admin"].includes(session.role)) {
    redirect("/empregados");
  }

  const supabase = await createClient();

  const [{ data: memberships }, { data: empregados }] = await Promise.all([
    supabase
      .from("tenant_memberships")
      .select(
        "id, role, ativo, criado_em, usuario:usuario_id(id, nome_completo, email, ultimo_login)",
      )
      .eq("tenant_id", session.tenantId)
      .order("criado_em", { ascending: false }),
    supabase
      .from("empregados")
      .select("id, nome_completo, matricula")
      .is("usuario_id", null)
      .eq("status", "ativo")
      .order("nome_completo"),
  ]);

  const lista = memberships ?? [];

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Usuários e convites</em>
        </h1>
        <div className={layout.topbarActions}>{lista.length} membros</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Gerencie quem tem <em>acesso à plataforma</em>
          </h2>
          <p>
            Convide novos membros, atribua papéis e vincule a empregados
            existentes. Owner pode suspender ou reativar acesso.
          </p>
        </div>

        <div className={styles.crudGrid}>
          <div>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Último login</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Nenhum usuário ainda.
                    </td>
                  </tr>
                ) : (
                  lista.map((m) => {
                    const u = Array.isArray(m.usuario) ? m.usuario[0] : m.usuario;
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 500 }}>
                          {u?.nome_completo ?? "—"}
                        </td>
                        <td style={{ fontFamily: "var(--ui)", fontSize: 12 }}>
                          {u?.email ?? "—"}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              letterSpacing: 1,
                              textTransform: "uppercase",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-sharp)",
                              background:
                                m.role === "owner"
                                  ? "var(--laranja-cl)"
                                  : "var(--cinza-fundo)",
                              color:
                                m.role === "owner"
                                  ? "var(--laranja-esc)"
                                  : "var(--marinho-med)",
                            }}
                          >
                            {ROLE_LABEL[m.role] ?? m.role}
                          </span>
                        </td>
                        <td>
                          {u?.ultimo_login
                            ? formatarData(u.ultimo_login)
                            : "nunca"}
                        </td>
                        <td>
                          {m.ativo ? (
                            <span style={{ color: "var(--verde)" }}>● ativo</span>
                          ) : (
                            <span style={{ color: "var(--vermelho)" }}>
                              ● suspenso
                            </span>
                          )}
                        </td>
                        <td className={styles.tabelaActions}>
                          {session.role === "owner" && u?.id !== session.userId ? (
                            <ToggleMembership
                              id={m.id}
                              ativo={m.ativo}
                              nome={u?.nome_completo ?? "este usuário"}
                            />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <aside>
            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Convidar novo membro</h3>
              <FormConvidarMembro
                empregados={(empregados ?? []).map((e) => ({
                  id: e.id,
                  label: `${e.nome_completo} · mat. ${e.matricula}`,
                }))}
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
