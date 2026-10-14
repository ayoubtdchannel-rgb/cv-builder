import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  DocumentFacts,
  GeneratedCv,
  type InterviewMessage,
} from "@/lib/cv-schema";

const MODEL = "claude-opus-5-5";

// Server-side refusal fallback: if Claude declines, the API re-runs the request
// on Anthropic's recommended fallback model instead of returning a refusal.
const FALLBACK: { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: "default" } = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

const client = new Anthropic();

export class AiRefusalError extends Error {}

export type Usage = { input_tokens: number; output_tokens: number };

// --- Interview --------------------------------------------------------------

const FINISH_TOOL: Anthropic.Beta.BetaTool = {
  name: "finish_interview",
  description:
    "Call this once you have enough information to write a strong CV for the target role, or when the candidate asks to stop. Before calling it, tell the candidate in one or two sentences that you have what you need and that they can upload documents next.",
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    properties: {
      coverage: {
        type: "string",
        description: "One line noting which CV sections are well covered and which are thin.",
      },
    },
    required: ["coverage"],
    additionalProperties: false,
  },
};

function interviewSystem(target: { role: string; jobDescription: string; language: string }) {
  return `You are a senior recruiter and professional CV writer interviewing a candidate so you can write a CV that gets interviews.

Target role: ${target.role || "not given yet - ask for it first"}
${target.jobDescription ? `Job advert the candidate is applying to:\n<job_advert>\n${target.jobDescription}\n</job_advert>\n` : ""}
Conduct the whole interview in ${target.language}.

How to interview:
- Ask ONE short question per message. Be warm and brief; no long preambles.
- Cover, in roughly this order: full name and contact details (email, phone, city, LinkedIn or website), each job (title, company, dates, what they did), education, skills and tools, certifications, languages with level, notable projects.
- For every job, dig for achievements with numbers: team size, budget, revenue, time saved, users, rankings. Offer an example of a good answer when the candidate is vague.
- If there is a job advert, ask about the requirements it lists that the candidate has not mentioned yet.
- Tell the candidate they can skip anything, and that diplomas and certificates can be uploaded in the next step instead of typed.
- Never invent facts or put words in the candidate's mouth.
- Stop after about 12-20 questions, or sooner if the candidate wants to, by calling finish_interview.`;
}

/**
 * Streams the interviewer's next message as text. Resolves `done` with whether
 * the interviewer decided the interview is complete, plus token usage.
 */
export function streamInterviewTurn(
  history: InterviewMessage[],
  target: { role: string; jobDescription: string; language: string },
) {
  // The stored chat opens with the interviewer's question, but the API needs a
  // user turn first, so every request starts with the same opening line.
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: "Hi, I'd like to build my CV." },
    ...history.filter((m) => m.content.trim()).map((m) => ({ role: m.role, content: m.content })),
  ];

  const stream = client.beta.messages.stream({
    ...FALLBACK,
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" },
    system: interviewSystem(target),
    tools: [FINISH_TOOL],
    messages,
  });

  const done = stream.finalMessage().then((message) => {
    if (message.stop_reason === "refusal") throw new AiRefusalError("refused");
    const finished = message.content.some(
      (b) => b.type === "tool_use" && b.name === FINISH_TOOL.name,
    );
    return { finished, usage: message.usage as Usage };
  });

  return { stream, done };
}

// --- Documents --------------------------------------------------------------

export const READABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
type ReadableType = (typeof READABLE_TYPES)[number];

export async function readDocument(file: { bytes: Buffer; mimeType: ReadableType; fileName: string }) {
  const data = file.bytes.toString("base64");
  const source: Anthropic.Beta.BetaContentBlockParam =
    file.mimeType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: file.mimeType, data } };

  const response = await client.beta.messages.parse({
    ...FALLBACK,
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "medium", format: betaZodOutputFormat(DocumentFacts) },
    messages: [
      {
        role: "user",
        content: [
          source,
          {
            type: "text",
            text: `This file ("${file.fileName}") was uploaded by a job seeker as proof of a qualification. Read it and extract the facts a CV writer needs. Copy names, titles, grades and dates exactly as written (translate nothing). Use "" for anything not shown. Set legible to false if you cannot read it reliably.`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new AiRefusalError("could not read document");
  }
  return { facts: response.parsed_output, usage: response.usage as Usage };
}

// --- CV generation ----------------------------------------------------------

const WRITER_SYSTEM = `You are an expert CV writer and former recruiter. You write CVs that pass applicant tracking systems (ATS) and convince human recruiters in under ten seconds.

Rules:
- Use ONLY facts the candidate gave in the interview or that appear in their documents. Never invent employers, titles, dates, degrees, grades, certifications or numbers. You may rephrase, reorder, group and condense.
- Reverse-chronological order for experience and education.
- Every experience bullet starts with a strong action verb and states an outcome; use numbers only when the candidate provided them. 3-5 bullets for recent roles, 1-3 for older ones.
- Mirror the wording of the target role and job advert where it is truthful, so ATS keyword matching works.
- The summary is 3-4 sentences: who they are, years and domain of experience, two standout achievements, what they bring to the target role.
- Group skills into 2-4 categories. Keep it to what fits on 1-2 pages.
- Write everything, including section labels, in the requested CV language.
- Use "" or [] for anything unknown. Leave a section empty rather than padding it.
- Then review the CV as an ATS would against the target role: score 0-100, strengths, concrete improvements, and keywords the candidate could not honestly claim yet.`;

export async function generateCv(input: {
  role: string;
  jobDescription: string;
  language: string;
  interview: InterviewMessage[];
  documents: { fileName: string; facts: unknown }[];
  account: { email: string; fullName: string };
}) {
  const transcript = input.interview
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const prompt = `CV language: ${input.language}
Target role: ${input.role || "(not specified - infer from the interview)"}
${input.jobDescription ? `<job_advert>\n${input.jobDescription}\n</job_advert>\n` : ""}
Account details (use if the interview did not give them): name "${input.account.fullName}", email "${input.account.email}"

<interview>
${transcript || "(no interview - rely on the documents)"}
</interview>

<documents>
${input.documents.length ? JSON.stringify(input.documents, null, 2) : "(none uploaded)"}
</documents>

Write the CV and the ATS review.`;

  const response = await client.beta.messages.parse({
    ...FALLBACK,
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "high", format: betaZodOutputFormat(GeneratedCv) },
    system: WRITER_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new AiRefusalError("could not generate CV");
  }
  return { result: response.parsed_output, usage: response.usage as Usage };
}
