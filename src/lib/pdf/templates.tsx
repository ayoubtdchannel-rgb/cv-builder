import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement, ReactNode } from "react";
import type { CvContent, TemplateId } from "@/lib/cv-schema";

// Never split words across lines; hyphenated names and skills look sloppy on a CV.
Font.registerHyphenationCallback((word) => [word]);

export type CvPdfProps = {
  cv: CvContent;
  template: TemplateId;
  accent: string;
  /** Photo as a data URI, or null. */
  photo: string | null;
  watermark: boolean;
};

export function CvPdf(props: CvPdfProps) {
  const Template = { classic: Classic, modern: Modern, elegant: Elegant }[props.template] ?? Classic;
  return (
    <Document title={props.cv.basics.fullName || "CV"} author={props.cv.basics.fullName} creator="CV Builder">
      <Template {...props} />
    </Document>
  );
}

/** Renders a CV to PDF bytes. */
export function renderCvPdf(props: CvPdfProps) {
  // renderToBuffer is typed to take a <Document> element; CvPdf returns one.
  return renderToBuffer((<CvPdf {...props} />) as ReactElement<DocumentProps>);
}

// --- Shared pieces ------------------------------------------------------------

const range = (start: string, end: string) => [start, end].filter(Boolean).join(" – ");
const contactItems = (cv: CvContent) =>
  [cv.basics.email, cv.basics.phone, cv.basics.location, cv.basics.linkedin, cv.basics.website].filter(Boolean);

function Watermark() {
  return (
    <View fixed style={shared.watermark}>
      <Text>Created with CV Builder · Free plan</Text>
    </View>
  );
}

