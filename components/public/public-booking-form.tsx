"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function PublicBookingForm() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string[] | undefined> | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          telefone,
          data,
          horario,
          motivo: motivo.trim() ? motivo.trim() : null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof payload.error === "string" ? payload.error : "Não foi possível enviar o pedido.");
        if (payload.details && typeof payload.details === "object") {
          setDetails(payload.details as Record<string, string[] | undefined>);
        }
        setLoading(false);
        return;
      }
      setSuccess(typeof payload.message === "string" ? payload.message : "Pedido registrado.");
      setNome("");
      setTelefone("");
      setData("");
      setHorario("");
      setMotivo("");
      setLoading(false);
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="book-nome">Nome</Label>
          <Input
            id="book-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
          />
          {details?.nome ? <p className="text-xs text-red-600">{details.nome.join(" ")}</p> : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="book-tel">Telefone</Label>
          <Input
            id="book-tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            required
          />
          {details?.telefone ? <p className="text-xs text-red-600">{details.telefone.join(" ")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="book-data">Data</Label>
          <Input
            id="book-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
          {details?.data ? <p className="text-xs text-red-600">{details.data.join(" ")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="book-hora">Horário</Label>
          <Input
            id="book-hora"
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            required
          />
          {details?.horario ? <p className="text-xs text-red-600">{details.horario.join(" ")}</p> : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="book-motivo">Motivo</Label>
          <Textarea
            id="book-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Ex.: consulta de rotina, avaliação para óculos…"
          />
          {details?.motivo ? <p className="text-xs text-red-600">{details.motivo.join(" ")}</p> : null}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="mt-4 text-sm font-medium text-emerald-800">{success}</p> : null}

      <div className="mt-6">
        <Button type="submit" disabled={loading} className="min-w-[160px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enviando…
            </>
          ) : (
            "Solicitar agendamento"
          )}
        </Button>
      </div>
    </form>
  );
}
