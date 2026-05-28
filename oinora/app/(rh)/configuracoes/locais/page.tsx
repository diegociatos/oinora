import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import styles from "../page.module.css";
import { FormLocal } from "./_form";
import { BotaoDeletarLocal } from "./_actions";

export const metadata = { title: "Locais de trabalho" };

type EnderecoJson = {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

export default async function LocaisPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; novo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: locais } = await supabase
    .from("locais_trabalho")
    .select("id, nome, endereco, raio_metros, ativo")
    .order("nome");

  const lista = locais ?? [];

  let inicial:
    | { id: string | null; data?: Record<string, unknown> }
    | null = null;
  if (sp.novo) inicial = { id: null };
  else if (sp.editar) {
    const l = lista.find((l) => l.id === sp.editar);
    if (l) {
      inicial = {
        id: l.id,
        data: {
          nome: l.nome,
          raio_metros: l.raio_metros,
          ativo: l.ativo,
          endereco: l.endereco,
        },
      };
    }
  }

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Locais de trabalho</em>
        </h1>
        <div className={layout.topbarActions}>{lista.length} cadastrados</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2>
              Sedes, canteiros e <em>obras</em>
            </h2>
            <p>
              Cada local tem coordenadas e raio de geofence usados pelo módulo
              de ponto eletrônico (MVP 4).
            </p>
          </div>
          {!inicial ? (
            <Link href="/configuracoes/locais?novo=1" className={styles.btnPrincipal}>
              + Novo local
            </Link>
          ) : null}
        </div>

        <div className={styles.crudGrid}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade/UF</th>
                <th>Geofence</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.vazio}>
                    Nenhum local cadastrado.
                  </td>
                </tr>
              ) : (
                lista.map((l) => {
                  const e = (l.endereco ?? {}) as EnderecoJson;
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500 }}>{l.nome}</td>
                      <td>
                        {e.cidade ? `${e.cidade}${e.uf ? `/${e.uf}` : ""}` : "—"}
                      </td>
                      <td>{l.raio_metros}m</td>
                      <td>
                        {l.ativo ? (
                          <span style={{ color: "var(--verde)" }}>● ativo</span>
                        ) : (
                          <span style={{ color: "var(--cinza)" }}>○ inativo</span>
                        )}
                      </td>
                      <td className={styles.tabelaActions}>
                        <Link href={`/configuracoes/locais?editar=${l.id}`}>
                          editar
                        </Link>
                        {session.role === "owner" ? (
                          <BotaoDeletarLocal id={l.id} nome={l.nome} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {inicial ? (
            <aside>
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>
                  {inicial.id ? "Editar local" : "Novo local"}
                </h3>
                <FormLocal
                  id={inicial.id}
                  inicial={inicial.data as Parameters<typeof FormLocal>[0]["inicial"]}
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
