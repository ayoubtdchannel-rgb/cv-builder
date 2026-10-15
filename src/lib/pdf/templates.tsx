import { Document, Page, Text, View, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { Children, type ReactElement, type ReactNode } from "react";
import type { CvContent, TemplateId } from "@/lib/cv-schema";
import {
  Bullets,
  Chips,
  Dots,
  GRAY,
  INK,
  Icon,
  LIGHT,
  Monogram,
  Photo,
  Watermark,
  contacts,
  dashMarker,
  dotMarker,
  hasAny,
  languageLevel,
  range,
  shade,
  splitName,
  squareMarker,
  tint,
} from "./kit";

export type CvPdfProps = {
  cv: CvContent;
  template: TemplateId;
  accent: string;
  /** Photo as a data URI, or null. */
  photo: string | null;
  watermark: boolean;
};

export function CvPdf(props: CvPdfProps) {
  const Template = { classic: Classic, modern: Modern, elegant: Elegant, executive: Executive, bold: Bold }[props.template] ?? Classic;
  return (
    <Document title={props.cv.basics.fullName || "CV"} author={props.cv.basics.fullName} creator="Hireready">
      <Template {...props} />
    </Document>
  );
}

/** Renders a CV to PDF bytes. */
export function renderCvPdf(props: CvPdfProps) {
  // renderToBuffer is typed to take a <Document> element; CvPdf returns one.
  return renderToBuffer((<CvPdf {...props} />) as ReactElement<DocumentProps>);
}

/** A section heading that never sits alone at the bottom of a page. */
function Section({ heading, children, gap = 12 }: { heading: ReactNode; children: ReactNode; gap?: number }) {
  // Keep the heading on the same page as the section's first entry.
  const [first, ...rest] = Children.toArray(children);
  return (
    <View style={{ marginTop: gap }}>
      <View wrap={false}>
        {heading}
        {first}
      </View>
      {rest}
    </View>
  );
}

// =============================================================================
// Classic – single column, Source Sans. The safest choice for ATS parsing.
// =============================================================================

function Classic({ cv, accent, photo, watermark }: CvPdfProps) {
  const F = "SourceSans";
  const heading = (label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
      <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 10.5, color: accent, letterSpacing: 1.8, textTransform: "uppercase" }}>{label}</Text>
      <View style={{ flex: 1, height: 0.8, backgroundColor: "#d1d5db", marginLeft: 8 }} />
    </View>
  );
  const body = { fontFamily: F, fontSize: 10, color: "#1f2937", lineHeight: 1.45 };

  return (
    <Page size="A4" style={{ paddingTop: 40, paddingBottom: 44, paddingHorizontal: 46, fontFamily: F, color: INK }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 28, letterSpacing: -0.3, color: INK }}>{cv.basics.fullName}</Text>
          <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: accent, marginTop: 2 }}>{cv.basics.headline}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            {contacts(cv).map((c, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 13, marginBottom: 3 }}>
                <Icon name={c.icon} size={8.5} color={accent} />
                <Text style={{ fontFamily: F, fontSize: 9.3, color: GRAY, marginLeft: 4 }}>{c.text}</Text>
              </View>
            ))}
          </View>
        </View>
        {photo ? <Photo src={photo} size={78} border={2} borderColor={tint(accent, 0.6)} /> : null}
      </View>
      <View style={{ height: 2.5, backgroundColor: accent, marginTop: 12, marginBottom: 2 }} />

      {cv.basics.summary ? (
        <Section heading={heading(cv.labels.profile)}>
          <Text style={body}>{cv.basics.summary}</Text>
        </Section>
      ) : null}

      {hasAny(cv, "experience") && (
        <Section heading={heading(cv.labels.experience)}>
          {cv.experience.map((job, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <View wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 11.2, flex: 1 }}>{job.role}</Text>
                  <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 9.2, color: LIGHT }}>{range(job.start, job.end)}</Text>
                </View>
                <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 10, color: accent }}>
                  {job.company}
                  {job.location ? <Text style={{ fontWeight: 400, color: LIGHT }}>{`  ·  ${job.location}`}</Text> : null}
                </Text>
              </View>
              <Bullets items={job.bullets} font={F} size={9.9} marker={squareMarker(accent, 3)} />
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "education") && (
        <Section heading={heading(cv.labels.education)}>
          {cv.education.map((ed, i) => (
            <View key={i} style={{ marginBottom: 6 }} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 11, flex: 1 }}>{[ed.degree, ed.field].filter(Boolean).join(", ")}</Text>
                <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 9.2, color: LIGHT }}>{range(ed.start, ed.end)}</Text>
              </View>
              <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 10, color: accent }}>
                {ed.institution}
                {ed.location ? <Text style={{ fontWeight: 400, color: LIGHT }}>{`  ·  ${ed.location}`}</Text> : null}
              </Text>
              <Bullets items={ed.details} font={F} size={9.5} marker={squareMarker(accent, 2.6)} />
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "skills") && (
        <Section heading={heading(cv.labels.skills)}>
          {cv.skills.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 3 }} wrap={false}>
              <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 9.8, width: 118 }}>{s.category}</Text>
              <Text style={{ ...body, flex: 1 }}>{s.items.join("  ·  ")}</Text>
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "certifications") && (
        <Section heading={heading(cv.labels.certifications)}>
          {cv.certifications.map((c, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }} wrap={false}>
              <Text style={{ fontFamily: F, fontSize: 10, flex: 1 }}>
                <Text style={{ fontWeight: 700 }}>{c.name}</Text>
                {c.issuer ? <Text style={{ color: GRAY }}>{`  ·  ${c.issuer}`}</Text> : null}
              </Text>
              <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 9.2, color: LIGHT }}>{c.date}</Text>
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "projects") && (
        <Section heading={heading(cv.labels.projects)}>
          {cv.projects.map((p, i) => (
            <View key={i} style={{ marginBottom: 5 }} wrap={false}>
              <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 10.5 }}>
                {p.name}
                {p.link ? <Text style={{ fontWeight: 400, color: accent, fontSize: 9.2 }}>{`   ${p.link}`}</Text> : null}
              </Text>
              <Text style={body}>{p.description}</Text>
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "languages") && (
        <Section heading={heading(cv.labels.languages)}>
          <Text style={body}>
            {cv.languages.map((l, i) => (
              <Text key={i}>
                {i > 0 ? "     " : ""}
                <Text style={{ fontWeight: 700 }}>{l.name}</Text>
                {l.level ? ` – ${l.level}` : ""}
              </Text>
            ))}
          </Text>
        </Section>
      )}
      {watermark ? <Watermark /> : null}
    </Page>
  );
}

