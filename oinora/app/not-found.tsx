import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 120,
            color: "var(--laranja)",
            lineHeight: 0.9,
          }}
        >
          404
        </div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: 28,
            color: "var(--marinho)",
            fontWeight: 400,
            marginTop: 16,
            marginBottom: 8,
            letterSpacing: "-0.3px",
          }}
        >
          Não encontramos esta página
        </h1>
        <p
          style={{
            fontFamily: "var(--ui)",
            fontSize: 14,
            color: "var(--cinza)",
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          O endereço pode ter mudado, sido removido, ou nunca ter existido. Talvez
          o que você queria seja uma destas:
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/empregados"
            style={{
              padding: "10px 20px",
              background: "var(--laranja)",
              color: "var(--branco)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Empregados
          </Link>
          <Link
            href="/recrutamento/vagas"
            style={{
              padding: "10px 20px",
              background: "var(--branco)",
              color: "var(--marinho)",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Vagas
          </Link>
          <Link
            href="/portal"
            style={{
              padding: "10px 20px",
              background: "var(--branco)",
              color: "var(--marinho)",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Portal candidato
          </Link>
          <Link
            href="/"
            style={{
              padding: "10px 20px",
              background: "var(--branco)",
              color: "var(--cinza)",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Landing page
          </Link>
        </div>
      </div>
    </div>
  );
}
