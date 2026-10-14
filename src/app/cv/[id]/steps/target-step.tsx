"use client";

import { useState } from "react";
import { LANGUAGES } from "@/lib/cv-schema";
import type { StepProps } from "../wizard";

export function TargetStep({ cv, save, next }: StepProps) {
  const [role, setRole] = useState(cv.target_role);
  const [language, setLanguage] = useState(cv.language);
  const [jobDescription, setJobDescription] = useState(cv.job_description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await save({ target_role: role.trim(), language, job_description: jobDescription.trim() });
      next();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold">What job are you going for?</h1>
        <p className="mt-1 text-sm text-muted">
          The AI tailors your CV to this role. Paste a job advert for the best match with recruiters&apos; screening
          software.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="label" htmlFor="role">
            Target job title
          </label>
          <input
            id="role"
            required
            className="input"
            placeholder="e.g. Marketing Manager"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="language">
            CV language
          </label>
          <select id="language" className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="jd">
          Job advert <span className="font-normal text-muted">(optional, recommended)</span>
        </label>
        <textarea
          id="jd"
          rows={8}
          maxLength={15000}
          className="input resize-y"
          placeholder="Paste the full job description here…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button className="btn-primary" disabled={busy || !role.trim()}>
          {busy ? "Saving…" : "Start the interview →"}
        </button>
      </div>
    </form>
  );
}
