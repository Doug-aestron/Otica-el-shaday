import { OFFICIAL_COLOR_THEME } from "@/lib/color-themes";

/** Garante tema azul oficial antes da hidratação (sem flash de cor de teste). */
export function ColorThemeInit() {
  const script = `
(function() {
  document.documentElement.setAttribute('data-color-theme', ${JSON.stringify(OFFICIAL_COLOR_THEME)});
  try {
    localStorage.setItem('el-shaday-color-theme', ${JSON.stringify(OFFICIAL_COLOR_THEME)});
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
