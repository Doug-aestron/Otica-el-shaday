"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { patientCreateSchema } from "@/lib/validation/patient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toDateInputValue } from "@/lib/formatting";

export type PatientFormValues = z.input<typeof patientCreateSchema>;

type PatientSerialized = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birthDate: Date | string | null;
  address: string | null;
  notes: string | null;
};

type Props =
  | { mode: "create" }
  | { mode: "edit"; patientId: string; initial: PatientSerialized };

const resolver = zodResolver(patientCreateSchema) as Resolver<PatientFormValues>;

export function PatientForm(props: Props) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const defaultValues: PatientFormValues =
    props.mode === "edit"
      ? {
          name: props.initial.name,
          cpf: props.initial.cpf ?? "",
          phone: props.initial.phone ?? "",
          email: props.initial.email ?? "",
          birthDate: props.initial.birthDate ? toDateInputValue(props.initial.birthDate) : "",
          address: props.initial.address ?? "",
          notes: props.initial.notes ?? "",
        }
      : {
          name: "",
          cpf: "",
          phone: "",
          email: "",
          birthDate: "",
          address: "",
          notes: "",
        };

  const form = useForm<PatientFormValues>({
    resolver,
    defaultValues,
  });

  const onSubmit: SubmitHandler<PatientFormValues> = async (raw) => {
    const parsed = patientCreateSchema.safeParse(raw);
    if (!parsed.success) return;
    const data = parsed.data;
    setApiError(null);
    try {
      if (props.mode === "create") {
        const res = await fetch("/api/patients", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setApiError(typeof json.error === "string" ? json.error : "Não foi possível salvar.");
          return;
        }
        router.push(`/painel/pacientes/${json.patient.id}`);
        router.refresh();
        return;
      }

      const res = await fetch(`/api/patients/${props.patientId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(typeof json.error === "string" ? json.error : "Não foi possível atualizar.");
        return;
      }
      router.push(`/painel/pacientes/${props.patientId}`);
      router.refresh();
    } catch {
      setApiError("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {apiError}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome completo *</Label>
          <Input id="name" {...form.register("name")} autoComplete="name" />
          {form.formState.errors.name ? (
            <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF (11 dígitos)</Label>
          <Input id="cpf" inputMode="numeric" {...form.register("cpf")} placeholder="00000000000" />
          {form.formState.errors.cpf ? (
            <p className="text-xs font-medium text-red-600">{form.formState.errors.cpf.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" type="tel" {...form.register("phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...form.register("email")} autoComplete="email" />
          {form.formState.errors.email ? (
            <p className="text-xs font-medium text-red-600">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input id="birthDate" type="date" {...form.register("birthDate")} />
          {form.formState.errors.birthDate ? (
            <p className="text-xs font-medium text-red-600">{String(form.formState.errors.birthDate.message)}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" {...form.register("address")} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações internas</Label>
          <Textarea id="notes" {...form.register("notes")} rows={3} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : props.mode === "create" ? (
            "Cadastrar paciente"
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </div>
    </form>
  );
}
