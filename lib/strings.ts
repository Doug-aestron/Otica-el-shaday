/** Remove tudo que não for dígito. */
export function digitsOnly(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/** Normaliza CPF para armazenamento (apenas dígitos, ou null se vazio). */
export function normalizeCpfInput(value: string | null | undefined): string | null {
  const d = digitsOnly(value);
  return d.length > 0 ? d : null;
}
