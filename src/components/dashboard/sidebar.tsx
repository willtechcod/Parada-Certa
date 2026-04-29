"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  DollarSign,
  Tag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userRole?: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  
  // Get current tab from URL
  const currentTab = React.useMemo(() => {
    return searchParams?.get("tab") || "metrics";
  }, [searchParams]);

  const menuItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Admin",
      href: "/admin",
      icon: Settings,
      roles: ["ADMIN"],
      children: [
        { title: "Métricas", href: "/admin?tab=metrics", tab: "metrics", icon: BarChart3 },
        { title: "Preços", href: "/admin?tab=prices", tab: "prices", icon: DollarSign },
        { title: "Promoções", href: "/admin?tab=promotions", tab: "promotions", icon: Tag },
        { title: "Usuários", href: "/admin?tab=users", tab: "users", icon: Users },
      ],
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  const isAdminSection = pathname === "/admin";

  const sidebarWidth = collapsed ? "60px" : "250px";

  return (
    <>
      {/* Mobile Header - Fixed at top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-secondary border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-bold text-primary">Parada Certa</h1>
        <Link href="/api/auth/logout" className="text-white">
          <LogOut size={20} />
        </Link>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        style={{ width: sidebarWidth }}
        className="hidden md:flex fixed left-0 top-0 z-40 h-screen bg-secondary text-white transition-all duration-300"
      >
        <div className="flex h-full flex-col w-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {!collapsed && (
              <Link href="/" className="text-xl font-bold text-primary truncate">
                Parada Certa
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-white hover:bg-gray-700 ml-auto"
            >
              <Menu size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-2">
              {filteredItems.map((item) => (
                <li key={`${item.href}-${item.title}`}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                      (pathname === item.href && !item.children) ||
                      (item.children && isAdminSection)
                        ? "bg-primary text-secondary font-medium"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                  {/* Admin Submenu - Desktop */}
                  {!collapsed && item.children && isAdminSection && (
                    <ul className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => {
                        const isActive = currentTab === child.tab;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => {
                                setMobileOpen(false);
                              }}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                              )}
                            >
                              <child.icon size={16} className="flex-shrink-0" />
                              <span className="truncate">{child.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Sidebar - Mobile (Simplified) */}
      <aside
        className={cn(
          "md:hidden fixed left-0 z-40 bg-secondary text-white transition-all duration-300 w-[280px]",
          "top-[56px] h-[calc(100vh-56px)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Navigation - Mobile (no logout, simplified) */}
          <nav className="flex-1 overflow-y-auto p-3 mt-4">
            <ul className="space-y-2">
              {filteredItems.map((item) => (
                <li key={`${item.href}-${item.title}`}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                      (pathname === item.href && !item.children) ||
                      (item.children && isAdminSection)
                        ? "bg-primary text-secondary font-medium"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                  {/* Admin Submenu - Mobile */}
                  {item.children && isAdminSection && (
                    <ul className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => {
                        const isActive = currentTab === child.tab;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                              )}
                            >
                              <child.icon size={16} className="flex-shrink-0" />
                              <span className="truncate">{child.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Spacing */}
      <div className="md:hidden h-16" />
    </>
  );
}
