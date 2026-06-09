import { auth } from "@/auth";
import type { AppPermission } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/** Sessão já validada com `user` presente. */
export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]>;
};

export async function getSessionOr401(): Promise<
  { ok: true; session: AuthenticatedSession } | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  return { ok: true, session: session as AuthenticatedSession };
}

export async function requirePermissionApi(
  permission: AppPermission,
): Promise<{ ok: true; session: AuthenticatedSession } | { ok: false; response: NextResponse }> {
  const gate = await getSessionOr401();
  if (!gate.ok) return gate;

  if (!roleHasPermission(gate.session.user.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sem permissão para esta ação." }, { status: 403 }),
    };
  }
  return { ok: true, session: gate.session };
}

export async function requireAnyPermissionApi(
  permissions: AppPermission[],
): Promise<{ ok: true; session: AuthenticatedSession } | { ok: false; response: NextResponse }> {
  const gate = await getSessionOr401();
  if (!gate.ok) return gate;

  const allowed = permissions.some((p) => roleHasPermission(gate.session.user.role, p));
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sem permissão para esta ação." }, { status: 403 }),
    };
  }
  return { ok: true, session: gate.session };
}