// =============================================================================
// Modern – colour sidebar, skill chips, language dots, timeline. Inter.
// =============================================================================

function Modern({ cv, accent, photo, watermark }: CvPdfProps) {
  const F = "Inter";
  const SIDEBAR = 186;
  const side = shade(accent, 0.12);
  const sideHeading = (label: string) => (
    <View style={{ marginTop: 18, marginBottom: 8 }}>
      <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 8.6, color: "#ffffff", letterSpacing: 1.8, textTransform: "uppercase" }}>{label}</Text>
      <View style={{ height: 1, backgroundColor: tint(side, 0.3), marginTop: 4 }} />
    </View>
  );
  const heading = (label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: tint(accent, 0.88), alignItems: "center", justifyContent: "center", marginRight: 7 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
      </View>
      <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 11.5, color: INK, letterSpacing: 0.4 }}>{label}</Text>
      <View style={{ flex: 1, height: 0.8, backgroundColor: tint(accent, 0.8), marginLeft: 8 }} />
    </View>
  );
  const sideText = { fontFamily: F, fontSize: 8.6, color: tint(side, 0.82), lineHeight: 1.4 };
  const timelineLine = tint(accent, 0.75);

  // Each entry draws its own segment of the rail, so entries can flow across pages
  // and Section can keep its heading with the first one.
  const timeline = (items: { title: string; sub: string; date: string; bullets: string[] }[]) =>
    items.map((it, i) => (
      <View key={i} style={{ marginLeft: 4, paddingLeft: 14, paddingBottom: 9, borderLeftWidth: 1.2, borderLeftColor: timelineLine }}>
        <View wrap={false}>
          <View style={{ position: "absolute", left: -19.2, top: 2.5, width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#ffffff", borderWidth: 2, borderColor: accent }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 10.5, color: INK, flex: 1, paddingRight: 6 }}>{it.title}</Text>
            {it.date ? (
              <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 7.8, color: shade(accent, 0.1), backgroundColor: tint(accent, 0.88), borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 }}>{it.date}</Text>
            ) : null}
          </View>
          <Text style={{ fontFamily: F, fontWeight: 500, fontSize: 9.2, color: accent, marginTop: 1 }}>{it.sub}</Text>
        </View>
        <Bullets items={it.bullets} font={F} size={9} color="#374151" marker={dotMarker(accent, 3)} />
      </View>
    ));

  return (
    <Page size="A4" style={{ fontFamily: F, color: INK, paddingBottom: 30 }}>
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: SIDEBAR, backgroundColor: side }} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: SIDEBAR, paddingHorizontal: 18, paddingTop: 30 }}>
          <View style={{ alignItems: "center", marginBottom: 2 }}>
            {photo ? (
              <Photo src={photo} size={112} border={3} borderColor={tint(side, 0.35)} />
            ) : (
              <Monogram name={cv.basics.fullName} size={96} bg={tint(side, 0.14)} color="#ffffff" borderColor={tint(side, 0.4)} />
            )}
          </View>

          {sideHeading(cv.labels.contact)}
          {contacts(cv).map((c, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
              <View style={{ width: 17, height: 17, borderRadius: 8.5, backgroundColor: tint(side, 0.14), alignItems: "center", justifyContent: "center", marginRight: 7 }}>
                <Icon name={c.icon} size={8.5} color="#ffffff" />
              </View>
              <Text style={{ ...sideText, flex: 1, paddingTop: 3 }}>{c.text}</Text>
            </View>
          ))}

          {hasAny(cv, "skills") && sideHeading(cv.labels.skills)}
          {cv.skills.map((s, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 8.4, color: "#ffffff", marginBottom: 4 }}>{s.category}</Text>
              <Chips items={s.items} bg={tint(side, 0.16)} color="#ffffff" size={7.8} />
            </View>
          ))}

          {hasAny(cv, "languages") && sideHeading(cv.labels.languages)}
          {cv.languages.map((l, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 8.8, color: "#ffffff" }}>{l.name}</Text>
                <Dots value={languageLevel(l.level)} on="#ffffff" off={tint(side, 0.25)} size={5} />
              </View>
              {l.level ? <Text style={{ ...sideText, fontSize: 7.8 }}>{l.level}</Text> : null}
            </View>
          ))}

          {hasAny(cv, "certifications") && sideHeading(cv.labels.certifications)}
          {cv.certifications.map((c, i) => (
            <View key={i} style={{ marginBottom: 6 }} wrap={false}>
              <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 8.6, color: "#ffffff", lineHeight: 1.35 }}>{c.name}</Text>
              <Text style={{ ...sideText, fontSize: 7.9 }}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 34 }}>
          <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 27, letterSpacing: -0.6, color: INK, lineHeight: 1.1 }}>{cv.basics.fullName}</Text>
          <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 10.5, color: accent, letterSpacing: 2.2, textTransform: "uppercase", marginTop: 6 }}>{cv.basics.headline}</Text>
          <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: accent, marginTop: 12 }} />

          {cv.basics.summary ? (
            <Section heading={heading(cv.labels.profile)} gap={16}>
              <Text style={{ fontFamily: F, fontSize: 9.4, lineHeight: 1.55, color: "#374151" }}>{cv.basics.summary}</Text>
            </Section>
          ) : null}

          {hasAny(cv, "experience") && (
            <Section heading={heading(cv.labels.experience)} gap={14}>
              {timeline(
                cv.experience.map((j) => ({
                  title: j.role,
                  sub: [j.company, j.location].filter(Boolean).join("  ·  "),
                  date: range(j.start, j.end),
                  bullets: j.bullets,
                })),
              )}
            </Section>
          )}

          {hasAny(cv, "education") && (
            <Section heading={heading(cv.labels.education)} gap={8}>
              {timeline(
                cv.education.map((e) => ({
                  title: [e.degree, e.field].filter(Boolean).join(", "),
                  sub: [e.institution, e.location].filter(Boolean).join("  ·  "),
                  date: range(e.start, e.end),
                  bullets: e.details,
                })),
              )}
            </Section>
          )}

          {hasAny(cv, "projects") && (
            <Section heading={heading(cv.labels.projects)} gap={8}>
              {cv.projects.map((p, i) => (
                <View key={i} style={{ marginBottom: 6, padding: 8, borderRadius: 6, backgroundColor: tint(accent, 0.94) }} wrap={false}>
                  <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 9.8 }}>{p.name}</Text>
                  {p.link ? <Text style={{ fontFamily: F, fontSize: 8, color: accent, marginTop: 1 }}>{p.link}</Text> : null}
                  <Text style={{ fontFamily: F, fontSize: 9, color: "#374151", lineHeight: 1.45, marginTop: 2 }}>{p.description}</Text>
                </View>
              ))}
            </Section>
          )}
        </View>
      </View>
      {watermark ? <Watermark /> : null}
    </Page>
  );
}

