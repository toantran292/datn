import { MainLayout } from "../MainLayout";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
