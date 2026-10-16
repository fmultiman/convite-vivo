import type { Metadata } from "next";
import { BRAND_NAME, getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: BRAND_NAME, template: `%s · ${BRAND_NAME}` },
  description: "Experiências digitais para eventos.",
  // Padrão conservador: nada é indexável salvo decisão explícita por página.
  robots: { index: false, follow: false },
};

/** Marca o documento como "com JavaScript" antes da pintura (aprimoramento progressivo). */
const enableJsClass = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: enableJsClass }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
