"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AtsReview, CvContent } from "@/lib/cv-schema";
import { PRO_PRICE } from "@/lib/brand";
import type { StepProps } from "../wizard";
import { CvEditor } from "./cv-editor";

const PROGRESS = [
  "Reading your interview answers…",
  "Checking your diplomas and certificates…",
  "Matching your experience to the job…",
  "Writing achievement bullets…",
  "Running an ATS check…",
  "Polishing the final wording…",
];

export function ResultStep({
  cv,
  setCv,
  save,
  pro,
  docsCount,
  goTo,
}: StepProps & { pro: boolean; docsCount: number; goTo: (step: number) => void }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  // Bumped whenever the PDF changes, to refresh the preview.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!generating) return;
    setProgress(0);
    const t = setInterval(() => setProgress((p) => Math.min(p + 1, PROGRESS.length - 1)), 9000);
    return () => clearInterval(t);
  }, [generating]);

  useEffect(() => setVersion((v) => v + 1), [cv.template, cv.accent, cv.photo_path]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/cvs/${cv.id}/generate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed.");
      setCv((prev) => ({ ...prev, content: json.cv as CvContent, ats: json.ats as AtsReview, generated_at: new Date().toISOString() }));
      setVersion((v) => v + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function saveContent(content: CvContent) {
    await save({ content });
    setEditing(false);
    setVersion((v) => v + 1);
  }

  const answered = cv.interview.filter((m) => m.role === "user").length;

  if (generating) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <span className="size-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <h2 className="mt-6 text-lg font-semibold">Writing your CV</h2>
        <p className="mt-1 text-sm text-muted">{PROGRESS[progress]}</p>
        <p className="mt-6 text-xs text-muted">This usually takes about a minute. Please keep this page open.</p>
      </div>
    );
  }

  if (!cv.content) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <h1 className="font-serif text-2xl font-semibold">Ready to generate</h1>
        <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
          <Check ok={Boolean(cv.target_role)} label={cv.target_role ? `Target: ${cv.target_role}` : "No target role"} onFix={() => goTo(0)} />
          <Check ok={answered >= 3} label={`${answered} interview answers`} onFix={() => goTo(1)} />
          <Check ok={docsCount > 0} label={`${docsCount} documents uploaded`} onFix={() => goTo(2)} optional />
          <Check ok={Boolean(cv.photo_path)} label={cv.photo_path ? "Photo added" : "No photo"} onFix={() => goTo(2)} optional />
        </ul>
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        <button onClick={generate} className="btn-primary mt-8 px-8 py-3 text-base">
          ✨ Generate my CV
        </button>
      </div>
    );
  }

  const ats = cv.ats;
  const score = ats ? Math.round(ats.score) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">Preview</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditing(true)} className="btn-secondary">
              Edit text
            </button>
            <button onClick={() => goTo(3)} className="btn-secondary">
              Change design
            </button>
            <a href={`/api/cvs/${cv.id}/pdf?download=1&v=${version}`} className="btn-primary">
              Download PDF
            </a>
          </div>
        </div>
        <iframe
          key={version}
          src={`/api/cvs/${cv.id}/pdf?v=${version}#view=FitH&toolbar=0`}
          title="CV preview"
          className="h-[80vh] w-full bg-slate-100"
        />
      </section>

      <aside className="space-y-4">
        {ats && score !== null && (
          <div className="card p-5">
            <p className="text-sm font-semibold">ATS match score</p>
            <div className="mt-3 flex items-center gap-4">
              <div
                className="grid size-20 place-items-center rounded-full text-2xl font-bold"
                style={{
                  background: `conic-gradient(${score >= 75 ? "#15803d" : score >= 55 ? "#b45309" : "#dc2626"} ${score * 3.6}deg, #e2e8f0 0)`,
                }}
              >
                <span className="grid size-16 place-items-center rounded-full bg-white">{score}</span>
              </div>
              <p className="text-xs text-muted">
                How well this CV matches {cv.target_role ? `“${cv.target_role}”` : "the target role"} for screening software
                and recruiters.
              </p>
            </div>
            <Review title="Strengths" items={ats.strengths} tone="good" />
            <Review title="To improve" items={ats.improvements} tone="warn" />
            {ats.missingKeywords.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Missing keywords</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ats.missingKeywords.map((k) => (
                    <span key={k} className="rounded-full bg-paper px-2 py-1 text-xs">
                      {k}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  If you have these skills, mention them in the interview and regenerate.
                </p>
              </div>
            )}
          </div>
        )}

        {!pro && (
          <div className="card border-brand/30 bg-brand-soft p-5">
            <p className="text-sm font-semibold">Remove the footer & get more generations</p>
            <p className="mt-1 text-xs text-muted">Free downloads include a small “Created with” footer.</p>
            <Link href="/pricing" className="btn-primary mt-3 w-full">
              Go Pro · {PRO_PRICE}
            </Link>
          </div>
        )}

        <div className="card space-y-2 p-5">
          <p className="text-sm font-semibold">Improve it</p>
          <button onClick={() => goTo(1)} className="btn-secondary w-full">
            Add details in the interview
          </button>
          <button onClick={generate} className="btn-secondary w-full">
            Regenerate
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-muted">Regenerating replaces any manual text edits.</p>
        </div>
      </aside>

      {editing && <CvEditor initial={cv.content} onCancel={() => setEditing(false)} onSave={saveContent} />}
    </div>
  );
}

function Check({ ok, label, onFix, optional }: { ok: boolean; label: string; onFix: () => void; optional?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-good" : optional ? "text-muted" : "text-warn"}>{ok ? "✓" : optional ? "○" : "!"}</span>
      <span className="flex-1">{label}</span>
      {!ok && (
        <button onClick={onFix} className="text-xs font-medium text-brand hover:underline">
          {optional ? "Add" : "Fix"}
        </button>
      )}
    </li>
  );
}

function Review({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className={tone === "good" ? "text-good" : "text-warn"}>{tone === "good" ? "✓" : "→"}</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
