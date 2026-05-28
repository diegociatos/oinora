import styles from "./skeleton.module.css";

type Props = {
  width?: string | number;
  height?: string | number;
  variant?: "linha" | "circulo" | "bloco";
  className?: string;
};

export function Skeleton({
  width = "100%",
  height = 16,
  variant = "linha",
  className,
}: Props) {
  const radius =
    variant === "circulo" ? "50%" : variant === "bloco" ? "var(--radius-sharp)" : "4px";
  return (
    <span
      className={`${styles.skel} ${className ?? ""}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonTable({ linhas = 5, colunas = 5 }: { linhas?: number; colunas?: number }) {
  return (
    <div style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${colunas}, 1fr)`, gap: 12, marginBottom: 12 }}>
        {Array.from({ length: colunas }).map((_, i) => (
          <Skeleton key={`h-${i}`} height={12} width="60%" />
        ))}
      </div>
      {Array.from({ length: linhas }).map((_, li) => (
        <div key={li} style={{ display: "grid", gridTemplateColumns: `repeat(${colunas}, 1fr)`, gap: 12, padding: "12px 0", borderTop: "1px dashed var(--cinza-cl)" }}>
          {Array.from({ length: colunas }).map((_, ci) => (
            <Skeleton key={`${li}-${ci}`} height={14} width={ci === 0 ? "80%" : "55%"} />
          ))}
        </div>
      ))}
    </div>
  );
}
