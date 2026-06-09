/** Nome exibido da marca */
export const BRAND_NAME = "El Shaday";

/**
 * Logos oficiais — arquivos em `public/brand/` (acessíveis na URL `/brand/...`).
 *
 * | Arquivo            | Uso                                      |
 * |--------------------|------------------------------------------|
 * | logo.png           | Fundos claros (login, site, manutenção)  |
 * | logo-on-dark.png   | Sidebar do painel (fundo escuro)         |
 *
 * Use PNG ou JPG válidos. Não renomeie SVG/WebP para .png.
 * Recomendado: largura ≥ 400px.
 * Se `logo-on-dark.png` não existir, o sistema usa `logo.png`.
 */
export const BRAND_LOGO = {
  default: "/brand/logo.png",
  onDark: "/brand/logo-on-dark.png",
} as const;
