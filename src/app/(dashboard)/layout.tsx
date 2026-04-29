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
      {/* Main content area - adjust margin based on screen size */}
      <div className="flex-1 w-full min-w-0">
        {/* Desktop margin for sidebar */}
        <div className="hidden md:block md:ml-[60px] lg:ml-[250px] transition-all duration-300" />
        
        {/* Actual content wrapper */}
        <div className="md:hidden"> {/* Mobile: no margin */}</div>
        
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-[1400px] mx-auto w-full">
          <Header userRole={user?.role} userName={user?.name} />
          <main className="mt-4 md:mt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
