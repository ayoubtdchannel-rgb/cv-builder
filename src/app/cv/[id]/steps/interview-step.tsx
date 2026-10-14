"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewMessage } from "@/lib/cv-schema";
import type { StepProps } from "../wizard";

const SENTINEL = "\n\u0000";

export function InterviewStep({ cv, setCv, next }: StepProps) {
  const [messages, setMessages] = useState<InterviewMessage[]>(cv.interview);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(cv.interview_done);
  const bottom = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const ask = useCallback(
    async (answer?: string) => {
      setError("");
      setStreaming(true);
      const base = answer ? [...messages, { role: "user" as const, content: answer }] : messages;
      setMessages([...base, { role: "assistant", content: "" }]);

      try {
        const res = await fetch(`/api/cvs/${cv.id}/interview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answer ? { message: answer } : {}),
        });
        if (!res.ok || !res.body) {
          throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { value, done: finished } = await reader.read();
          if (finished) break;
          text += decoder.decode(value, { stream: true });
          const visible = text.split(SENTINEL)[0];
          setMessages([...base, { role: "assistant", content: visible }]);
        }

        const [reply, status] = text.split(SENTINEL);
        if (status === "ERROR") throw new Error("The interviewer had a problem. Please send your answer again.");
        const transcript: InterviewMessage[] = [...base, { role: "assistant", content: reply.trim() }];
        setMessages(transcript);
        const isDone = status === "DONE" || done;
        setDone(isDone);
        setCv((prev) => ({ ...prev, interview: transcript, interview_done: isDone }));
      } catch (err) {
        setError((err as Error).message);
        // Nothing was saved server-side; restore the chat and the unsent answer.
        setMessages(messages);
        if (answer) setDraft(answer);
      } finally {
        setStreaming(false);
      }
    },
    [cv.id, messages, done, setCv],
  );

  // Open the interview with the first question.
  useEffect(() => {
    if (!started.current && messages.length === 0) {
      started.current = true;
      void ask();
    }
  }, [ask, messages.length]);

  function send(e?: React.FormEvent) {
    e?.preventDefault();
    const answer = draft.trim();
    if (!answer || streaming) return;
    setDraft("");
    void ask(answer);
  }

  const answered = messages.filter((m) => m.role === "user").length;

  return (
    <div className="card mx-auto flex h-[calc(100dvh-220px)] min-h-[480px] max-w-3xl flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div>
          <p className="font-semibold">AI interview</p>
          <p className="text-xs text-muted">
            {done ? "Complete – you can still add details" : `${answered} answered · skip any question you like`}
          </p>
        </div>
        <button onClick={next} className={done ? "btn-primary" : "btn-secondary"} disabled={streaming}>
          {done ? "Continue →" : "Skip to documents →"}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-paper text-ink"
              }`}
            >
              {m.content || <TypingDots />}
            </div>
          </div>
        ))}
        {done && !streaming && (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-good">
            ✓ The interviewer has what it needs. Continue to upload your diplomas and photo.
          </div>
        )}
        <div ref={bottom} />
      </div>

      {error && <p className="px-5 pb-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          rows={2}
          className="input flex-1 resize-none"
          placeholder={streaming ? "The interviewer is typing…" : "Type your answer… (Enter to send)"}
          value={draft}
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="btn-primary h-11" disabled={streaming || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Typing">
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}
