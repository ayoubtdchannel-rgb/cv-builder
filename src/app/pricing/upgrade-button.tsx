"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) {
      window.location.href = json.url;
    } else {
      setError(json.error ?? "Couldn't start checkout.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <button onClick={checkout} disabled={busy} className="btn-primary w-full">
        {busy ? "Opening checkout…" : "Upgrade to Pro"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
