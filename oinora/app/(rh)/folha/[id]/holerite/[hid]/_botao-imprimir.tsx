"use client";

import styles from "./page.module.css";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={styles.btnImprimir}
    >
      🖨 Imprimir / Salvar PDF
    </button>
  );
}