// =============================================================================
// Elegant – centred serif header, Playfair Display + Lora, date column.
// =============================================================================

function Elegant({ cv, accent, photo, watermark }: CvPdfProps) {
  const H = "Playfair";
  const B = "Lora";
  const ink = "#1c1917";
  const heading = (label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
      <View style={{ width: 34, height: 0.7, backgroundColor: tint(accent, 0.4) }} />
      <Text style={{ fontFamily: H, fontWeight: 500, fontSize: 12, color: accent, letterSpacing: 2.6, textTransform: "uppercase", marginHorizontal: 10 }}>{label}</Text>
      <View style={{ width: 34, height: 0.7, backgroundColor: tint(accent, 0.4) }} />
    </View>
  );
  const body = { fontFamily: B, fontSize: 9.5, lineHeight: 1.5, color: "#292524" };
  const dateCol = 96;

  const Entry = ({ date, place, title, sub, bullets }: { date: string; place: string; title: string; sub: string; bullets: string[] }) => (
    <View style={{ flexDirection: "row", marginBottom: 6 }} wrap={false}>
      <View style={{ width: dateCol, paddingRight: 10 }}>
        <Text style={{ fontFamily: B, fontStyle: "italic", fontSize: 8.8, color: LIGHT }}>{date}</Text>
        {place ? <Text style={{ fontFamily: B, fontSize: 8.2, color: "#a8a29e", marginTop: 1 }}>{place}</Text> : null}
      </View>
      <View style={{ flex: 1, borderLeftWidth: 0.7, borderLeftColor: tint(accent, 0.65), paddingLeft: 11 }}>
        <Text style={{ fontFamily: H, fontWeight: 700, fontSize: 11.3, color: ink }}>{title}</Text>
        <Text style={{ fontFamily: B, fontStyle: "italic", fontSize: 9.6, color: accent, marginTop: 1 }}>{sub}</Text>
        <Bullets items={bullets} font={B} size={9.1} color="#292524" marker={dashMarker(accent)} lineHeight={1.45} />
      </View>
    </View>
  );

  return (
    <Page size="A4" style={{ paddingTop: 30, paddingBottom: 34, paddingHorizontal: 48, fontFamily: B, color: ink }}>
      <View style={{ alignItems: "center" }}>
        {photo ? (
          <Photo src={photo} size={72} border={1.5} borderColor={accent} />
        ) : (
          <Monogram name={cv.basics.fullName} size={50} bg="#ffffff" color={accent} font={H} weight={500} borderColor={accent} />
        )}
        <Text style={{ fontFamily: H, fontWeight: 700, fontSize: 28, letterSpacing: 0.6, color: ink, marginTop: 8 }}>{cv.basics.fullName}</Text>
        <Text style={{ fontFamily: H, fontStyle: "italic", fontWeight: 400, fontSize: 13.5, color: accent, marginTop: 2 }}>{cv.basics.headline}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 9 }}>
          {contacts(cv).map((c, i) => (
            <View key={i} style={{ flexDirection: "row" }}>
              {i > 0 ? <Text style={{ fontFamily: B, fontSize: 8.8, color: accent, marginHorizontal: 7 }}>·</Text> : null}
              <Text style={{ fontFamily: B, fontSize: 8.8, color: GRAY }}>{c.text}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignSelf: "stretch", marginTop: 10 }}>
          <View style={{ height: 0.8, backgroundColor: accent }} />
          <View style={{ height: 0.4, backgroundColor: accent, marginTop: 2 }} />
        </View>
      </View>

      {cv.basics.summary ? (
        <Section heading={heading(cv.labels.profile)} gap={11}>
          <Text style={{ ...body, textAlign: "center", paddingHorizontal: 18 }}>{cv.basics.summary}</Text>
        </Section>
      ) : null}

      {hasAny(cv, "experience") && (
        <Section heading={heading(cv.labels.experience)} gap={11}>
          {cv.experience.map((j, i) => (
            <Entry key={i} date={range(j.start, j.end)} place={j.location} title={j.role} sub={j.company} bullets={j.bullets} />
          ))}
        </Section>
      )}

      {hasAny(cv, "education") && (
        <Section heading={heading(cv.labels.education)} gap={6}>
          {cv.education.map((e, i) => (
            <Entry key={i} date={range(e.start, e.end)} place={e.location} title={[e.degree, e.field].filter(Boolean).join(", ")} sub={e.institution} bullets={e.details} />
          ))}
        </Section>
      )}

      {hasAny(cv, "projects") && (
        <Section heading={heading(cv.labels.projects)} gap={6}>
          {cv.projects.map((p, i) => (
            <View key={i} style={{ marginBottom: 5 }} wrap={false}>
              <Text style={{ fontFamily: H, fontWeight: 700, fontSize: 10.5 }}>
                {p.name}
                {p.link ? <Text style={{ fontFamily: B, fontStyle: "italic", fontSize: 8.6, color: accent }}>{`   ${p.link}`}</Text> : null}
              </Text>
              <Text style={{ ...body, fontSize: 9.3 }}>{p.description}</Text>
            </View>
          ))}
        </Section>
      )}
      {hasAny(cv, "skills") && (
        <Section heading={heading(cv.labels.skills)} gap={6}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cv.skills.map((s, i) => (
              <View key={i} style={{ width: "50%", paddingRight: 12, marginBottom: 6 }} wrap={false}>
                <Text style={{ fontFamily: H, fontWeight: 500, fontSize: 10.2, color: ink }}>{s.category}</Text>
                <Text style={{ ...body, fontSize: 9.2 }}>{s.items.join(", ")}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {(hasAny(cv, "certifications") || hasAny(cv, "languages")) && (
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          {hasAny(cv, "certifications") && (
            <View style={{ flex: 1.4, paddingRight: 14 }}>
              <Section heading={heading(cv.labels.certifications)} gap={0}>
                {cv.certifications.map((c, i) => (
                  <View key={i} style={{ marginBottom: 5 }} wrap={false}>
                    <Text style={{ fontFamily: B, fontWeight: 600, fontSize: 9.4 }}>{c.name}</Text>
                    <Text style={{ fontFamily: B, fontStyle: "italic", fontSize: 8.6, color: LIGHT }}>{[c.issuer, c.date].filter(Boolean).join(", ")}</Text>
                  </View>
                ))}
              </Section>
            </View>
          )}
          {hasAny(cv, "languages") && (
            <View style={{ flex: 1 }}>
              <Section heading={heading(cv.labels.languages)} gap={0}>
                {cv.languages.map((l, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <Text style={{ fontFamily: B, fontSize: 9.4 }}>
                      {l.name}
                      {l.level ? <Text style={{ fontStyle: "italic", color: LIGHT, fontSize: 8.6 }}>{`  ${l.level}`}</Text> : null}
                    </Text>
                    <Dots value={languageLevel(l.level)} on={accent} off={tint(accent, 0.8)} size={5} />
                  </View>
                ))}
              </Section>
            </View>
          )}
        </View>
      )}

      {watermark ? <Watermark /> : null}
    </Page>
  );
}

// =============================================================================
// Executive – dark header band, two columns with a tinted side panel. Inter.
// =============================================================================

function Executive({ cv, accent, photo, watermark }: CvPdfProps) {
  const F = "Inter";
  const band = shade(accent, 0.38);
  const SIDE = 196;
  const panel = tint(accent, 0.93);
  const heading = (label: string) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 10.5, color: band, letterSpacing: 1.6, textTransform: "uppercase" }}>{label}</Text>
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        <View style={{ width: 26, height: 2.2, backgroundColor: accent }} />
        <View style={{ flex: 1, height: 0.6, backgroundColor: tint(accent, 0.75), marginTop: 0.8 }} />
      </View>
    </View>
  );
  const body = { fontFamily: F, fontSize: 9.3, lineHeight: 1.5, color: "#374151" };

  return (
    <Page size="A4" style={{ fontFamily: F, color: INK, paddingBottom: 30 }}>
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: SIDE, backgroundColor: panel }} />

      <View style={{ backgroundColor: band, paddingHorizontal: 38, paddingTop: 32, paddingBottom: 26, flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 28, color: "#ffffff", letterSpacing: -0.5 }}>{cv.basics.fullName}</Text>
          <Text style={{ fontFamily: F, fontWeight: 500, fontSize: 10.5, color: tint(accent, 0.7), letterSpacing: 2.4, textTransform: "uppercase", marginTop: 5 }}>
            {cv.basics.headline}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 13 }}>
            {contacts(cv).map((c, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 14, marginBottom: 4 }}>
                <Icon name={c.icon} size={8.5} color={tint(accent, 0.7)} />
                <Text style={{ fontFamily: F, fontSize: 8.6, color: "#e5e7eb", marginLeft: 4 }}>{c.text}</Text>
              </View>
            ))}
          </View>
        </View>
        {photo ? <Photo src={photo} size={96} border={3} borderColor="#ffffff" /> : <Monogram name={cv.basics.fullName} size={78} bg={tint(band, 0.12)} color="#ffffff" borderColor={tint(band, 0.4)} />}
      </View>
      <View style={{ height: 4, backgroundColor: accent }} />

      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, paddingLeft: 38, paddingRight: 22, paddingTop: 20 }}>
          {cv.basics.summary ? (
            <Section heading={heading(cv.labels.profile)} gap={0}>
              <Text style={body}>{cv.basics.summary}</Text>
            </Section>
          ) : null}

          {hasAny(cv, "experience") && (
            <Section heading={heading(cv.labels.experience)} gap={14}>
              {cv.experience.map((j, i) => (
                <View key={i} style={{ marginBottom: 9 }}>
                  <View wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 10.6, flex: 1, paddingRight: 6 }}>{j.role}</Text>
                      <Text style={{ fontFamily: F, fontWeight: 500, fontSize: 8.4, color: LIGHT }}>{range(j.start, j.end)}</Text>
                    </View>
                    <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 9.2, color: accent, marginTop: 1 }}>
                      {j.company}
                      {j.location ? <Text style={{ fontWeight: 400, color: LIGHT }}>{`  ·  ${j.location}`}</Text> : null}
                    </Text>
                  </View>
                  <Bullets items={j.bullets} font={F} size={9} color="#374151" marker={squareMarker(accent, 3)} />
                </View>
              ))}
            </Section>
          )}

          {hasAny(cv, "projects") && (
            <Section heading={heading(cv.labels.projects)} gap={8}>
              {cv.projects.map((p, i) => (
                <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 9.8 }}>
                    {p.name}
                    {p.link ? <Text style={{ fontWeight: 400, fontSize: 8.2, color: accent }}>{`   ${p.link}`}</Text> : null}
                  </Text>
                  <Text style={{ ...body, fontSize: 9 }}>{p.description}</Text>
                </View>
              ))}
            </Section>
          )}
        </View>

        <View style={{ width: SIDE, paddingHorizontal: 20, paddingTop: 20 }}>
          {hasAny(cv, "skills") && (
            <Section heading={heading(cv.labels.skills)} gap={0}>
              {cv.skills.map((s, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 8.6, color: band, marginBottom: 4 }}>{s.category}</Text>
                  <Chips items={s.items} bg="#ffffff" color={shade(accent, 0.25)} border={tint(accent, 0.7)} size={7.8} />
                </View>
              ))}
            </Section>
          )}

          {hasAny(cv, "education") && (
            <Section heading={heading(cv.labels.education)} gap={10}>
              {cv.education.map((e, i) => (
                <View key={i} style={{ marginBottom: 7 }} wrap={false}>
                  <Text style={{ fontFamily: F, fontWeight: 700, fontSize: 9.2, lineHeight: 1.3 }}>{[e.degree, e.field].filter(Boolean).join(", ")}</Text>
                  <Text style={{ fontFamily: F, fontWeight: 500, fontSize: 8.6, color: accent, marginTop: 1 }}>{e.institution}</Text>
                  <Text style={{ fontFamily: F, fontSize: 8, color: LIGHT, marginTop: 1 }}>{range(e.start, e.end)}</Text>
                  {e.details.map((d, k) => (
                    <Text key={k} style={{ fontFamily: F, fontSize: 8, color: GRAY, marginTop: 1.5, lineHeight: 1.35 }}>{d}</Text>
                  ))}
                </View>
              ))}
            </Section>
          )}

          {hasAny(cv, "certifications") && (
            <Section heading={heading(cv.labels.certifications)} gap={10}>
              {cv.certifications.map((c, i) => (
                <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 8.8, lineHeight: 1.3 }}>{c.name}</Text>
                  <Text style={{ fontFamily: F, fontSize: 8, color: LIGHT }}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</Text>
                </View>
              ))}
            </Section>
          )}

          {hasAny(cv, "languages") && (
            <Section heading={heading(cv.labels.languages)} gap={10}>
              {cv.languages.map((l, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontFamily: F, fontWeight: 600, fontSize: 8.8 }}>{l.name}</Text>
                    <Dots value={languageLevel(l.level)} on={accent} off={tint(accent, 0.75)} size={5} />
                  </View>
                  {l.level ? <Text style={{ fontFamily: F, fontSize: 7.8, color: LIGHT }}>{l.level}</Text> : null}
                </View>
              ))}
            </Section>
          )}
        </View>
      </View>
      {watermark ? <Watermark /> : null}
    </Page>
  );
}

