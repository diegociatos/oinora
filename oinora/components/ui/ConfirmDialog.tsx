"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import styles from "./dialog.module.css";

type Variant = "perigo" | "neutro";

type Props = {
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variant?: Variant;
  trigger: React.ReactNode;
  onConfirmar: () => Promise<void> | void;
};

/**
 * Modal de confirmação com Radix Dialog.
 * Substitui o window.confirm() do navegador por uma UI elegante.
 *
 * Uso:
 *   <ConfirmDialog
 *     titulo="Remover empregado?"
 *     descricao="Esta ação não pode ser desfeita."
 *     variant="perigo"
 *     trigger={<button>Excluir</button>}
 *     onConfirmar={async () => await deletar(id)}
 *   />
 */
export function ConfirmDialog({
  titulo,
  descricao,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variant = "neutro",
  trigger,
  onConfirmar,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.titulo}>{titulo}</Dialog.Title>
          {descricao ? (
            <Dialog.Description className={styles.descricao}>
              {descricao}
            </Dialog.Description>
          ) : null}
          <div className={styles.actions}>
            <Dialog.Close asChild>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnFantasma}`}
                disabled={pending}
              >
                {textoCancelar}
              </button>
            </Dialog.Close>
            <button
              type="button"
              className={`${styles.btn} ${variant === "perigo" ? styles.btnPerigo : styles.btnPrimario}`}
              disabled={pending}
              onClick={() => {
                start(async () => {
                  await onConfirmar();
                  setOpen(false);
                });
              }}
            >
              {pending ? "…" : textoConfirmar}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
