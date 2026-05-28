import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "Oi Nora · Recrutamento, RH, Folha e Jurídico Trabalhista",
    template: "%s · Oi Nora",
  },
  description:
    "Plataforma SaaS B2B brasileira que integra Recrutamento & Seleção, Gestão de Pessoas, Folha de Pagamento, Ponto Eletrônico e Jurídico Trabalhista. Foco em construção civil.",
  applicationName: "Oi Nora",
  authors: [{ name: "Oi Nora" }],
  keywords: [
    "RH",
    "recrutamento",
    "folha de pagamento",
    "eSocial",
    "ponto eletrônico",
    "jurídico trabalhista",
    "construção civil",
    "SaaS B2B Brasil",
  ],
  openGraph: {
    title: "Oi Nora",
    description:
      "Recrutamento + RH + Folha + Jurídico Trabalhista, em uma só plataforma. Para empresas de construção civil no Brasil.",
    type: "website",
    locale: "pt_BR",
    siteName: "Oi Nora",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo-principal" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
