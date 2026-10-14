"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewCvButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/cvs", { method: "POST" });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/cv/${id}`);
    } else {
      setBusy(false);
      alert("Couldn't create a CV. Please try again.");
    }
  }

  return (
    <button onClick={create} disabled={busy} className="btn-primary">
      {busy ? "Creating…" : "+ New CV"}
    </button>
  );
}

export function DeleteCvButton({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    if (!confirm("Delete this CV and its uploaded files? This can't be undone.")) return;
    await fetch(`/api/cvs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={remove} className="rounded p-1 hover:bg-red-50 hover:text-red-600" aria-label="Delete CV">
      <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
        <path d="M8 2a1 1 0 0 0-1 1v1H4a1 1 0 0 0 0 2h.1l.8 10.1A2 2 0 0 0 6.9 18h6.2a2 2 0 0 0 2-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Zm1 2h2v0H9Z" />
      </svg>
    </button>
  );
}
