"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import styles from "./toast.module.css";

export type ToastKind = "sucesso" | "erro" | "info" | "aviso";

type ToastMessage = {
  id: string;
  kind: ToastKind;
  titulo: string;
  descricao?: string;
  duracao?: number;
};

type ToastContextValue = {
  toast: (msg: Omit<ToastMessage, "id">) => void;
  success: (titulo: string, descricao?: string) => void;
  error: (titulo: string, descricao?: string) => void;
  info: (titulo: string, descricao?: string) => void;
  warn: (titulo: string, descricao?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: console + alert (durante SSR ou se Provider faltar)
    return {
      toast: (m) => console.log("[toast]", m),
      success: (t, d) => console.log("[success]", t, d),
      error: (t, d) => alert(`${t}${d ? `\n${d}` : ""}`),
      info: (t, d) => console.log("[info]", t, d),
      warn: (t, d) => console.warn("[warn]", t, d),
    };
  }
  return ctx;
}

const ICONES: Record<ToastKind, string> = {
  sucesso: "✓",
  erro: "✕",
  info: "i",
  aviso: "!",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: string) => {
    setMessages((m) => m.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((m) => [...m, { ...msg, id }]);
  }, []);

  const success = useCallback(
    (titulo: string, descricao?: string) => toast({ kind: "sucesso", titulo, descricao }),
    [toast],
  );
  const error = useCallback(
    (titulo: string, descricao?: string) => toast({ kind: "erro", titulo, descricao, duracao: 7000 }),
    [toast],
  );
  const info = useCallback(
    (titulo: string, descricao?: string) => toast({ kind: "info", titulo, descricao }),
    [toast],
  );
  const warn = useCallback(
    (titulo: string, descricao?: string) => toast({ kind: "aviso", titulo, descricao }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warn }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {messages.map((m) => (
          <ToastPrimitive.Root
            key={m.id}
            className={`${styles.toast} ${styles[m.kind]}`}
            duration={m.duracao ?? 5000}
            onOpenChange={(open) => {
              if (!open) remove(m.id);
            }}
          >
            <span className={`${styles.icone} ${styles[m.kind]}`}>
              {ICONES[m.kind]}
            </span>
            <div>
              <ToastPrimitive.Title className={styles.titulo}>
                {m.titulo}
              </ToastPrimitive.Title>
              {m.descricao ? (
                <ToastPrimitive.Description className={styles.descricao}>
                  {m.descricao}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className={styles.fechar} aria-label="Fechar">
              ×
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className={styles.viewport} />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
