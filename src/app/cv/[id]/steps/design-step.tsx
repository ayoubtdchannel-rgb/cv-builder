"use client";

import Image from "next/image";
import { ACCENTS, TEMPLATES } from "@/lib/cv-schema";
import type { StepProps } from "../wizard";

export function DesignStep({ cv, save, next, back }: StepProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="card p-6 sm:p-8">
        <h1 className="font-serif text-2xl font-semibold">Choose a design</h1>
        <p className="mt-1 text-sm text-muted">You can switch designs at any time without regenerating.</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const selected = cv.template === t.id;
            return (
              <button
                key={t.id}
                onClick={() => void save({ template: t.id })}
                className={`group rounded-2xl border-2 p-3 text-left transition ${
                  selected ? "border-brand bg-brand-soft/50" : "border-line hover:border-slate-300"
                }`}
              >
                <div className="overflow-hidden rounded-lg border border-line bg-white">
                  <Image
                    src={`/templates/${t.id}.png`}
                    alt={`${t.name} template`}
                    width={595}
                    height={842}
                    className="h-auto w-full transition group-hover:scale-[1.02]"
                  />
                </div>
                <p className="mt-3 flex items-center gap-2 font-semibold">
                  {t.name}
                  {t.id === "classic" && (
                    <span className="rounded-full bg-good/15 px-2 py-0.5 text-[11px] font-medium text-good">Best for ATS</span>
                  )}
                </p>
                <p className="text-xs text-muted">{t.blurb}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="label">Accent colour</p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => void save({ accent: c })}
                aria-label={`Accent ${c}`}
                className={`size-9 rounded-full border border-white/25 ring-offset-2 ring-offset-night transition ${cv.accent === c ? "ring-2 ring-white" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={back} className="btn-ghost">
          ← Back
        </button>
        <button onClick={next} className="btn-primary">
          {cv.content ? "See my CV →" : "Continue to generate →"}
        </button>
      </div>
    </div>
  );
}
