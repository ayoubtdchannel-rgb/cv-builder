// Renders every template with the sample CV into <out-dir>: npm run render-samples -- <out-dir>
import { writeFileSync } from "node:fs";
import { renderCvPdf } from "../src/lib/pdf/templates";
import { SAMPLE_CV } from "../src/lib/sample-cv";
import { TEMPLATES } from "../src/lib/cv-schema";

const out = process.argv[2] ?? ".";
for (const { id } of TEMPLATES) {
  const pdf = await renderCvPdf({ cv: SAMPLE_CV, template: id, accent: "#1f4e79", photo: null, watermark: false });
  writeFileSync(`${out}/${id}.pdf`, pdf);
  console.log(`${out}/${id}.pdf`);
}
