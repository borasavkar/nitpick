import { useEffect, useState } from "react";
import { ChevronRight, Monitor, Play, Trash2 } from "lucide-react";
import type { Prefs, View } from "../App";
import { Logo } from "./Logo";
import { PATTERNS } from "../patterns";
import { AMBIENTS, USE_CASES, getTargets } from "../lib/presets";
import { deleteResult, loadResults, type SavedResult } from "../lib/storage";
import { getDisplays, isTauri, measureRefreshRate, type DisplayInfo } from "../lib/platform";

interface Props {
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  onNavigate: (v: View) => void;
}

export function Home({ prefs, onPrefs, onNavigate }: Props) {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [hz, setHz] = useState<number | null>(null);
  const [results, setResults] = useState<SavedResult[]>(loadResults);
  const targets = getTargets(prefs.useCase, prefs.ambient);

  useEffect(() => {
    getDisplays().then(setDisplays).catch(() => setDisplays([]));
    measureRefreshRate().then(setHz);
  }, []);

  const current = displays.find((d) => d.current) ?? displays[0];

  return (
    <div className="home">
      <header className="topbar">
        <div className="brand">
          <Logo />
          <span>NitPick</span>
        </div>
        {current && (
          <div className="display-chip" title={displays.length > 1 ? `${displays.length} displays connected` : undefined}>
            <Monitor size={15} />
            <span>
              {current.label} · {current.width}×{current.height}
              {current.scale !== 1 && ` · ${Math.round(current.scale * 100)}%`}
              {hz && ` · ${hz} Hz`}
            </span>
          </div>
        )}
      </header>

      <main className="home-main">
        <section className="hero-card">
          <div className="hero-text">
            <h1>Find your monitor's best settings</h1>
            <p>
              A short guided check of brightness, contrast, gamma, color and sharpness. No calibration hardware needed;
              just your eyes and your monitor's menu buttons.
            </p>
          </div>

          <div className="pickers">
            <fieldset>
              <legend>What do you use it for?</legend>
              <div className="seg">
                {USE_CASES.map((u) => (
                  <button
                    key={u.id}
                    className={prefs.useCase === u.id ? "on" : ""}
                    onClick={() => onPrefs({ ...prefs, useCase: u.id })}
                    title={u.hint}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>How is your room lit?</legend>
              <div className="seg">
                {AMBIENTS.map((a) => (
                  <button
                    key={a.id}
                    className={prefs.ambient === a.id ? "on" : ""}
                    onClick={() => onPrefs({ ...prefs, ambient: a.id })}
                    title={a.hint}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="hero-foot">
            <dl className="targets">
              <div>
                <dt>Brightness</dt>
                <dd>
                  {targets.luminance[0]}–{targets.luminance[1]} nits
                </dd>
              </div>
              <div>
                <dt>Gamma</dt>
                <dd>{targets.gamma.toFixed(1)}</dd>
              </div>
              <div>
                <dt>White point</dt>
                <dd>{targets.whitePoint}</dd>
              </div>
            </dl>
            <button className="btn primary big" onClick={() => onNavigate({ name: "wizard" })}>
              <Play size={18} /> Start guided setup
            </button>
          </div>
        </section>

        <section>
          <div className="section-title">
            <h2>Test patterns</h2>
            <p>Open any pattern on its own. Press Esc to leave, ← → to switch variants.</p>
          </div>
          <div className="pattern-grid">
            {PATTERNS.map((p) => (
              <button key={p.id} className="pattern-card" onClick={() => onNavigate({ name: "pattern", id: p.id })}>
                <div className="thumb" style={{ background: p.thumb }} />
                <div className="pc-text">
                  <b>{p.name}</b>
                  <span>{p.summary}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {results.length > 0 && (
          <section>
            <div className="section-title">
              <h2>Saved results</h2>
            </div>
            <div className="results-list">
              {results.map((r) => (
                <div key={r.id} className="result-row">
                  <button className="result-open" onClick={() => onNavigate({ name: "result", id: r.id })}>
                    <div>
                      <b>{r.display}</b>
                      <span>
                        {new Date(r.date).toLocaleString()} · {USE_CASES.find((u) => u.id === r.useCase)?.label} ·{" "}
                        {AMBIENTS.find((a) => a.id === r.ambient)?.label}
                      </span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="Delete result"
                    onClick={() => {
                      deleteResult(r.id);
                      setResults(loadResults());
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="home-foot">
        NitPick v0.1 · MIT License ·{" "}
        {isTauri() ? "Desktop app" : "Web version"}
      </footer>
    </div>
  );
}
