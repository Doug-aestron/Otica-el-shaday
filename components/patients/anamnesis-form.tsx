"use client";

import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { anamnesisFormSchema } from "@/lib/validation/anamnesis";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type AnamnesisFormValues = z.input<typeof anamnesisFormSchema>;

const resolver = zodResolver(anamnesisFormSchema) as Resolver<AnamnesisFormValues>;

type Props = {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function CheckRow({
  id,
  label,
  ...rest
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-slate-100/80"
    >
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        {...rest}
      />
      {label}
    </label>
  );
}

export function AnamnesisForm({ patientId, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const defaultValues: AnamnesisFormValues = {
    chiefComplaint: "",
    usesGlasses: false,
    usesContactLens: false,
    headache: false,
    blurredVision: false,
    difficultyNear: false,
    difficultyFar: false,
    diabetes: false,
    hypertension: false,
    allergies: "",
    medications: "",
    ocularSurgery: "",
    familyHistory: "",
    observations: "",
    lgpdConsent: false,
  };

  const form = useForm<AnamnesisFormValues>({
    resolver,
    defaultValues,
  });

  const onSubmit: SubmitHandler<AnamnesisFormValues> = async (raw) => {
    const parsed = anamnesisFormSchema.safeParse(raw);
    if (!parsed.success) return;
    const data = parsed.data;
    setApiError(null);
    try {
      const res = await fetch("/api/anamnesis", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, patientId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(typeof json.error === "string" ? json.error : "Não foi possível registrar a anamnese.");
        return;
      }
      form.reset(defaultValues);
      router.refresh();
      onSuccess?.();
    } catch {
      setApiError("Erro de conexão. Tente novamente.");
    }
  }

  const { register, formState } = form;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div>
        <h3 className="font-display text-lg font-semibold text-ink-900">Nova anamnese</h3>
        <p className="mt-1 text-sm text-ink-600">Preencha com atenção. Os dados ficam vinculados ao prontuário.</p>
      </div>

      {apiError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {apiError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="chiefComplaint">Queixa principal</Label>
        <Textarea id="chiefComplaint" {...register("chiefComplaint")} rows={3} placeholder="Motivo da consulta ou queixa do paciente" />
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-800">Hábitos e sintomas</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <CheckRow id="usesGlasses" label="Usa óculos" {...register("usesGlasses")} />
          <CheckRow id="usesContactLens" label="Usa lente de contato" {...register("usesContactLens")} />
          <CheckRow id="headache" label="Dor de cabeça" {...register("headache")} />
          <CheckRow id="blurredVision" label="Visão embaçada" {...register("blurredVision")} />
          <CheckRow id="difficultyNear" label="Dificuldade para perto" {...register("difficultyNear")} />
          <CheckRow id="difficultyFar" label="Dificuldade para longe" {...register("difficultyFar")} />
          <CheckRow id="diabetes" label="Diabetes" {...register("diabetes")} />
          <CheckRow id="hypertension" label="Hipertensão" {...register("hypertension")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="allergies">Alergias</Label>
          <Textarea id="allergies" {...register("allergies")} rows={2} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="medications">Medicamentos em uso</Label>
          <Textarea id="medications" {...register("medications")} rows={2} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ocularSurgery">Cirurgia ocular (descrever)</Label>
          <Textarea id="ocularSurgery" {...register("ocularSurgery")} rows={2} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="familyHistory">Histórico familiar</Label>
          <Textarea id="familyHistory" {...register("familyHistory")} rows={2} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea id="observations" {...register("observations")} rows={3} />
        </div>
      </div>

      <div>
        <label
          htmlFor="lgpdConsent"
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm",
            formState.errors.lgpdConsent ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50/80",
          )}
        >
          <input
            id="lgpdConsent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register("lgpdConsent")}
          />
          <span className="font-medium text-ink-800">
            Li e confirmo que o paciente foi informado e concorda com o tratamento dos dados conforme a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline hover:text-brand-800"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidade
            </Link>
            . *
          </span>
        </label>
        {formState.errors.lgpdConsent ? (
          <p className="mt-1 text-xs font-medium text-red-600">{formState.errors.lgpdConsent.message}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            "Registrar anamnese"
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={formState.isSubmitting}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
