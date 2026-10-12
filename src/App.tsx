import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { PatternViewer } from "./components/PatternViewer";
import { Wizard } from "./components/Wizard";
import { ResultView } from "./components/ResultView";
import { I18nProvider } from "./i18n";
import type { Ambient, UseCase } from "./lib/presets";
import "./styles.css";

export type View =
  | { name: "home" }
  | { name: "pattern"; id: string }
  | { name: "wizard" }
  | { name: "result"; id: string };

export interface Prefs {
  useCase: UseCase;
  ambient: Ambient;
}

const PREFS_KEY = "nitpick.prefs.v1";

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    return { useCase: p.useCase ?? "general", ambient: p.ambient ?? "dim" };
  } catch {
    return { useCase: "general", ambient: "dim" };
  }
}

function Screens() {
  const [view, setView] = useState<View>({ name: "home" });
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  switch (view.name) {
    case "pattern":
      return <PatternViewer initialId={view.id} onClose={() => setView({ name: "home" })} />;
    case "wizard":
      return (
        <Wizard
          prefs={prefs}
          onExit={() => setView({ name: "home" })}
          onSaved={(id) => setView({ name: "result", id })}
        />
      );
    case "result":
      return <ResultView id={view.id} onBack={() => setView({ name: "home" })} />;
    default:
      return <Home prefs={prefs} onPrefs={setPrefs} onNavigate={setView} />;
  }
}

export default function App() {
  return (
    <I18nProvider>
      <Screens />
    </I18nProvider>
  );
}
