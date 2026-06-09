"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  variant?: "default" | "sidebar";
};

export function LogoutButton({ className, variant = "default" }: Props) {
  const isSidebar = variant === "sidebar";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50",
        isSidebar
          ? "border border-white/10 bg-white/10 text-white hover:bg-white/15"
          : buttonClassName({ variant: "outline", size: "md", className: "w-full" }),
        className,
      )}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sair
    </button>
  );
}
