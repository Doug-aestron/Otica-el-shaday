import Link from "next/link";
import { LogIn } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonClassName } from "@/components/ui/button";

export function SiteUnderDevelopmentPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-lg text-center">
        <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/50 via-white to-indigo-100/60 blur-2xl" />

        <BrandLogo size="hero" priority className="mx-auto" imageClassName="max-h-[120px]" />

        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink-900 text-balance sm:text-3xl">
          Site em desenvolvimento
        </h1>

        <p className="mt-4 text-base leading-relaxed text-ink-600">
          O site da ótica ainda está em desenvolvimento. Para acessar o portal interno, utilize o link abaixo com o
          login fornecido pela equipe.
        </p>

        <Link
          href="/login"
          className={buttonClassName({
            size: "lg",
            className: "mt-8 inline-flex w-full max-w-xs gap-2 sm:w-auto",
          })}
        >
          <LogIn className="h-5 w-5" aria-hidden />
          Acessar o portal
        </Link>

        <p className="mt-8 text-xs text-ink-500">© {new Date().getFullYear()} El Shaday</p>
      </div>
    </div>
  );
}
