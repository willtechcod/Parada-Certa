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
    <div className="flex min-h-screen bg-background" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-screen z-40">
        <Sidebar userRole={user?.role} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sidebar userRole={user?.role} />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 w-full">
        {/* Desktop margin for sidebar */}
        <div className="hidden md:block" style={{ marginLeft: "250px" }} />
        
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
