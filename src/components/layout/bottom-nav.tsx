"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CopyPlus, Folder, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Criar",     href: "/create",   icon: CopyPlus },
  { name: "Projetos",  href: "/projects", icon: Folder },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 z-50 flex h-14 w-full items-center justify-around border-t border-border bg-card px-4 md:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[60px] py-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
