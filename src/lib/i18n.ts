import { useEffect, useState } from "react";

export type Locale = "pt-BR" | "en-US";

const STORAGE_KEY = "chupacabra.locale";

const dictionaries: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    "actions.chupar": "CHUPAR",
    "actions.chuparAgain": "CHUPAR NOVAMENTE",
    "logs.starting": "Iniciando CHUPAR com perfil",
    "logs.openDesktop": "Abra o aplicativo Tauri para executar o engine.",
    "about.version": "Versão",
    "about.engine": "Engine",
    "about.language": "Idioma",
    "about.description": "Ferramenta desktop para inteligência de mercado, prospecção B2B, coleta de dados e geração de relatórios.",
    "about.author": "Autoria",
    "about.authorRole": "Arquitetura, engenharia e desenvolvimento",
    "about.project": "Projeto",
    "about.tagline": "Caçar dados. Encontrar oportunidades.",
  },
  "en-US": {
    "actions.chupar": "SUCK",
    "actions.chuparAgain": "SUCK AGAIN",
    "logs.starting": "Starting SUCK with profile",
    "logs.openDesktop": "Open the Tauri application to run the engine.",
    "about.version": "Version",
    "about.engine": "Engine",
    "about.language": "Language",
    "about.description": "Desktop software for market intelligence, B2B prospecting, data collection and report generation.",
    "about.author": "Author",
    "about.authorRole": "Architecture, engineering and development",
    "about.project": "Project",
    "about.tagline": "Hunt data. Find opportunities.",
  },
};

function detectLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "pt-BR" || stored === "en-US") return stored;
  return navigator.language.toLowerCase().startsWith("en") ? "en-US" : "pt-BR";
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, locale); }, [locale]);
  const setLocale = (next: Locale) => setLocaleState(next);
  const t = (key: string) => dictionaries[locale][key] ?? dictionaries["pt-BR"][key] ?? key;
  return { locale, setLocale, t };
}
