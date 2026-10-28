import { useEffect, useState } from "react";
import { ChevronRight, Monitor, Play, Trash2 } from "lucide-react";
import type { Prefs, View } from "../App";
import { Logo } from "./Logo";
import { MonitorControls } from "./MonitorControls";
import { ProfilesPanel } from "./ProfilesPanel";
import { PATTERNS } from "../patterns";
import { AMBIENTS, USE_CASES, getTargets } from "../lib/presets";
import { deleteResult, loadResults, resultTitle, type SavedResult } from "../lib/storage";
import { displayLabel, getDisplays, isTauri, measureRefreshRate, type DisplayInfo } from "../lib/platform";
import { LANGS, useI18n } from "../i18n";
import { version } from "../../package.json";

/** Turkish writes the percent sign first (%125). */
const percent = (n: number, lang: string) => (lang === "tr" ? `%${n}` : `${n}%`);

interface Props {
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  onNavigate: (v: View) => void;
}

export function Home({ prefs, onPrefs, onNavigate }: Props) {
  const { t, lang, setLang, locale } = useI18n();
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
        <div className="topbar-right">
          {current && (
            <div
              className="display-chip"
              title={
                displays.length > 1
                  ? t({ en: `${displays.length} displays connected`, tr: `${displays.length} ekran bağlı` })
                  : undefined
              }
            >
              <Monitor size={15} />
              <span>
                {displayLabel(current, t)} · {current.width}×{current.height}
                {current.scale !== 1 && ` · ${percent(Math.round(current.scale * 100), lang)}`}
                {hz && ` · ${hz} Hz`}
              </span>
            </div>
          )}
          <div className="lang-switch" role="group" aria-label={t({ en: "Language", tr: "Dil" })}>
            {LANGS.map((l) => (
              <button key={l.id} className={lang === l.id ? "on" : ""} onClick={() => setLang(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-card">
          <div className="hero-text">
            <h1>{t({ en: "Find your monitor's best settings", tr: "Monitörünüz için en iyi ayarları bulun" })}</h1>
            <p>
              {t({
                en: "A short guided check of brightness, contrast, gamma, color and sharpness. No calibration hardware needed; just your eyes and your monitor's menu buttons.",
                tr: "Parlaklık, kontrast, gama, renk ve keskinlik için kısa, adım adım bir kontrol. Kalibrasyon cihazı gerekmez; gözleriniz ve monitörünüzün menü tuşları yeterli.",
              })}
            </p>
          </div>

          <div className="pickers">
            <fieldset>
              <legend>{t({ en: "What do you use it for?", tr: "Ekranı ne için kullanıyorsunuz?" })}</legend>
              <div className="seg">
                {USE_CASES.map((u) => (
                  <button
                    key={u.id}
                    className={prefs.useCase === u.id ? "on" : ""}
                    onClick={() => onPrefs({ ...prefs, useCase: u.id })}
                    title={t(u.hint)}
                  >
                    {t(u.label)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{t({ en: "How is your room lit?", tr: "Odanız ne kadar aydınlık?" })}</legend>
              <div className="seg">
                {AMBIENTS.map((a) => (
                  <button
                    key={a.id}
                    className={prefs.ambient === a.id ? "on" : ""}
                    onClick={() => onPrefs({ ...prefs, ambient: a.id })}
                    title={t(a.hint)}
                  >
                    {t(a.label)}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="hero-foot">
            <dl className="targets">
              <div>
                <dt>{t({ en: "Brightness", tr: "Parlaklık" })}</dt>
                <dd>
                  {targets.luminance[0]}–{targets.luminance[1]} {t({ en: "nits", tr: "nit" })}
                </dd>
              </div>
              <div>
                <dt>{t({ en: "Gamma", tr: "Gama" })}</dt>
                <dd>{targets.gamma.toFixed(1)}</dd>
              </div>
              <div>
                <dt>{t({ en: "White point", tr: "Beyaz noktası" })}</dt>
                <dd>{targets.whitePoint}</dd>
              </div>
            </dl>
            <button className="btn primary big" onClick={() => onNavigate({ name: "wizard" })}>
              <Play size={18} /> {t({ en: "Start guided setup", tr: "Rehberli ayara başla" })}
            </button>
          </div>
        </section>

        {isTauri() && (
          <section>
            <MonitorControls standalone />
          </section>
        )}

        {isTauri() && (
          <section>
            <ProfilesPanel />
          </section>
        )}

        <section>
          <div className="section-title">
            <h2>{t({ en: "Test patterns", tr: "Test desenleri" })}</h2>
            <p>
              {t({
                en: "You can also open each pattern on its own. Press Esc to leave and ← → to switch variants.",
                tr: "Desenleri tek tek de açabilirsiniz. Çıkmak için Esc, varyant değiştirmek için ← → tuşlarını kullanın.",
              })}
            </p>
          </div>
          <div className="pattern-grid">
            {PATTERNS.map((p) => (
              <button key={p.id} className="pattern-card" onClick={() => onNavigate({ name: "pattern", id: p.id })}>
                <div className="thumb" style={{ background: p.thumb }} />
                <div className="pc-text">
                  <b>{t(p.name)}</b>
                  <span>{t(p.summary)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {results.length > 0 && (
          <section>
            <div className="section-title">
              <h2>{t({ en: "Saved results", tr: "Kayıtlı sonuçlar" })}</h2>
            </div>
            <div className="results-list">
              {results.map((r) => (
                <div key={r.id} className="result-row">
                  <button className="result-open" onClick={() => onNavigate({ name: "result", id: r.id })}>
                    <div>
                      <b>{resultTitle(r, t)}</b>
                      <span>
                        {new Date(r.date).toLocaleString(locale)} · {t(USE_CASES.find((u) => u.id === r.useCase)!.label)} ·{" "}
                        {t(AMBIENTS.find((a) => a.id === r.ambient)!.label)}
                      </span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={t({ en: "Delete result", tr: "Sonucu sil" })}
                    title={t({ en: "Delete result", tr: "Sonucu sil" })}
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
        NitPick v{version} · {t({ en: "MIT License", tr: "MIT Lisansı" })} ·{" "}
        {isTauri() ? t({ en: "Desktop app", tr: "Masaüstü uygulaması" }) : t({ en: "Web version", tr: "Web sürümü" })}
      </footer>
    </div>
  );
}
