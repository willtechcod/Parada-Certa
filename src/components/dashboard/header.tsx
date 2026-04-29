"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userRole?: string;
  userName?: string;
}

export function Header({ userRole, userName }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/") return "Veículos Estacionados";
    if (pathname === "/admin") return "Painel Administrativo";
    if (pathname.startsWith("/admin")) return "Administração";
    return "Parada Certa";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Mobile spacing for hamburger menu */}
        <div className="w-8 md:hidden" />
        <h1 className="text-lg sm:text-xl font-bold text-white truncate">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {userName && (
          <span className="text-sm text-gray-300 hidden sm:inline-block truncate max-w-[150px]">
            {userName}
          </span>
        )}

        {userRole === "ADMIN" && pathname !== "/admin" && (
          <Link href="/admin">
            <Button variant="secondary" size="sm">
              <Settings size={16} className="mr-2" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>
        )}

        {pathname !== "/" && userRole === "USER" && (
          <Link href="/">
            <Button variant="secondary" size="sm">
              <Car size={16} className="mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        )}

        {/* Logout only on larger screens - mobile uses sidebar */}
        <Link href="/api/auth/logout" className="hidden md:block">
          <Button variant="danger" size="sm">
            <LogOut size={16} className="mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
