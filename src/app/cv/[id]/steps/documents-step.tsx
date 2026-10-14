"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { DocRecord, StepProps } from "../wizard";

const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

const safeName = (name: string) => name.replace(/[^\w.-]+/g, "_").slice(-80);

/**
 * Crops the photo to a centred square JPEG. Drawing through a canvas also
 * applies the phone's EXIF rotation, which the PDF renderer would ignore.
 */
async function squarePhoto(file: File, size = 600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process the image."))), "image/jpeg", 0.9),
  );
}

export function DocumentsStep({
  cv,
  save,
  next,
  back,
  userId,
  docs,
  setDocs,
}: StepProps & { userId: string; docs: DocRecord[]; setDocs: React.Dispatch<React.SetStateAction<DocRecord[]>> }) {
  const supabase = createSupabaseBrowser();
  const [reading, setReading] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (!cv.photo_path) return setPhotoUrl(null);
    let active = true;
    supabase.storage
      .from("cv-files")
      .createSignedUrl(cv.photo_path, 3600)
      .then(({ data }) => active && setPhotoUrl(data?.signedUrl ?? null));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv.photo_path]);

  async function uploadDocs(files: FileList | null) {
    setError("");
    for (const file of Array.from(files ?? [])) {
      if (!DOC_TYPES.includes(file.type)) {
        setError(`${file.name}: please upload a PDF, JPG, PNG or WebP file.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: files must be under 10 MB.`);
        continue;
      }
      setReading((r) => [...r, file.name]);
      try {
        const path = `${userId}/${cv.id}/doc-${Date.now()}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("cv-files").upload(path, file, { contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        const res = await fetch(`/api/cvs/${cv.id}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storagePath: path, fileName: file.name, mimeType: file.type }),
        });
        const json = await res.json();
        if (!res.ok) {
          await supabase.storage.from("cv-files").remove([path]);
          throw new Error(json.error ?? "Upload failed.");
        }
        setDocs((d) => [...d, json.document]);
      } catch (err) {
        setError(`${file.name}: ${(err as Error).message}`);
      } finally {
        setReading((r) => r.filter((n) => n !== file.name));
      }
    }
  }

  async function removeDoc(id: string) {
    setDocs((d) => d.filter((x) => x.id !== id));
    await fetch(`/api/cvs/${cv.id}/documents/${id}`, { method: "DELETE" });
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!PHOTO_TYPES.includes(file.type)) return setError("Photo: please use a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return setError("Photo: must be under 10 MB.");
    setPhotoBusy(true);
    try {
      const path = `${userId}/${cv.id}/photo-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("cv-files")
        .upload(path, await squarePhoto(file), { contentType: "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      const old = cv.photo_path;
      await save({ photo_path: path });
      if (old) await supabase.storage.from("cv-files").remove([old]);
    } catch (err) {
      setError(`Photo: ${(err as Error).message}`);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    const old = cv.photo_path;
    await save({ photo_path: null });
    if (old) await supabase.storage.from("cv-files").remove([old]);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_300px]">
      <section className="card p-6 sm:p-8">
        <h1 className="font-serif text-2xl font-semibold">Diplomas & certificates</h1>
        <p className="mt-1 text-sm text-muted">
          Upload photos or PDFs. The AI reads the exact degree names, grades and dates so nothing is mistyped.
        </p>

        <label className="mt-6 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line px-6 py-10 text-center transition hover:border-brand hover:bg-brand-soft/40">
          <span className="text-3xl">⬆</span>
          <span className="mt-2 text-sm font-semibold">Click to upload files</span>
          <span className="text-xs text-muted">PDF, JPG, PNG or WebP · up to 10 MB each</span>
          <input
            type="file"
            multiple
            accept={DOC_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => {
              void uploadDocs(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <ul className="mt-6 space-y-3">
          {reading.map((name) => (
            <li key={name} className="flex items-center gap-3 rounded-xl border border-line p-4 text-sm">
              <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <span className="flex-1 truncate">{name}</span>
              <span className="text-muted">Reading…</span>
            </li>
          ))}
          {docs.map((doc) => {
            const f = doc.extracted;
            return (
              <li key={doc.id} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
                  {doc.mime_type === "application/pdf" ? "PDF" : "IMG"}
                </span>
                <div className="min-w-0 flex-1">
                  {f && f.legible ? (
                    <>
                      <p className="font-semibold">{f.title || doc.file_name}</p>
                      <p className="text-muted">
                        {[f.institution, f.field, f.grade, f.dateAwarded].filter(Boolean).join(" · ")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="truncate font-semibold">{doc.file_name}</p>
                      <p className="text-warn">
                        Couldn&apos;t read this clearly. Try a sharper photo, or mention it in the interview.
                      </p>
                    </>
                  )}
                </div>
                <button onClick={() => removeDoc(doc.id)} className="text-xs text-muted hover:text-red-600">
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="card h-fit p-6">
        <h2 className="font-semibold">Profile photo</h2>
        <p className="mt-1 text-xs text-muted">
          Optional. Expected in much of Europe, Africa and the Middle East; usually left off in the US and UK.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="grid size-32 place-items-center overflow-hidden rounded-full bg-paper text-4xl text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photoUrl ? <img src={photoUrl} alt="Your photo" className="size-full object-cover" /> : "👤"}
          </div>
          <label className="btn-secondary cursor-pointer">
            {photoBusy ? "Uploading…" : cv.photo_path ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept={PHOTO_TYPES.join(",")}
              className="sr-only"
              disabled={photoBusy}
              onChange={(e) => {
                void uploadPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {cv.photo_path && (
            <button onClick={removePhoto} className="text-xs text-muted hover:text-red-600">
              Remove photo
            </button>
          )}
        </div>
      </aside>

      <div className="flex justify-between lg:col-span-2">
        <button onClick={back} className="btn-ghost">
          ← Back
        </button>
        <button onClick={next} className="btn-primary" disabled={reading.length > 0}>
          Choose a design →
        </button>
      </div>
    </div>
  );
}
