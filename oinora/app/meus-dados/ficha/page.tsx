import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function MinhaFichaPage() {
  const session = await requireSession();
  if (!session.empregadoId) redirect("/sem-acesso");
  // Redireciona pra ficha completa do empregado (com 7 abas)
  redirect(`/empregados/${session.empregadoId}`);
}
