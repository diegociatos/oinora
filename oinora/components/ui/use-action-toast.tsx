"use client";

import { useToast } from "./Toast";
import type { FormState } from "@/server/actions/empregados";

/**
 * Hook utilitário pra disparar Toast a partir de um FormState retornado por Server Action.
 * Uso típico:
 *   const showResult = useActionToast();
 *   const r = await deletarX(id);
 *   showResult(r, "Empregado removido");
 */
export function useActionToast() {
  const { success, error } = useToast();
  return (
    state: FormState,
    successMessage?: string,
    successDescription?: string,
  ) => {
    if (state.status === "error") {
      error("Erro", state.message);
    } else if (state.status === "success") {
      success(
        successMessage ?? state.message,
        successMessage ? state.message : successDescription,
      );
    }
  };
}
