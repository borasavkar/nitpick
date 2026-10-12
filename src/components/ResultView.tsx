import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, XCircle } from "lucide-react";
import { AMBIENTS, USE_CASES, getTargets, type Targets } from "../lib/presets";
import { WIZARD_STEPS, type Tone } from "../lib/wizard";
import { loadResults, type SavedResult } from "../lib/storage";

export function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "good") return <CheckCircle2 size={18} className="tone-icon good" />;
  if (tone === "warn") return <AlertTriangle size={18} className="tone-icon warn" />;
  return <XCircle size={18} className="tone-icon bad" />;
}

/** One row per answered wizard step with its verdict and advice. */
export function AdviceList({ answers, targets }: { answers: Record<string, string>; targets: Targets }) {
  const rows = WIZARD_STEPS.filter((s) => s.advise && answers[s.id]).map((s) => ({
    step: s,
    label: s.options?.find((o) => o.id === answers[s.id])?.label ?? answers[s.id],
    advice: s.advise!(answers[s.id], targets),
  }));
  if (rows.length === 0) return <p className="muted">No answers recorded.</p>;
  return (
    <div className="advice-list">
      {rows.map(({ step, label, advice }) => (
        <div key={step.id} className={`advice-row ${advice.tone}`}>
          <ToneIcon tone={advice.tone} />
          <div>
            <b>
              {step.title}: <span className="answer">{label}</span>
            </b>
            <p>{advice.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function toText(r: SavedResult, t: Targets): string {
  const lines = [
    `NitPick results — ${r.display}`,
    new Date(r.date).toLocaleString(),
    `Use: ${USE_CASES.find((u) => u.id === r.useCase)?.label}, room: ${AMBIENTS.find((a) => a.id === r.ambient)?.label}`,
    `Targets: ${t.luminance[0]}–${t.luminance[1]} nits, gamma ${t.gamma.toFixed(1)}, ${t.whitePoint}`,
    "",
    "Monitor settings:",
    `  Picture mode: ${r.osd.pictureMode || "-"}`,
    `  Brightness: ${r.osd.brightness || "-"}`,
    `  Contrast: ${r.osd.contrast || "-"}`,
    `  Color temperature: ${r.osd.colorTemp || "-"}`,
    `  Sharpness: ${r.osd.sharpness || "-"}`,
    `  Overdrive: ${r.osd.overdrive || "-"}`,
    "",
    "Checks:",
  ];
  for (const s of WIZARD_STEPS) {
    const a = r.answers[s.id];
    if (!a || !s.advise) continue;
    const label = s.options?.find((o) => o.id === a)?.label ?? a;
    lines.push(`  ${s.title}: ${label} — ${s.advise(a, t).text}`);
  }
  return lines.join("\n");
}

export function ResultView({ id, onBack }: { id: string; onBack: () => void }) {
  const result = loadResults().find((r) => r.id === id);
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="result-page">
        <button className="btn ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <p className="muted">This result could not be found.</p>
      </div>
    );
  }

  const t = getTargets(result.useCase, result.ambient);
  const osdRows: [string, string][] = [
    ["Picture mode", result.osd.pictureMode],
    ["Brightness", result.osd.brightness],
    ["Contrast", result.osd.contrast],
    ["Color temperature", result.osd.colorTemp],
    ["Sharpness", result.osd.sharpness],
    ["Overdrive", result.osd.overdrive],
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText(result, t));
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
          <ArrowLeft size={16} /> Home
        </button>
        <button className="btn ghost" onClick={copy}>
          <Copy size={16} /> {copied ? "Copied" : "Copy as text"}
        </button>
      </div>

      <div className="result-card">
        <div className="rc-title">
          <h1>{result.display}</h1>
          <span className="muted">
            {new Date(result.date).toLocaleString()} · {USE_CASES.find((u) => u.id === result.useCase)?.label} ·{" "}
            {AMBIENTS.find((a) => a.id === result.ambient)?.label}
          </span>
        </div>

        <div className="rc-grid">
          <div>
            <h3>Targets</h3>
            <dl className="kv">
              <dt>Brightness</dt>
              <dd>
                {t.luminance[0]}–{t.luminance[1]} nits
              </dd>
              <dt>Gamma</dt>
              <dd>{t.gamma.toFixed(1)}</dd>
              <dt>White point</dt>
              <dd>{t.whitePoint}</dd>
            </dl>
          </div>
          <div>
            <h3>Monitor settings</h3>
            <dl className="kv">
              {osdRows.map(([k, v]) => (
                <div key={k} className="kv-row">
                  <dt>{k}</dt>
                  <dd>{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <h3>Checks</h3>
        <AdviceList answers={result.answers} targets={t} />

        {t.tips.length > 0 && (
          <>
            <h3>Tips for your use</h3>
            <ul className="tips">
              {t.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
