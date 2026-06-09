import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AppPermission } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requirePermission(permission: AppPermission) {
  const session = await requireSession();
  if (!roleHasPermission(session.user.role, permission)) {
    redirect("/painel");
  }
  return session;
}
