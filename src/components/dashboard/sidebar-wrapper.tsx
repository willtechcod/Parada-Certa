"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";

interface SidebarWrapperProps {
  userRole?: string;
  children: React.ReactNode;
}

export function SidebarWrapper({ userRole, children }: SidebarWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  // Update CSS variable for sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '60px' : '250px'
    );
  }, [collapsed]);
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - fixed on left */}
      <aside 
        className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:z-40 bg-secondary transition-all duration-300"
        style={{ width: collapsed ? 60 : 250 }}
      >
        <Sidebar 
          userRole={userRole} 
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>
      
      {/* Mobile Sidebar - overlay (handled in sidebar component) */}
      <div className="md:hidden">
        <Sidebar userRole={userRole} collapsed={false} onToggle={() => {}} />
      </div>
      
      {/* Main content - flex-1 fills available space on all screens */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-[var(--sidebar-width,250px)]">
        {/* Mobile top spacing for fixed header (56px) */}
        <div className="md:hidden h-14 flex-shrink-0" />
        
        {/* Content with responsive padding and max-width */}
        <main className="flex-1 w-full">
          <div className="h-full w-full px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
