import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Maximize, Minimize, SlidersHorizontal, X } from "lucide-react";
import type { Prefs } from "../App";
import { getPattern } from "../patterns";
import { getTargets } from "../lib/presets";
import { WIZARD_STEPS } from "../lib/wizard";
import { saveResult, type OsdValues } from "../lib/storage";
import { getDisplays, isFullscreen, setFullscreen } from "../lib/platform";
import { AdviceList, ToneIcon } from "./ResultView";

interface Props {
  prefs: Prefs;
  onExit: () => void;
  onSaved: (id: string) => void;
}

const OSD_FIELDS: { key: keyof OsdValues; label: string; placeholder: string }[] = [
  { key: "pictureMode", label: "Picture mode", placeholder: "e.g. Standard, sRGB, User" },
  { key: "brightness", label: "Brightness", placeholder: "e.g. 35" },
  { key: "contrast", label: "Contrast", placeholder: "e.g. 70" },
  { key: "colorTemp", label: "Color temperature", placeholder: "e.g. Normal, 6500K, User R/G/B" },
  { key: "sharpness", label: "Sharpness", placeholder: "e.g. 50" },
  { key: "overdrive", label: "Overdrive / Response time", placeholder: "e.g. Normal" },
];

const EMPTY_OSD: OsdValues = { pictureMode: "", brightness: "", contrast: "", colorTemp: "", sharpness: "", overdrive: "" };

export function Wizard({ prefs, onExit, onSaved }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [osd, setOsd] = useState<OsdValues>(EMPTY_OSD);
  const [panelHidden, setPanelHidden] = useState(false);
  const [full, setFull] = useState(false);
  const [displayName, setDisplayName] = useState("This display");
  const targets = getTargets(prefs.useCase, prefs.ambient);

  const total = WIZARD_STEPS.length;
  const isSummary = stepIndex >= total;
  const step = isSummary ? null : WIZARD_STEPS[stepIndex];
  const answer = step ? answers[step.id] : undefined;
  const canContinue = !step || !step.options || answer != null || step.optional;

  useEffect(() => {
    getDisplays()
      .then((ds) => {
        const d = ds.find((x) => x.current) ?? ds[0];
        if (d) setDisplayName(`${d.label} (${d.width}×${d.height})`);
      })
      .catch(() => {});
    isFullscreen().then(setFull).catch(() => {});
  }, []);

  const toggleFull = async () => {
    await setFullscreen(!full);
    setFull(await isFullscreen());
  };

  const exit = () => {
    setFullscreen(false).finally(onExit);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key.toLowerCase() === "h") setPanelHidden((h) => !h);
      if (e.key === "Escape" && panelHidden) setPanelHidden(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelHidden]);

  const save = () => {
    const id = crypto.randomUUID();
    saveResult({
      id,
      date: new Date().toISOString(),
      display: displayName,
      useCase: prefs.useCase,
      ambient: prefs.ambient,
      answers,
      osd,
    });
    setFullscreen(false).finally(() => onSaved(id));
  };

  const pattern = step?.patternId ? getPattern(step.patternId) : null;
  const advice = step?.advise && answer ? step.advise(answer, targets) : null;

  return (
    <div className={`wizard ${panelHidden ? "panel-hidden" : ""}`}>
      <div className="wizard-stage" onClick={() => panelHidden && setPanelHidden(false)}>
        {pattern ? pattern.render(step?.variant ?? 0) : <div className="neutral-stage" />}
        {panelHidden && <div className="stage-hint">Click or press H to show the guide</div>}
      </div>

      <aside className="wizard-panel">
        <div className="wp-top">
          <div className="progress" aria-label={`Step ${Math.min(stepIndex + 1, total)} of ${total}`}>
            {WIZARD_STEPS.map((s, i) => (
              <span key={s.id} className={i < stepIndex ? "done" : i === stepIndex ? "now" : ""} />
            ))}
          </div>
          <div className="wp-tools">
            {!isSummary && pattern && (
              <button className="icon-btn" onClick={() => setPanelHidden(true)} title="Hide guide (H)" aria-label="Hide guide">
                <EyeOff size={17} />
              </button>
            )}
            <button className="icon-btn" onClick={toggleFull} title="Toggle fullscreen" aria-label="Toggle fullscreen">
              {full ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
            <button className="icon-btn" onClick={exit} title="Exit setup" aria-label="Exit setup">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="wp-body">
          {step ? (
            <>
              <div className="step-label">
                Step {stepIndex + 1} of {total}
                {step.optional && " · optional"}
              </div>
              <h2>{step.title}</h2>
              {step.controls && (
                <div className="controls-chip">
                  <SlidersHorizontal size={14} /> Monitor menu: {step.controls}
                </div>
              )}
              <ul className="steps-list">
                {step.instructions(targets).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              {step.question && step.options && (
                <div className="question">
                  <h3>{step.question}</h3>
                  <div className="options">
                    {step.options.map((o) => (
                      <button
                        key={o.id}
                        className={answer === o.id ? "on" : ""}
                        onClick={() => setAnswers({ ...answers, [step.id]: o.id })}
                      >
                        {answer === o.id && <Check size={15} />} {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {advice && (
                <div className={`advice ${advice.tone}`}>
                  <ToneIcon tone={advice.tone} />
                  <p>{advice.text}</p>
                </div>
              )}

              {pattern && (
                <button className="link-btn" onClick={() => setPanelHidden(true)}>
                  <Eye size={15} /> View the pattern without this panel (H)
                </button>
              )}
            </>
          ) : (
            <>
              <div className="step-label">All done</div>
              <h2>Your results</h2>
              <AdviceList answers={answers} targets={targets} />
              <div className="osd-form">
                <h3>Write down your monitor's settings</h3>
                <p className="muted">Optional, but handy if you reset the monitor later.</p>
                {OSD_FIELDS.map((f) => (
                  <label key={f.key}>
                    <span>{f.label}</span>
                    <input
                      value={osd[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => setOsd({ ...osd, [f.key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="wp-foot">
          <button className="btn ghost" disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
          {isSummary ? (
            <button className="btn primary" onClick={save}>
              <Check size={16} /> Save results
            </button>
          ) : (
            <button className="btn primary" disabled={!canContinue} onClick={() => setStepIndex(stepIndex + 1)}>
              {stepIndex === 0 ? "I'm ready" : "Next"} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
