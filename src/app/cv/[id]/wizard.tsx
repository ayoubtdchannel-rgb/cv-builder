"use client";

import { useState } from "react";
import type { AtsReview, CvContent, DocumentFacts, InterviewMessage } from "@/lib/cv-schema";
import { DesignStep } from "./steps/design-step";
import { DocumentsStep } from "./steps/documents-step";
import { InterviewStep } from "./steps/interview-step";
import { ResultStep } from "./steps/result-step";
import { TargetStep } from "./steps/target-step";

export type CvRecord = {
  id: string;
  title: string;
  target_role: string;
  job_description: string;
  language: string;
  interview: InterviewMessage[];
  interview_done: boolean;
  template: string;
  accent: string;
  photo_path: string | null;
  content: CvContent | null;
  ats: AtsReview | null;
  generated_at: string | null;
};

export type DocRecord = {
  id: string;
  file_name: string;
  mime_type: string;
  extracted: DocumentFacts | null;
  created_at: string;
};

export type CvPatch = Partial<
  Pick<CvRecord, "title" | "target_role" | "job_description" | "language" | "template" | "accent" | "photo_path" | "content" | "interview_done">
>;

const STEPS = ["Target job", "AI interview", "Documents & photo", "Design", "Your CV"];

export function Wizard({
  userId,
  pro,
  initialCv,
  initialDocs,
}: {
  userId: string;
  pro: boolean;
  initialCv: CvRecord;
  initialDocs: DocRecord[];
}) {
  const [cv, setCv] = useState(initialCv);
  const [docs, setDocs] = useState(initialDocs);
  const [step, setStep] = useState(() =>
    initialCv.content ? 4 : initialCv.interview.length > 0 ? 1 : 0,
  );

  /** Saves fields to the server and mirrors them locally. */
  async function save(patch: CvPatch) {
    setCv((prev) => ({ ...prev, ...patch }));
    const res = await fetch(`/api/cvs/${cv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't save.");
  }

  const props = { cv, setCv, save, next: () => setStep((s) => Math.min(s + 1, 4)), back: () => setStep((s) => Math.max(s - 1, 0)) };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ol className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <button
              onClick={() => setStep(i)}
              className={`w-full min-w-28 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                i === step
                  ? "border-brand bg-white shadow-sm"
                  : i < step
                    ? "border-line bg-white/60 text-muted hover:bg-white"
                    : "border-transparent text-muted hover:bg-white/60"
              }`}
            >
              <span className={`block font-semibold ${i === step ? "text-brand" : ""}`}>Step {i + 1}</span>
              <span className={i === step ? "text-ink" : ""}>{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && <TargetStep {...props} />}
      {step === 1 && <InterviewStep {...props} />}
      {step === 2 && <DocumentsStep {...props} userId={userId} docs={docs} setDocs={setDocs} />}
      {step === 3 && <DesignStep {...props} />}
      {step === 4 && <ResultStep {...props} pro={pro} docsCount={docs.length} goTo={setStep} />}
    </div>
  );
}

export type StepProps = {
  cv: CvRecord;
  setCv: React.Dispatch<React.SetStateAction<CvRecord>>;
  save: (patch: CvPatch) => Promise<void>;
  next: () => void;
  back: () => void;
};
