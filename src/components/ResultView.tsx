import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, XCircle } from "lucide-react";
import { AMBIENTS, USE_CASES, getTargets, type Targets } from "../lib/presets";
import { WIZARD_STEPS, type Tone } from "../lib/wizard";
import { OSD_FIELDS, loadResults, resultTitle, type SavedResult } from "../lib/storage";
import { useI18n, type L } from "../i18n";

export function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "good") return <CheckCircle2 size={18} className="tone-icon good" />;
  if (tone === "warn") return <AlertTriangle size={18} className="tone-icon warn" />;
  return <XCircle size={18} className="tone-icon bad" />;
}

function answeredSteps(answers: Record<string, string>, targets: Targets) {
  return WIZARD_STEPS.filter((s) => s.advise && answers[s.id]).map((s) => ({
    step: s,
    label: s.options?.find((o) => o.id === answers[s.id])?.label ?? { en: answers[s.id], tr: answers[s.id] },
    advice: s.advise!(answers[s.id], targets),
  }));
}

/** One row per answered wizard step with its verdict and advice. */
export function AdviceList({ answers, targets }: { answers: Record<string, string>; targets: Targets }) {
  const { t } = useI18n();
  const rows = answeredSteps(answers, targets);
  if (rows.length === 0) return <p className="muted">{t({ en: "No answers recorded.", tr: "Kayıtlı cevap yok." })}</p>;
  return (
    <div className="advice-list">
      {rows.map(({ step, label, advice }) => (
        <div key={step.id} className={`advice-row ${advice.tone}`}>
          <ToneIcon tone={advice.tone} />
          <div>
            <b>
              {t(step.title)}: <span className="answer">{t(label)}</span>
            </b>
            <p>{t(advice.text)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function toText(r: SavedResult, targets: Targets, t: (text: L) => string, locale: string): string {
  const useCase = t(USE_CASES.find((u) => u.id === r.useCase)!.label);
  const ambient = t(AMBIENTS.find((a) => a.id === r.ambient)!.label);
  const [lo, hi] = targets.luminance;
  const lines = [
    `${t({ en: "NitPick results", tr: "NitPick sonuçları" })} — ${resultTitle(r, t)}`,
    new Date(r.date).toLocaleString(locale),
    t({ en: `Use: ${useCase}, room: ${ambient}`, tr: `Kullanım: ${useCase}, oda: ${ambient}` }),
    t({
      en: `Targets: ${lo}–${hi} nits, gamma ${targets.gamma.toFixed(1)}, ${targets.whitePoint}`,
      tr: `Hedefler: ${lo}–${hi} nit, gama ${targets.gamma.toFixed(1)}, ${targets.whitePoint}`,
    }),
    "",
    t({ en: "Monitor settings:", tr: "Monitör ayarları:" }),
    ...OSD_FIELDS.map((f) => `  ${t(f.label)}: ${r.osd[f.key] || "-"}`),
    "",
    t({ en: "Checks:", tr: "Kontroller:" }),
    ...answeredSteps(r.answers, targets).map(
      ({ step, label, advice }) => `  ${t(step.title)}: ${t(label)} — ${t(advice.text)}`,
    ),
  ];
  return lines.join("\n");
}

export function ResultView({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, locale } = useI18n();
  const result = loadResults().find((r) => r.id === id);
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="result-page">
        <button className="btn ghost" onClick={onBack}>
          <ArrowLeft size={16} /> {t({ en: "Back", tr: "Geri" })}
        </button>
        <p className="muted">{t({ en: "This result could not be found.", tr: "Bu sonuç bulunamadı." })}</p>
      </div>
    );
  }

  const targets = getTargets(result.useCase, result.ambient);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText(result, targets, t, locale));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied; nothing else to do.
    }
  };

  return (
    <div className="result-page">
      <div className="result-head">
        <button className="btn ghost" onClick={onBack}>
          <ArrowLeft size={16} /> {t({ en: "Home", tr: "Ana sayfa" })}
        </button>
        <button className="btn ghost" onClick={copy}>
          <Copy size={16} />{" "}
          {copied ? t({ en: "Copied", tr: "Kopyalandı" }) : t({ en: "Copy as text", tr: "Metin olarak kopyala" })}
        </button>
      </div>

      <div className="result-card">
        <div className="rc-title">
          <h1>{resultTitle(result, t)}</h1>
          <span className="muted">
            {new Date(result.date).toLocaleString(locale)} · {t(USE_CASES.find((u) => u.id === result.useCase)!.label)} ·{" "}
            {t(AMBIENTS.find((a) => a.id === result.ambient)!.label)}
          </span>
        </div>

        <div className="rc-grid">
          <div>
            <h3>{t({ en: "Targets", tr: "Hedefler" })}</h3>
            <dl className="kv">
              <dt>{t({ en: "Brightness", tr: "Parlaklık" })}</dt>
              <dd>
                {targets.luminance[0]}–{targets.luminance[1]} {t({ en: "nits", tr: "nit" })}
              </dd>
              <dt>{t({ en: "Gamma", tr: "Gama" })}</dt>
              <dd>{targets.gamma.toFixed(1)}</dd>
              <dt>{t({ en: "White point", tr: "Beyaz noktası" })}</dt>
              <dd>{targets.whitePoint}</dd>
            </dl>
          </div>
          <div>
            <h3>{t({ en: "Monitor settings", tr: "Monitör ayarları" })}</h3>
            <dl className="kv">
              {OSD_FIELDS.map((f) => (
                <div key={f.key} className="kv-row">
                  <dt>{t(f.label)}</dt>
                  <dd>{result.osd[f.key] || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <h3>{t({ en: "Checks", tr: "Kontroller" })}</h3>
        <AdviceList answers={result.answers} targets={targets} />

        {targets.tips.length > 0 && (
          <>
            <h3>{t({ en: "Tips for your use", tr: "Kullanımınıza özel öneriler" })}</h3>
            <ul className="tips">
              {targets.tips.map((tip) => (
                <li key={tip.en}>{t(tip)}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
