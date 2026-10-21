import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = { title: { default: "Nosso Futuro · Um passo, juntos", template: "%s · Nosso Futuro" }, description: "Clareza financeira e sonhos construídos a dois.", applicationName: "Nosso Futuro", appleWebApp: { capable: true, title: "Nosso Futuro", statusBarStyle: "default" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#315740" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><DemoProvider><Shell>{children}</Shell></DemoProvider></body></html>;
}