function Bullets({ items, size = 9.5 }: { items: string[]; size?: number }) {
  return (
    <View>
      {items.filter(Boolean).map((item, i) => (
        <View key={i} style={shared.bulletRow} wrap={false}>
          <Text style={{ width: 10, fontSize: size }}>•</Text>
          <Text style={{ flex: 1, fontSize: size, lineHeight: 1.4 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const shared = StyleSheet.create({
  watermark: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  bulletRow: { flexDirection: "row", marginBottom: 2 },
});

/** Experience, education, projects: the main-column sections every template shares. */
function MainSections({
  cv,
  heading,
  accent,
  include = ["experience", "education", "projects"],
}: {
  cv: CvContent;
  heading: (label: string) => ReactNode;
  accent: string;
  include?: ("experience" | "education" | "projects" | "certifications" | "skills" | "languages")[];
}) {
  const muted = "#4b5563";
  const blocks: Record<string, ReactNode> = {
    experience: cv.experience.length > 0 && (
      <View key="experience">
        {heading(cv.labels.experience)}
        {cv.experience.map((job, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <View wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5, flex: 1 }}>{job.role}</Text>
                <Text style={{ fontSize: 9, color: muted }}>{range(job.start, job.end)}</Text>
              </View>
              <Text style={{ fontSize: 9.5, color: accent, marginBottom: 3 }}>
                {[job.company, job.location].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <Bullets items={job.bullets} />
          </View>
        ))}
      </View>
    ),
    education: cv.education.length > 0 && (
      <View key="education">
        {heading(cv.labels.education)}
        {cv.education.map((ed, i) => (
          <View key={i} style={{ marginBottom: 6 }} wrap={false}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5, flex: 1 }}>
                {[ed.degree, ed.field].filter(Boolean).join(", ")}
              </Text>
              <Text style={{ fontSize: 9, color: muted }}>{range(ed.start, ed.end)}</Text>
            </View>
            <Text style={{ fontSize: 9.5, color: accent, marginBottom: 2 }}>
              {[ed.institution, ed.location].filter(Boolean).join(" · ")}
            </Text>
            <Bullets items={ed.details} size={9} />
          </View>
        ))}
      </View>
    ),
    projects: cv.projects.length > 0 && (
      <View key="projects">
        {heading(cv.labels.projects)}
        {cv.projects.map((p, i) => (
          <View key={i} style={{ marginBottom: 5 }} wrap={false}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {p.name}
              {p.link ? <Text style={{ fontFamily: "Helvetica", color: muted, fontSize: 9 }}>{`  ${p.link}`}</Text> : null}
            </Text>
            <Text style={{ fontSize: 9.5, lineHeight: 1.4 }}>{p.description}</Text>
          </View>
        ))}
      </View>
    ),
    certifications: cv.certifications.length > 0 && (
      <View key="certifications">
        {heading(cv.labels.certifications)}
        {cv.certifications.map((c, i) => (
          <View key={i} style={{ marginBottom: 4 }} wrap={false}>
            <Text style={{ fontSize: 9.5 }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{c.name}</Text>
              {[c.issuer, c.date].filter(Boolean).length ? ` — ${[c.issuer, c.date].filter(Boolean).join(", ")}` : ""}
            </Text>
            {c.credentialId ? <Text style={{ fontSize: 8.5, color: muted }}>ID: {c.credentialId}</Text> : null}
          </View>
        ))}
      </View>
    ),
    skills: cv.skills.length > 0 && (
      <View key="skills">
        {heading(cv.labels.skills)}
        {cv.skills.map((s, i) => (
          <Text key={i} style={{ fontSize: 9.5, marginBottom: 3, lineHeight: 1.4 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{s.category}: </Text>
            {s.items.join(", ")}
          </Text>
        ))}
      </View>
    ),
    languages: cv.languages.length > 0 && (
      <View key="languages">
        {heading(cv.labels.languages)}
        <Text style={{ fontSize: 9.5 }}>
          {cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" · ")}
        </Text>
      </View>
    ),
  };
  return <>{include.map((k) => blocks[k])}</>;
}

// --- Classic: single column, the most ATS-friendly ---------------------------

function Classic({ cv, accent, photo, watermark }: CvPdfProps) {
  const heading = (label: string) => (
    <View style={{ marginTop: 10, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: accent, paddingBottom: 2 }} minPresenceAhead={40}>
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, color: accent, textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
    </View>
  );
  return (
    <Page size="A4" style={{ padding: 40, paddingBottom: 44, fontFamily: "Helvetica", color: "#111827" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 22 }}>{cv.basics.fullName}</Text>
          <Text style={{ fontSize: 12, color: accent, marginTop: 2 }}>{cv.basics.headline}</Text>
          <Text style={{ fontSize: 9, color: "#4b5563", marginTop: 6 }}>{contactItems(cv).join("  |  ")}</Text>
        </View>
        {photo ? <Image src={photo} style={{ width: 70, height: 70, borderRadius: 35, objectFit: "cover" }} /> : null}
      </View>
      {cv.basics.summary ? (
        <View>
          {heading(cv.labels.profile)}
          <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{cv.basics.summary}</Text>
        </View>
      ) : null}
      <MainSections
        cv={cv}
        heading={heading}
        accent={accent}
        include={["experience", "education", "certifications", "skills", "projects", "languages"]}
      />
      {watermark ? <Watermark /> : null}
    </Page>
  );
}

// --- Modern: colour sidebar with photo ---------------------------------------

function Modern({ cv, accent, photo, watermark }: CvPdfProps) {
  const SIDEBAR = 170;
  const sideHeading = (label: string) => (
    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 5, color: "#ffffff" }}>
      {label}
    </Text>
  );
  const mainHeading = (label: string) => (
    <View minPresenceAhead={40} style={{ marginTop: 12, marginBottom: 5, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 14, height: 3, backgroundColor: accent, marginRight: 6 }} />
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11.5, color: "#111827", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
  const sideText = { fontSize: 9, color: "#f3f4f6", marginBottom: 3, lineHeight: 1.35 };

  return (
    <Page size="A4" style={{ fontFamily: "Helvetica", color: "#111827", paddingBottom: 30 }}>
      {/* Sidebar background repeated on every page */}
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: SIDEBAR, backgroundColor: accent }} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: SIDEBAR, padding: 18, paddingTop: 30 }}>
          {photo ? (
            <Image src={photo} style={{ width: 104, height: 104, borderRadius: 52, objectFit: "cover", alignSelf: "center", marginBottom: 6, borderWidth: 3, borderColor: "#ffffff" }} />
          ) : null}
          {sideHeading(cv.labels.contact)}
          {contactItems(cv).map((c, i) => (
            <Text key={i} style={sideText}>{c}</Text>
          ))}
          {cv.skills.length > 0 && sideHeading(cv.labels.skills)}
          {cv.skills.map((s, i) => (
            <View key={i} style={{ marginBottom: 5 }}>
              <Text style={{ ...sideText, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{s.category}</Text>
              <Text style={sideText}>{s.items.join(", ")}</Text>
            </View>
          ))}
          {cv.languages.length > 0 && sideHeading(cv.labels.languages)}
          {cv.languages.map((l, i) => (
            <Text key={i} style={sideText}>{l.level ? `${l.name} — ${l.level}` : l.name}</Text>
          ))}
          {cv.certifications.length > 0 && sideHeading(cv.labels.certifications)}
          {cv.certifications.map((c, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Text style={{ ...sideText, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 0 }}>{c.name}</Text>
              <Text style={sideText}>{[c.issuer, c.date].filter(Boolean).join(", ")}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1, padding: 28, paddingTop: 30 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 24 }}>{cv.basics.fullName}</Text>
          <Text style={{ fontSize: 12.5, color: accent, marginTop: 3 }}>{cv.basics.headline}</Text>
          {cv.basics.summary ? (
            <View>
              {mainHeading(cv.labels.profile)}
              <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{cv.basics.summary}</Text>
            </View>
          ) : null}
          <MainSections cv={cv} heading={mainHeading} accent={accent} />
        </View>
      </View>
      {watermark ? <Watermark /> : null}
    </Page>
  );
}

// --- Elegant: centred header, serif headings ---------------------------------

function Elegant({ cv, accent, photo, watermark }: CvPdfProps) {
  const heading = (label: string) => (
    <View minPresenceAhead={40} style={{ marginTop: 12, marginBottom: 6, alignItems: "center" }}>
      <Text style={{ fontFamily: "Times-Bold", fontSize: 12.5, color: accent, letterSpacing: 2, textTransform: "uppercase" }}>{label}</Text>
      <View style={{ width: 40, height: 1, backgroundColor: accent, marginTop: 3 }} />
    </View>
  );
  return (
    <Page size="A4" style={{ padding: 44, paddingBottom: 46, fontFamily: "Helvetica", color: "#1f2937" }}>
      <View style={{ alignItems: "center" }}>
        {photo ? <Image src={photo} style={{ width: 72, height: 72, borderRadius: 36, objectFit: "cover", marginBottom: 8 }} /> : null}
        <Text style={{ fontFamily: "Times-Bold", fontSize: 26, letterSpacing: 1 }}>{cv.basics.fullName}</Text>
        <Text style={{ fontFamily: "Times-Italic", fontSize: 13, color: accent, marginTop: 3 }}>{cv.basics.headline}</Text>
        <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 7 }}>{contactItems(cv).join("   ·   ")}</Text>
        <View style={{ height: 1, backgroundColor: "#d1d5db", alignSelf: "stretch", marginTop: 10 }} />
      </View>
      {cv.basics.summary ? (
        <View>
          {heading(cv.labels.profile)}
          <Text style={{ fontSize: 9.8, lineHeight: 1.55, textAlign: "center" }}>{cv.basics.summary}</Text>
        </View>
      ) : null}
      <MainSections
        cv={cv}
        heading={heading}
        accent={accent}
        include={["experience", "education", "certifications", "skills", "projects", "languages"]}
      />
      {watermark ? <Watermark /> : null}
    </Page>
  );
}
