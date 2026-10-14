import { z } from "zod";

// These schemas double as Claude structured-output formats, so every field is
// required (use "" or [] for "none") and there are no recursive types.

export const CvContent = z.object({
  labels: z
    .object({
      profile: z.string(),
      experience: z.string(),
      education: z.string(),
      certifications: z.string(),
      skills: z.string(),
      languages: z.string(),
      projects: z.string(),
      contact: z.string(),
    })
    .describe("Section headings written in the CV's language"),
  basics: z.object({
    fullName: z.string(),
    headline: z.string().describe("Target job title, e.g. 'Senior Data Analyst'"),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    website: z.string(),
    linkedin: z.string(),
    summary: z.string().describe("3-4 sentence professional profile"),
  }),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      location: z.string(),
      start: z.string().describe("e.g. 'Mar 2021'"),
      end: z.string().describe("e.g. 'Jun 2024', or the word for 'Present' in the CV language"),
      bullets: z.array(z.string()).describe("Achievement bullets: action verb + result, quantified where facts allow"),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      field: z.string(),
      institution: z.string(),
      location: z.string(),
      start: z.string(),
      end: z.string(),
      details: z.array(z.string()).describe("Grade, honours, thesis, relevant courses"),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string(),
      credentialId: z.string(),
    }),
  ),
  skills: z.array(z.object({ category: z.string(), items: z.array(z.string()) })),
  languages: z.array(z.object({ name: z.string(), level: z.string() })),
  projects: z.array(z.object({ name: z.string(), description: z.string(), link: z.string() })),
});
export type CvContent = z.infer<typeof CvContent>;

export const AtsReview = z.object({
  score: z.number().describe("Estimated ATS / recruiter match score from 0 to 100"),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()).describe("Concrete things the candidate could add or change"),
  missingKeywords: z.array(z.string()).describe("Keywords from the target role the candidate could not honestly claim yet"),
});
export type AtsReview = z.infer<typeof AtsReview>;

export const GeneratedCv = z.object({ cv: CvContent, ats: AtsReview });
export type GeneratedCv = z.infer<typeof GeneratedCv>;

export const DocumentFacts = z.object({
  docType: z.enum(["diploma", "certificate", "transcript", "recommendation", "other"]),
  legible: z.boolean(),
  title: z.string().describe("Degree or certificate name exactly as written"),
  holderName: z.string(),
  institution: z.string().describe("University, school or issuing organisation"),
  field: z.string(),
  grade: z.string().describe("Grade, GPA, honours or mention, if shown"),
  dateAwarded: z.string(),
  credentialId: z.string(),
  skills: z.array(z.string()).describe("Skills or subjects the document attests to"),
  notes: z.string().describe("Anything else useful for a CV, in one or two sentences"),
});
export type DocumentFacts = z.infer<typeof DocumentFacts>;

export type InterviewMessage = { role: "user" | "assistant"; content: string };

export const TEMPLATES = [
  { id: "classic", name: "Classic", blurb: "Single column. The safest choice for applicant tracking systems." },
  { id: "modern", name: "Modern", blurb: "Colour sidebar with photo. Good for creative and tech roles." },
  { id: "elegant", name: "Elegant", blurb: "Serif headings, centred header. Suits law, finance, academia." },
] as const;
export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const ACCENTS = ["#1f4e79", "#0f766e", "#7c2d12", "#4c1d95", "#111827", "#9f1239"] as const;

export const LANGUAGES = ["English", "French", "Spanish", "German", "Portuguese", "Italian", "Dutch"] as const;
