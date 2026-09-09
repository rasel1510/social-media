import { MainLayout } from "@/components/main-layout";

export default function AuthenticatedMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
