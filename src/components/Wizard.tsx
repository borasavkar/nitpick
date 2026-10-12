import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Maximize, Minimize, SlidersHorizontal, X } from "lucide-react";
import type { Prefs } from "../App";
import { getPattern } from "../patterns";
import { getTargets } from "../lib/presets";
import { WIZARD_STEPS } from "../lib/wizard";
import { OSD_FIELDS, saveResult, type OsdValues } from "../lib/storage";
import { getDisplays, isFullscreen, setFullscreen } from "../lib/platform";
import { useI18n } from "../i18n";
import { AdviceList, ToneIcon } from "./ResultView";

interface Props {
  prefs: Prefs;
  onExit: () => void;
  onSaved: (id: string) => void;
}

const EMPTY_OSD: OsdValues = { pictureMode: "", brightness: "", contrast: "", colorTemp: "", sharpness: "", overdrive: "" };

export function Wizard({ prefs, onExit, onSaved }: Props) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [osd, setOsd] = useState<OsdValues>(EMPTY_OSD);
  const [panelHidden, setPanelHidden] = useState(false);
  const [full, setFull] = useState(false);
  const [display, setDisplay] = useState({ number: 0, width: screen.width, height: screen.height });
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
        if (d) setDisplay({ number: d.number, width: d.width, height: d.height });
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
      display,
      useCase: prefs.useCase,
      ambient: prefs.ambient,
      answers,
      osd,
    });
    setFullscreen(false).finally(() => onSaved(id));
  };

  const pattern = step?.patternId ? getPattern(step.patternId) : null;
  const advice = step?.advise && answer ? step.advise(answer, targets) : null;
  const stepNo = Math.min(stepIndex + 1, total);

  return (
    <div className={`wizard ${panelHidden ? "panel-hidden" : ""}`}>
      <div className="wizard-stage" onClick={() => panelHidden && setPanelHidden(false)}>
        {pattern ? pattern.render(step?.variant ?? 0) : <div className="neutral-stage" />}
        {panelHidden && (
          <div className="stage-hint">
            {t({ en: "Click or press H to show the guide", tr: "Rehberi göstermek için tıklayın ya da H tuşuna basın" })}
          </div>
        )}
      </div>

      <aside className="wizard-panel">
        <div className="wp-top">
          <div className="progress" aria-label={t({ en: `Step ${stepNo} of ${total}`, tr: `Adım ${stepNo}/${total}` })}>
            {WIZARD_STEPS.map((s, i) => (
              <span key={s.id} className={i < stepIndex ? "done" : i === stepIndex ? "now" : ""} />
            ))}
          </div>
          <div className="wp-tools">
            {!isSummary && pattern && (
              <button
                className="icon-btn"
                onClick={() => setPanelHidden(true)}
                title={t({ en: "Hide guide (H)", tr: "Rehberi gizle (H)" })}
                aria-label={t({ en: "Hide guide", tr: "Rehberi gizle" })}
              >
                <EyeOff size={17} />
              </button>
            )}
            <button
              className="icon-btn"
              onClick={toggleFull}
              title={t({ en: "Toggle fullscreen", tr: "Tam ekranı aç/kapat" })}
              aria-label={t({ en: "Toggle fullscreen", tr: "Tam ekranı aç/kapat" })}
            >
              {full ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
            <button
              className="icon-btn"
              onClick={exit}
              title={t({ en: "Exit setup", tr: "Ayardan çık" })}
              aria-label={t({ en: "Exit setup", tr: "Ayardan çık" })}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="wp-body">
          {step ? (
            <>
              <div className="step-label">
                {t({ en: `Step ${stepNo} of ${total}`, tr: `Adım ${stepNo}/${total}` })}
                {step.optional && t({ en: " · optional", tr: " · isteğe bağlı" })}
              </div>
              <h2>{t(step.title)}</h2>
              {step.controls && (
                <div className="controls-chip">
                  <SlidersHorizontal size={14} /> {t({ en: "Related settings", tr: "İlgili ayarlar" })}: {t(step.controls)}
                </div>
              )}
              <ul className="steps-list">
                {step.instructions(targets).map((text) => (
                  <li key={text.en}>{t(text)}</li>
                ))}
              </ul>

              {step.question && step.options && (
                <div className="question">
                  <h3>{t(step.question)}</h3>
                  <div className="options">
                    {step.options.map((o) => (
                      <button
                        key={o.id}
                        className={answer === o.id ? "on" : ""}
                        onClick={() => setAnswers({ ...answers, [step.id]: o.id })}
                      >
                        {answer === o.id && <Check size={15} />} {t(o.label)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {advice && (
                <div className={`advice ${advice.tone}`}>
                  <ToneIcon tone={advice.tone} />
                  <p>{t(advice.text)}</p>
                </div>
              )}

              {pattern && (
                <button className="link-btn" onClick={() => setPanelHidden(true)}>
                  <Eye size={15} /> {t({ en: "View the pattern without this panel (H)", tr: "Deseni bu panel olmadan görüntüle (H)" })}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="step-label">{t({ en: "All done", tr: "Tamamlandı" })}</div>
              <h2>{t({ en: "Your results", tr: "Sonuçlarınız" })}</h2>
              <AdviceList answers={answers} targets={targets} />
              <div className="osd-form">
                <h3>{t({ en: "Write down your monitor's settings", tr: "Monitör ayarlarınızı not edin" })}</h3>
                <p className="muted">
                  {t({
                    en: "Optional, but handy if you reset the monitor later.",
                    tr: "İsteğe bağlıdır, ancak monitörü ileride sıfırlarsanız işinize yarar.",
                  })}
                </p>
                {OSD_FIELDS.map((f) => (
                  <label key={f.key}>
                    <span>{t(f.label)}</span>
                    <input
                      value={osd[f.key]}
                      placeholder={t(f.placeholder)}
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
            <ArrowLeft size={16} /> {t({ en: "Back", tr: "Geri" })}
          </button>
          {isSummary ? (
            <button className="btn primary" onClick={save}>
              <Check size={16} /> {t({ en: "Save results", tr: "Sonuçları kaydet" })}
            </button>
          ) : (
            <button className="btn primary" disabled={!canContinue} onClick={() => setStepIndex(stepIndex + 1)}>
              {stepIndex === 0 ? t({ en: "I'm ready", tr: "Hazırım" }) : t({ en: "Next", tr: "İleri" })} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
