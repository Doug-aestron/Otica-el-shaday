"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { PainelNavItem } from "@/lib/nav-config";
import { buttonClassName } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

type Props = {
  items: PainelNavItem[];
  userName: string;
  userEmail: string;
};

export function PainelMobileNav({ items, userName, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{userName}</p>
          <p className="truncate text-xs text-ink-500">{userEmail}</p>
        </div>
        <button
          type="button"
          className={buttonClassName({ variant: "outline", size: "sm", className: "shrink-0" })}
          aria-expanded={open}
          aria-controls="painel-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="sr-only">Menu</span>
        </button>
      </div>

      {open ? (
        <div id="painel-mobile-menu" className="border-t border-slate-200/80 bg-white px-2 pb-3">
          <nav className="flex flex-col gap-1 pt-2">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold",
                    active ? "bg-brand-50 text-brand-900" : "text-ink-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 px-1">
            <LogoutButton className="w-full" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
