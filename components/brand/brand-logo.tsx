"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Glasses } from "lucide-react";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  hero: 120,
} as const;

type BrandLogoProps = {
  variant?: "default" | "onDark";
  size?: keyof typeof SIZE_PX;
  showName?: boolean;
  nameClassName?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

function resolveSrc(variant: "default" | "onDark", useFallbackLogo: boolean): string {
  if (variant === "onDark" && !useFallbackLogo) return BRAND_LOGO.onDark;
  return BRAND_LOGO.default;
}

export function BrandLogo({
  variant = "default",
  size = "md",
  showName = false,
  nameClassName,
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const px = SIZE_PX[size];
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const src = resolveSrc(variant, useFallbackLogo);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setStatus("ready");
    };
    probe.onerror = () => {
      if (cancelled) return;
      if (variant === "onDark" && !useFallbackLogo) {
        setUseFallbackLogo(true);
        return;
      }
      setStatus("error");
    };
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, variant, useFallbackLogo]);

  const iconClass =
    size === "hero" ? "h-10 w-10" : size === "xl" ? "h-8 w-8" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  const showPlaceholder = status === "loading" || status === "error";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          showPlaceholder && variant === "onDark" && "rounded-2xl bg-white/10 ring-1 ring-white/15",
          showPlaceholder &&
            variant === "default" &&
            "rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-soft",
        )}
        style={{ width: px, height: px }}
      >
        {showPlaceholder ? (
          <Glasses
            className={cn(iconClass, variant === "onDark" ? "text-white" : "text-white")}
            aria-hidden
          />
        ) : null}
        {status === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo estática em /public; evita erro do otimizador quando arquivo falta
          <img
            src={src}
            alt={`Logo ${BRAND_NAME}`}
            width={px}
            height={px}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            className={cn("h-full w-full object-contain object-center", imageClassName)}
          />
        ) : null}
      </span>
      {showName ? (
        <span className={cn("truncate font-display font-semibold tracking-tight", nameClassName)}>
          {BRAND_NAME}
        </span>
      ) : null}
    </span>
  );
}

type BrandLogoLinkProps = BrandLogoProps & {
  href?: string;
  linkClassName?: string;
};

export function BrandLogoLink({ href = "/", linkClassName, className, ...logoProps }: BrandLogoLinkProps) {
  return (
    <Link href={href} className={cn("inline-flex min-w-0 max-w-full", linkClassName)}>
      <BrandLogo className={className} {...logoProps} />
    </Link>
  );
}
