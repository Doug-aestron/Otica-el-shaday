"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import type { PainelNavItem } from "@/lib/nav-config";
import { roleLabel } from "@/lib/role-label";
import type { Role } from "@prisma/client";
import { LogoutButton } from "@/components/auth/logout-button";

type Props = {
  items: PainelNavItem[];
  userName: string;
  userEmail: string;
  userRole: Role;
};

export function PainelSidebar({ items, userName, userEmail, userRole }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-slate-200/80 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] md:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <BrandLogo variant="onDark" size="md" priority />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight">El Shaday</p>
          <p className="truncate text-xs text-[hsl(var(--sidebar-muted))]">Painel interno</p>
        </div>
      </div>

      <div className="px-4">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="mt-1 truncate text-xs text-[hsl(var(--sidebar-muted))]">{userEmail}</p>
          <p className="mt-3 inline-flex rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
            {roleLabel(userRole)}
          </p>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-xl px-3 py-2 text-sm font-semibold transition",
                active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <LogoutButton variant="sidebar" />
      </div>
    </aside>
  );
}
