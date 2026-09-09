import type { Metadata, Viewport } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { I18nProvider } from "@/frontend/i18n/provider";
import { PwaRegister } from "@/frontend/components/PwaRegister";
import { readLocale } from "@/frontend/i18n/locale";
import { messages } from "@/frontend/i18n/dictionary";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const t = messages(locale);
  return {
    title: t.brand.short,
    description: locale === "en"
      ? "Quality, growth, dividends, valuation — not FOMO."
      : "Qualité, croissance, dividendes, valorisation — pas le FOMO.",
    applicationName: t.brand.short,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: t.brand.short,
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon" }],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await readLocale();
  return (
    <html lang={locale}>
      <body className={`${dmSans.variable} ${sourceSerif.variable} font-sans antialiased`}>
        <I18nProvider locale={locale}>
          <PwaRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
