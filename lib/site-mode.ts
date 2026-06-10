/**
 * Site público fechado por padrão (página "em desenvolvimento" na raiz).
 * Para liberar o site institucional completo: SITE_UNDER_DEVELOPMENT=false
 */
export function isSiteUnderDevelopment(): boolean {
  return process.env.SITE_UNDER_DEVELOPMENT !== "false";
}
