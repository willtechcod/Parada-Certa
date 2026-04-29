import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={user?.role} />
      <div className="flex-1 md:ml-[250px] lg:ml-[250px] transition-all duration-300">
        <Header userRole={user?.role} userName={user?.name} />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
