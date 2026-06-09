/** Centavos → exibição em reais (pt-BR). */
export function formatCentsBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** Reais → centavos inteiros. */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Centavos → string para input (ex.: 150050 → "1500,50"). */
export function centsToReaisInput(cents: number): string {
  const reais = cents / 100;
  const [int, dec] = reais.toFixed(2).split(".");
  return `${int},${dec}`;
}
