import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "dashboard-theme-v1";
const THEMES = new Set(["dark", "light", "contrast"]);

function getInitialTheme() {
  // Aceita somente os três valores cadastrados. Preferência inválida, ausente
  // ou armazenamento indisponível volta ao escuro sem impedir o carregamento.
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.has(savedTheme) ? savedTheme : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeSelector() {
  /**
   * O tema é uma preferência deste navegador, persistida em localStorage.
   * Não é enviado ao backend nem interfere nos valores dos indicadores.
   * As cores reais ficam em styles.css, nas regras :root[data-theme="..."].
   */
  const [theme, setTheme] = useState(getInitialTheme);

  useLayoutEffect(() => {
    // O atributo no <html> seleciona as variáveis CSS antes da pintura da tela.
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // O tema ainda funciona quando o navegador bloqueia o armazenamento local.
    }
  }, [theme]);

  return (
    <label className="theme-control">
      <span>Tema</span>
      <select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Tema do painel">
        <option value="dark">Escuro</option>
        <option value="light">Claro</option>
        <option value="contrast">Alto contraste</option>
      </select>
    </label>
  );
}