// =============================================================================
// Bold – oversized two-tone name, icon contact column, date rail. Poppins + Inter.
// =============================================================================

function Bold({ cv, accent, photo, watermark }: CvPdfProps) {
  const H = "Poppins";
  const B = "Inter";
  const [first, last] = splitName(cv.basics.fullName);
  const heading = (label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
      <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: accent, marginRight: 8 }} />
      <Text style={{ fontFamily: H, fontWeight: 600, fontSize: 12.5, color: INK }}>{label}</Text>
    </View>
  );
  const body = { fontFamily: B, fontSize: 9.2, lineHeight: 1.5, color: "#374151" };
  const RAIL = 104;

  return (
    <Page size="A4" style={{ paddingTop: 0, paddingBottom: 40, paddingLeft: 44, paddingRight: 40, fontFamily: B, color: INK }}>
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 10, backgroundColor: accent }} />

      <View style={{ flexDirection: "row", paddingTop: 32, alignItems: "flex-start" }}>
        {photo ? (
          <View style={{ marginRight: 16 }}>
            <Photo src={photo} size={86} radius={14} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: H, fontWeight: 700, fontSize: 32, color: INK, lineHeight: 1.05, letterSpacing: -0.5 }}>{first}</Text>
          {last ? <Text style={{ fontFamily: H, fontWeight: 700, fontSize: 32, color: accent, lineHeight: 1.05, letterSpacing: -0.5 }}>{last}</Text> : null}
          <Text style={{ fontFamily: H, fontWeight: 500, fontSize: 10.5, color: LIGHT, letterSpacing: 2.4, textTransform: "uppercase", marginTop: 6 }}>{cv.basics.headline}</Text>
        </View>
        <View style={{ width: 168, paddingTop: 4 }}>
          {contacts(cv).map((c, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <View style={{ width: 17, height: 17, borderRadius: 8.5, backgroundColor: tint(accent, 0.86), alignItems: "center", justifyContent: "center", marginRight: 7 }}>
                <Icon name={c.icon} size={8.5} color={shade(accent, 0.15)} />
              </View>
              <Text style={{ fontFamily: B, fontSize: 8.4, color: GRAY, flex: 1 }}>{c.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {cv.basics.summary ? (
        <View style={{ marginTop: 14, backgroundColor: tint(accent, 0.93), borderLeftWidth: 3, borderLeftColor: accent, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12 }}>
          <Text style={{ ...body, fontSize: 9.5, color: "#1f2937" }}>{cv.basics.summary}</Text>
        </View>
      ) : null}

      {hasAny(cv, "experience") && (
        <Section heading={heading(cv.labels.experience)} gap={14}>
          {cv.experience.map((j, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 8 }} wrap={false}>
              <View style={{ width: RAIL, paddingRight: 10 }}>
                <Text style={{ fontFamily: H, fontWeight: 600, fontSize: 8.6, color: accent }}>{range(j.start, j.end)}</Text>
                {j.location ? <Text style={{ fontFamily: B, fontSize: 8, color: LIGHT, marginTop: 2 }}>{j.location}</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: H, fontWeight: 600, fontSize: 11, color: INK }}>{j.role}</Text>
                <Text style={{ fontFamily: B, fontWeight: 600, fontSize: 9.2, color: GRAY }}>{j.company}</Text>
                <Bullets items={j.bullets} font={B} size={9} color="#374151" marker={dotMarker(accent, 3.4)} />
              </View>
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "skills") && (
        <Section heading={heading(cv.labels.skills)} gap={8}>
          {cv.skills.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 4 }} wrap={false}>
              <Text style={{ width: RAIL, paddingRight: 10, fontFamily: H, fontWeight: 600, fontSize: 8.8, color: INK, paddingTop: 2 }}>{s.category}</Text>
              <View style={{ flex: 1 }}>
                <Chips items={s.items} bg={tint(accent, 0.88)} color={shade(accent, 0.3)} font={H} weight={500} size={8} />
              </View>
            </View>
          ))}
        </Section>
      )}

      {hasAny(cv, "education") && (
        <Section heading={heading(cv.labels.education)} gap={8}>
          {cv.education.map((e, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 8 }} wrap={false}>
              <View style={{ width: RAIL, paddingRight: 10 }}>
                <Text style={{ fontFamily: H, fontWeight: 600, fontSize: 8.6, color: accent }}>{range(e.start, e.end)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: H, fontWeight: 600, fontSize: 10.5 }}>{[e.degree, e.field].filter(Boolean).join(", ")}</Text>
                <Text style={{ fontFamily: B, fontWeight: 600, fontSize: 9, color: GRAY }}>{[e.institution, e.location].filter(Boolean).join("  ·  ")}</Text>
                {e.details.length ? <Text style={{ ...body, fontSize: 8.6, marginTop: 1 }}>{e.details.join("  ·  ")}</Text> : null}
              </View>
            </View>
          ))}
        </Section>
      )}

      {(hasAny(cv, "certifications") || hasAny(cv, "languages")) && (
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          {hasAny(cv, "certifications") && (
            <View style={{ flex: 1.5, paddingRight: 16 }}>
              <Section heading={heading(cv.labels.certifications)} gap={0}>
                {cv.certifications.map((c, i) => (
                  <View key={i} style={{ marginBottom: 5 }} wrap={false}>
                    <Text style={{ fontFamily: H, fontWeight: 500, fontSize: 9.2 }}>{c.name}</Text>
                    <Text style={{ fontFamily: B, fontSize: 8.2, color: LIGHT }}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</Text>
                  </View>
                ))}
              </Section>
            </View>
          )}
          {hasAny(cv, "languages") && (
            <View style={{ flex: 1 }}>
              <Section heading={heading(cv.labels.languages)} gap={0}>
                {cv.languages.map((l, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <View>
                      <Text style={{ fontFamily: H, fontWeight: 500, fontSize: 9.2 }}>{l.name}</Text>
                      {l.level ? <Text style={{ fontFamily: B, fontSize: 7.8, color: LIGHT }}>{l.level}</Text> : null}
                    </View>
                    <Dots value={languageLevel(l.level)} on={accent} off={tint(accent, 0.82)} size={5.5} />
                  </View>
                ))}
              </Section>
            </View>
          )}
        </View>
      )}

      {hasAny(cv, "projects") && (
        <Section heading={heading(cv.labels.projects)} gap={8}>
          {cv.projects.map((p, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 6 }} wrap={false}>
              <Text style={{ width: RAIL, paddingRight: 10, fontFamily: H, fontWeight: 600, fontSize: 9, color: INK }}>{p.name}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...body, fontSize: 9 }}>{p.description}</Text>
                {p.link ? <Text style={{ fontFamily: B, fontSize: 8, color: accent }}>{p.link}</Text> : null}
              </View>
            </View>
          ))}
        </Section>
      )}
      {watermark ? <Watermark /> : null}
    </Page>
  );
}
