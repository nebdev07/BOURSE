import { AppShell } from "@/frontend/components/AppShell";

export const dynamic = "force-dynamic";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
