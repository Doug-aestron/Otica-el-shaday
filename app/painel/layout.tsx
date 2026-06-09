import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PainelMobileNav } from "@/components/layout/painel-mobile-nav";
import { PainelSidebar } from "@/components/layout/painel-sidebar";
import { painelNavItems } from "@/lib/nav-config";
import { roleHasPermission } from "@/lib/permissions";
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = painelNavItems.filter((item) => roleHasPermission(session.user.role, item.permission));

  return (
    <div className="min-h-screen bg-slate-50">
      <PainelSidebar
        items={items}
        userName={session.user.name ?? "Usuário"}
        userEmail={session.user.email ?? ""}
        userRole={session.user.role}
      />
      <div className="md:pl-[280px]">
        <PainelMobileNav
          items={items}
          userName={session.user.name ?? "Usuário"}
          userEmail={session.user.email ?? ""}
        />
        {children}
      </div>
    </div>
  );
}
