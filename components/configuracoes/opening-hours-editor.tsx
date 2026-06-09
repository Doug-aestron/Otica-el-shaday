"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  WEEKDAY_TILES,
  DEFAULT_OPEN,
  DEFAULT_CLOSE,
  type OpeningHoursData,
  type Weekday,
  toggleDay,
  updateDayHours,
  applyHoursToAll,
  formatOpeningHoursDisplay,
  validateOpeningHoursData,
  serializeOpeningHours,
} from "@/lib/opening-hours";

type Props = {
  value: OpeningHoursData;
  onChange: (value: OpeningHoursData) => void;
  /** Texto livre salvo antes da grade semanal. */
  legacyHint?: string | null;
  disabled?: boolean;
};

export function OpeningHoursEditor({ value, onChange, legacyHint, disabled }: Props) {
  const baseId = useId();
  const [sameHours, setSameHours] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(DEFAULT_OPEN);
  const [bulkClose, setBulkClose] = useState(DEFAULT_CLOSE);

  useEffect(() => {
    const first = value.days[0];
    if (first) {
      setBulkOpen(first.open);
      setBulkClose(first.close);
    }
  }, [value]);

  const validationError = useMemo(() => validateOpeningHoursData(value), [value]);
  const preview = useMemo(() => formatOpeningHoursDisplay(serializeOpeningHours(value)), [value]);

  const openDays = new Set(value.days.map((d) => d.day));

  function handleToggle(day: Weekday) {
    if (disabled) return;
    let next = toggleDay(value, day);
    if (sameHours && next.days.length) {
      next = applyHoursToAll(next, bulkOpen, bulkClose);
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {legacyHint ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          Horário anterior em texto livre: <em>{legacyHint}</em>. Selecione os dias abaixo para substituir pela
          grade semanal.
        </p>
      ) : null}

      <div>
        <p className="text-sm font-medium text-ink-800">Dias de funcionamento</p>
        <p className="mt-0.5 text-xs text-ink-500">Toque nos dias em que a ótica estará aberta.</p>
        <div
          className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2"
          role="group"
          aria-label="Dias da semana em que a ótica funciona"
        >
          {WEEKDAY_TILES.map((tile) => {
            const active = openDays.has(tile.day);
            return (
              <button
                key={tile.day}
                type="button"
                disabled={disabled}
                onClick={() => handleToggle(tile.day)}
                aria-pressed={active}
                aria-label={`${tile.label}${active ? ", aberto" : ", fechado"}`}
                className={cn(
                  "flex min-h-[4.25rem] flex-col items-center justify-center rounded-2xl border px-1 py-2 text-center transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-900 shadow-sm ring-2 ring-brand-200"
                    : "border-slate-200 bg-slate-50/80 text-ink-500 hover:border-slate-300 hover:bg-white",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">{tile.short}</span>
                <span className="mt-1 text-[10px] font-medium sm:text-xs">{active ? "Aberto" : "—"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {value.days.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-800">
            <input
              type="checkbox"
              checked={sameHours}
              onChange={(e) => {
                const checked = e.target.checked;
                setSameHours(checked);
                if (checked && value.days.length) {
                  onChange(applyHoursToAll(value, bulkOpen, bulkClose));
                }
              }}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Mesmo horário em todos os dias selecionados
          </label>

          {sameHours ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <TimeField
                id={`${baseId}-bulk-open`}
                label="Abertura"
                value={bulkOpen}
                onChange={(v) => {
                  setBulkOpen(v);
                  if (value.days.length) onChange(applyHoursToAll(value, v, bulkClose));
                }}
                disabled={disabled}
              />
              <TimeField
                id={`${baseId}-bulk-close`}
                label="Fechamento"
                value={bulkClose}
                onChange={(v) => {
                  setBulkClose(v);
                  if (value.days.length) onChange(applyHoursToAll(value, bulkOpen, v));
                }}
                disabled={disabled}
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {value.days.map((d) => {
                const tile = WEEKDAY_TILES.find((t) => t.day === d.day)!;
                return (
                  <li
                    key={d.day}
                    className="grid gap-3 rounded-xl border border-slate-200/80 bg-white p-3 sm:grid-cols-[1fr_1fr_1fr]"
                  >
                    <p className="flex items-center text-sm font-semibold text-ink-900 sm:col-span-1">{tile.label}</p>
                    <TimeField
                      id={`${baseId}-open-${d.day}`}
                      label="Abertura"
                      value={d.open}
                      onChange={(open) => onChange(updateDayHours(value, d.day, { open }))}
                      disabled={disabled}
                    />
                    <TimeField
                      id={`${baseId}-close-${d.day}`}
                      label="Fechamento"
                      value={d.close}
                      onChange={(close) => onChange(updateDayHours(value, d.day, { close }))}
                      disabled={disabled}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-500">Nenhum dia selecionado — a ótica aparecerá sem horário definido.</p>
      )}

      {validationError ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {validationError}
        </p>
      ) : null}

      {preview ? (
        <p className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">Prévia: </span>
          {preview}
        </p>
      ) : null}
    </div>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
  onBlur,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
        <Clock className="h-3.5 w-3.5 text-brand-600" aria-hidden />
        {label}
      </Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className="font-mono text-base [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </div>
  );
}
