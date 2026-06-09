import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandLogoLink } from "@/components/brand/brand-logo";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { isSiteUnderDevelopment } from "@/lib/site-mode";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/painel");

  const underDevelopment = isSiteUnderDevelopment();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandLogoLink
          href="/"
          size="md"
          showName
          priority
          nameClassName="font-display text-lg text-ink-900"
        />
        {!underDevelopment ? (
          <Link href="/" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Voltar ao site
          </Link>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Área interna</CardTitle>
            <CardDescription>Entre com o e-mail e a senha fornecidos pela equipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-ink-600">Carregando…</p>}>
              <LoginForm />
            </Suspense>
            <p className="mt-6 text-xs leading-relaxed text-ink-500">
              Dica (fase 1): use os usuários de teste do seed (admin, recepção, médico e vendedor) com a senha{" "}
              <span className="font-semibold text-ink-700">123456</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
