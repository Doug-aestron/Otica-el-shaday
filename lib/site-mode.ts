/** Quando true, o site público fica desativado; login e painel seguem acessíveis. */
export function isSiteUnderDevelopment(): boolean {
  return process.env.SITE_UNDER_DEVELOPMENT === "true";
}
