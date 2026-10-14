# Hireready – AI CV builder

People answer an AI recruiter's questions, upload their diplomas, certificates and photo, pick a design and tap **Generate**. The app writes a tailored, ATS-friendly CV, scores it against the target job and exports a PDF.

## How it works

| Step | What happens | Code |
|---|---|---|
| 1. Target job | Role, CV language, optional job advert | `src/app/cv/[id]/steps/target-step.tsx` |
| 2. AI interview | Claude asks one question at a time (streamed), digging for quantified achievements, and ends the interview itself when it has enough | `src/app/api/cvs/[id]/interview`, `src/lib/ai.ts` |
| 3. Documents & photo | Files go straight to private Supabase Storage; Claude reads each diploma/certificate (image or PDF) into structured facts. Photos are cropped square and EXIF-rotated in the browser | `src/app/api/cvs/[id]/documents`, `steps/documents-step.tsx` |
| 4. Design | 3 templates × 6 accent colours, switchable without regenerating | `src/lib/pdf/templates.tsx` |
| 5. Generate | Claude writes the CV as schema-validated JSON (structured outputs) using only facts from the interview and documents, plus an ATS score, strengths, improvements and missing keywords. Users can edit the text, then download the PDF | `src/app/api/cvs/[id]/generate`, `src/app/api/cvs/[id]/pdf` |

**Plans:** Free = 3 generations/day, PDFs carry a small footer. Pro = one-time Stripe payment for a 30-day pass, no footer, higher limits. Limits live in `src/lib/account.ts`; name and price in `src/lib/brand.ts`.

**Stack:** Next.js 16 (App Router), Tailwind 4, Supabase (Auth, Postgres with RLS, Storage), Claude API (`claude-opus-5-5`), `@react-pdf/renderer`, Stripe Checkout.

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/20261014000000_init.sql` in the SQL editor (or `supabase db push`). It creates the tables, row-level security, the private `cv-files` bucket and its policies.
3. **Authentication → URL configuration:** set the Site URL to your domain and add `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback`) to the redirect URLs.
4. **Authentication → Providers:** email is on by default. To offer "Continue with Google", enable Google and add its OAuth client ID and secret.

### 2. Anthropic
Create an API key at [console.anthropic.com](https://console.anthropic.com).

### 3. Stripe
1. Create a product "Pro pass" with a **one-time** price (e.g. $9.99) and copy the price ID.
2. Add a webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and copy its signing secret.
3. Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### 4. Environment
Copy `.env.example` to `.env.local` and fill in every value.

### 5. Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

### Deploy
Deploy to Vercel (or any Node host), set the same environment variables, and set `NEXT_PUBLIC_SITE_URL` to the production URL. Generation can take about a minute, so the generate route sets `maxDuration = 300`; on Vercel that needs a plan that allows 300-second functions.

## Notes
- **Honesty is enforced in the prompts:** the writer may rephrase but never invent employers, dates, degrees or numbers. Keep it that way. Invented claims get candidates rejected at interview.
- **Template previews** in `public/templates/` come from `npm run render-samples -- <dir>` followed by `pdftoppm -png -r 72 -singlefile <dir>/<id>.pdf public/templates/<id>`.
- **Fonts:** PDFs use the built-in Helvetica and Times, which cover Western European languages. Arabic or other non-Latin CVs need an embedded font (`Font.register`) and RTL layout work.
- AI requests use server-side refusal fallback (`fallbacks: "default"`), so a declined request is retried on Anthropic's recommended fallback model.
