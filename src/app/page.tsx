import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { APP_NAME, PRO_PRICE } from "@/lib/brand";
import { TEMPLATES } from "@/lib/cv-schema";

const STEPS = [
  { title: "Tell us the job", body: "Enter the role you want and paste the job advert. Everything is tailored to it." },
  { title: "Chat with the AI", body: "A recruiter-style interview pulls out your achievements, one short question at a time." },
  { title: "Upload your proof", body: "Snap your diplomas and certificates. The AI reads exact titles, grades and dates." },
  { title: "Pick a design, tap generate", body: "Get a polished PDF in about a minute, with an ATS score and tips to improve it." },
];

const WHY = [
  {
    title: "Built to pass ATS screening",
    body: "Most large employers filter CVs with software before a person reads them. Clean layouts, standard headings and the job's own keywords help yours get through.",
  },
  {
    title: "Achievements, not duties",
    body: "The interviewer asks for numbers and results, then writes action-verb bullets recruiters can scan in seconds.",
  },
  {
    title: "Nothing made up",
    body: "The AI only uses what you tell it and what's on your documents. Every claim on your CV is one you can back up in an interview.",
  },
  {
    title: "Your language, your market",
    body: "Write in English, French, Spanish, German and more, with or without a photo depending on local norms.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="glass inline-flex rounded-full px-3 py-1 text-xs font-semibold text-indigo-200">
                AI CV builder
              </p>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                A professional CV that gets you interviews.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted">
                Answer the AI&apos;s questions, upload your diplomas and photo, choose a design and tap generate.
                {` ${APP_NAME}`} writes a tailored, recruiter-ready CV in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="btn-primary px-6 py-3 text-base">
                  Create my CV free
                </Link>
                <a href="#how" className="btn-secondary px-6 py-3 text-base">
                  How it works
                </a>
              </div>
              <p className="mt-4 text-xs text-muted">No credit card needed. Free plan includes 3 generations a day.</p>
            </div>
            <div className="relative mx-auto h-[420px] w-full max-w-md sm:h-[520px]">
              {TEMPLATES.map((t, i) => (
                <div
                  key={t.id}
                  className="absolute w-[62%] overflow-hidden rounded-lg border border-white/30 bg-white shadow-2xl shadow-black/50"
                  style={{ left: `${i * 19}%`, top: `${i * 9}%`, transform: `rotate(${(i - 1) * 4}deg)`, zIndex: i }}
                >
                  <Image src={`/templates/${t.id}.png`} alt={`${t.name} CV design`} width={595} height={842} priority={i === 2} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-center font-serif text-3xl font-semibold">How it works</h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-6">
                <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-sm font-bold text-white shadow-lg shadow-brand/40">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center font-serif text-3xl font-semibold">Why it works</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {WHY.map((w) => (
                <div key={w.title} className="card p-6">
                  <h3 className="font-semibold">{w.title}</h3>
                  <p className="mt-2 text-sm text-muted">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center font-serif text-3xl font-semibold">Designs recruiters like</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <figure key={t.id}>
                <div className="overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
                  <Image src={`/templates/${t.id}.png`} alt={`${t.name} CV design`} width={595} height={842} />
                </div>
                <figcaption className="mt-3">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted">{t.blurb}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="card mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
            <h2 className="font-serif text-3xl font-semibold">Your next interview starts with a better CV.</h2>
            <p className="mt-3 text-muted">Start free. Go Pro for {PRO_PRICE} when you&apos;re ready to apply.</p>
            <Link href="/login" className="btn-primary mt-8 px-6 py-3 text-base">
              Create my CV
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </>
  );
}
