import type { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { SidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <SidebarWrapper userRole={user?.role}>
      <div className="w-full">
        <Header userRole={user?.role} userName={user?.name} />
        <main className="mt-4 md:mt-6">
          {children}
        </main>
      </div>
    </SidebarWrapper>
  );
}
