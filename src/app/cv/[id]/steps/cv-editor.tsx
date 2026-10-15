"use client";

import { useState } from "react";
import type { CvContent } from "@/lib/cv-schema";

type Section = "basics" | "experience" | "education" | "certifications" | "skills" | "languages" | "projects";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);

/** Full-screen form for hand-editing the generated CV text. */
export function CvEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial: CvContent;
  onCancel: () => void;
  onSave: (cv: CvContent) => Promise<void>;
}) {
  const [cv, setCv] = useState<CvContent>(() => structuredClone(initial));
  const [tab, setTab] = useState<Section>("basics");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CvContent>(key: K, value: CvContent[K]) {
    setCv((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onSave(cv);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const tabs: [Section, string][] = [
    ["basics", "Profile"],
    ["experience", cv.labels.experience],
    ["education", cv.labels.education],
    ["certifications", cv.labels.certifications],
    ["skills", cv.labels.skills],
    ["languages", cv.labels.languages],
    ["projects", cv.labels.projects],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[95dvh] w-full max-w-3xl flex-col rounded-t-2xl border border-white/15 bg-night/90 shadow-2xl backdrop-blur-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">Edit CV text</h2>
          <button onClick={onCancel} className="btn-ghost px-2" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === id ? "bg-brand-soft font-semibold text-indigo-200" : "text-muted hover:bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {tab === "basics" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["fullName", "headline", "email", "phone", "location", "linkedin", "website"] as const).map((k) => (
                <Field key={k} label={k} value={cv.basics[k]} onChange={(v) => set("basics", { ...cv.basics, [k]: v })} />
              ))}
              <div className="sm:col-span-2">
                <Field label="summary" multiline value={cv.basics.summary} onChange={(v) => set("basics", { ...cv.basics, summary: v })} />
              </div>
            </div>
          )}

          {tab === "experience" && (
            <List
              items={cv.experience}
              onChange={(v) => set("experience", v)}
              blank={{ role: "", company: "", location: "", start: "", end: "", bullets: [] }}
              render={(job, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="role" value={job.role} onChange={(v) => update({ ...job, role: v })} />
                  <Field label="company" value={job.company} onChange={(v) => update({ ...job, company: v })} />
                  <Field label="location" value={job.location} onChange={(v) => update({ ...job, location: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="start" value={job.start} onChange={(v) => update({ ...job, start: v })} />
                    <Field label="end" value={job.end} onChange={(v) => update({ ...job, end: v })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="bullets (one per line)"
                      multiline
                      value={job.bullets.join("\n")}
                      onChange={(v) => update({ ...job, bullets: lines(v) })}
                    />
                  </div>
                </div>
              )}
            />
          )}

          {tab === "education" && (
            <List
              items={cv.education}
              onChange={(v) => set("education", v)}
              blank={{ degree: "", field: "", institution: "", location: "", start: "", end: "", details: [] }}
              render={(ed, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="degree" value={ed.degree} onChange={(v) => update({ ...ed, degree: v })} />
                  <Field label="field" value={ed.field} onChange={(v) => update({ ...ed, field: v })} />
                  <Field label="institution" value={ed.institution} onChange={(v) => update({ ...ed, institution: v })} />
                  <Field label="location" value={ed.location} onChange={(v) => update({ ...ed, location: v })} />
                  <Field label="start" value={ed.start} onChange={(v) => update({ ...ed, start: v })} />
                  <Field label="end" value={ed.end} onChange={(v) => update({ ...ed, end: v })} />
                  <div className="sm:col-span-2">
                    <Field label="details (one per line)" multiline value={ed.details.join("\n")} onChange={(v) => update({ ...ed, details: lines(v) })} />
                  </div>
                </div>
              )}
            />
          )}

          {tab === "certifications" && (
            <List
              items={cv.certifications}
              onChange={(v) => set("certifications", v)}
              blank={{ name: "", issuer: "", date: "", credentialId: "" }}
              render={(c, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="name" value={c.name} onChange={(v) => update({ ...c, name: v })} />
                  <Field label="issuer" value={c.issuer} onChange={(v) => update({ ...c, issuer: v })} />
                  <Field label="date" value={c.date} onChange={(v) => update({ ...c, date: v })} />
                  <Field label="credential ID" value={c.credentialId} onChange={(v) => update({ ...c, credentialId: v })} />
                </div>
              )}
            />
          )}

          {tab === "skills" && (
            <List
              items={cv.skills}
              onChange={(v) => set("skills", v)}
              blank={{ category: "", items: [] }}
              render={(s, update) => (
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <Field label="category" value={s.category} onChange={(v) => update({ ...s, category: v })} />
                  <CsvField label="skills (comma separated)" value={s.items} onChange={(v) => update({ ...s, items: v })} />
                </div>
              )}
            />
          )}

          {tab === "languages" && (
            <List
              items={cv.languages}
              onChange={(v) => set("languages", v)}
              blank={{ name: "", level: "" }}
              render={(l, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="language" value={l.name} onChange={(v) => update({ ...l, name: v })} />
                  <Field label="level" value={l.level} onChange={(v) => update({ ...l, level: v })} />
                </div>
              )}
            />
          )}

          {tab === "projects" && (
            <List
              items={cv.projects}
              onChange={(v) => set("projects", v)}
              blank={{ name: "", description: "", link: "" }}
              render={(p, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="name" value={p.name} onChange={(v) => update({ ...p, name: v })} />
                  <Field label="link" value={p.link} onChange={(v) => update({ ...p, link: v })} />
                  <div className="sm:col-span-2">
                    <Field label="description" multiline value={p.description} onChange={(v) => update({ ...p, description: v })} />
                  </div>
                </div>
              )}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          {error && <p className="mr-auto text-sm text-danger">{error}</p>}
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const nice = label.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{nice}</span>
      {multiline ? (
        <textarea rows={5} className="input resize-y" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/** Comma-separated list input that keeps the raw text while typing. */
function CsvField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  return (
    <Field
      label={label}
      value={text}
      onChange={(v) => {
        setText(v);
        onChange(csv(v));
      }}
    />
  );
}

function List<T>({
  items,
  onChange,
  blank,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  render: (item: T, update: (item: T) => void) => React.ReactNode;
}) {
  // Stable keys so inputs with local state follow their item when reordered.
  const [keys, setKeys] = useState(() => items.map(() => crypto.randomUUID()));
  const reorder = <U,>(arr: U[], i: number, d: number) => {
    const copy = [...arr];
    const [it] = copy.splice(i, 1);
    copy.splice(i + d, 0, it);
    return copy;
  };
  const move = (i: number, d: number) => {
    setKeys((k) => reorder(k, i, d));
    onChange(reorder(items, i, d));
  };
  const remove = (i: number) => {
    setKeys((k) => k.filter((_, j) => j !== i));
    onChange(items.filter((_, j) => j !== i));
  };
  const add = () => {
    setKeys((k) => [...k, crypto.randomUUID()]);
    onChange([...items, structuredClone(blank)]);
  };
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={keys[i]} className="rounded-xl border border-line p-4">
          {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
          <div className="mt-3 flex justify-end gap-1 text-xs">
            <button disabled={i === 0} onClick={() => move(i, -1)} className="btn-ghost px-2 py-1">
              ↑
            </button>
            <button disabled={i === items.length - 1} onClick={() => move(i, 1)} className="btn-ghost px-2 py-1">
              ↓
            </button>
            <button onClick={() => remove(i)} className="btn-ghost px-2 py-1 hover:text-danger">
              Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={add} className="btn-secondary w-full">
        + Add
      </button>
    </div>
  );
}
