// Shared building blocks for the CV templates: fonts, colours, icons, small components.
import path from "node:path";
import { Circle, Font, Image, Path, Rect, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";
import type { CvContent } from "@/lib/cv-schema";

// --- Fonts --------------------------------------------------------------------
// Static, Latin-subset TTFs generated from Google Fonts (OFL licences alongside).
// next.config.ts traces this folder into the PDF route's serverless bundle.

const fontFile = (name: string) => path.join(process.cwd(), "src/lib/pdf/fonts", name);

Font.register({
  family: "Inter",
  fonts: [
    { src: fontFile("Inter-400.ttf"), fontWeight: 400 },
    { src: fontFile("Inter-400italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    { src: fontFile("Inter-500.ttf"), fontWeight: 500 },
    { src: fontFile("Inter-600.ttf"), fontWeight: 600 },
    { src: fontFile("Inter-700.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Playfair",
  fonts: [
    { src: fontFile("Playfair-500.ttf"), fontWeight: 500 },
    { src: fontFile("Playfair-700.ttf"), fontWeight: 700 },
    { src: fontFile("Playfair-400italic.ttf"), fontWeight: 400, fontStyle: "italic" },
  ],
});
Font.register({
  family: "Lora",
  fonts: [
    { src: fontFile("Lora-400.ttf"), fontWeight: 400 },
    { src: fontFile("Lora-600.ttf"), fontWeight: 600 },
    { src: fontFile("Lora-400italic.ttf"), fontWeight: 400, fontStyle: "italic" },
  ],
});
Font.register({
  family: "SourceSans",
  fonts: [
    { src: fontFile("SourceSans-400.ttf"), fontWeight: 400 },
    { src: fontFile("SourceSans-600.ttf"), fontWeight: 600 },
    { src: fontFile("SourceSans-700.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Poppins",
  fonts: [
    { src: fontFile("Poppins-500.ttf"), fontWeight: 500 },
    { src: fontFile("Poppins-600.ttf"), fontWeight: 600 },
    { src: fontFile("Poppins-700.ttf"), fontWeight: 700 },
  ],
});

// Never split words across lines; hyphenated names and skills look sloppy on a CV.
Font.registerHyphenationCallback((word) => [word]);

// --- Colour -------------------------------------------------------------------

function rgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes `hex` toward `target` by `t` (0 = hex, 1 = target). */
export function mix(hex: string, target: string, t: number) {
  const a = rgb(hex);
  const b = rgb(target);
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
export const tint = (hex: string, t: number) => mix(hex, "#ffffff", t);
export const shade = (hex: string, t: number) => mix(hex, "#000000", t);

export const INK = "#111827";
export const GRAY = "#4b5563";
export const LIGHT = "#6b7280";

// --- Text helpers -------------------------------------------------------------

export const range = (start: string, end: string) => [start, end].filter(Boolean).join(" – ");
export const clean = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Splits a full name into a first line and the rest, for two-line name layouts. */
export function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? [parts[0], parts.slice(1).join(" ")] : [name, ""];
}

/** Maps a free-text language level (in several languages) to 1–5 dots. */
export function languageLevel(level: string) {
  const l = level.toLowerCase();
  if (/(native|mother|bilingu|natif|maternelle|nativo|muttersprach|madrelingua|moeder)/.test(l)) return 5;
  if (/(fluent|c2|c1|advanced|proficient|courant|avancé|fluido|avanzado|fließend|verhandlungssicher|fluente|vloeiend)/.test(l)) return 4;
  if (/(professional|b2|upper|professionnel|profesional|beruflich)/.test(l)) return 4;
  if (/(intermediate|b1|conversational|intermédiaire|intermedio|mittel|gut)/.test(l)) return 3;
  if (/(basic|elementary|beginner|a1|a2|notions|débutant|básico|grundkenntnis|base)/.test(l)) return 2;
  return 3;
}

// --- Icons --------------------------------------------------------------------
// Feather-style stroke icons on a 24×24 grid.

export type IconName = "mail" | "phone" | "pin" | "link" | "linkedin";

export function Icon({ name, size = 9, color = GRAY }: { name: IconName; size?: number; color?: string }) {
  const stroke = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      {name === "mail" && (
        <>
          <Rect x="2.5" y="4.5" width="19" height="15" rx="2" {...stroke} />
          <Path d="M3 6.5l9 6.5 9-6.5" {...stroke} />
        </>
      )}
      {name === "phone" && (
        <Path
          d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
          {...stroke}
        />
      )}
      {name === "pin" && (
        <>
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" {...stroke} />
          <Circle cx="12" cy="10" r="3" {...stroke} />
        </>
      )}
      {name === "link" && (
        <>
          <Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" {...stroke} />
          <Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" {...stroke} />
        </>
      )}
      {name === "linkedin" && (
        <>
          <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" {...stroke} />
          <Rect x="2" y="9" width="4" height="12" {...stroke} />
          <Circle cx="4" cy="4" r="2" {...stroke} />
        </>
      )}
    </Svg>
  );
}

export function contacts(cv: CvContent): { icon: IconName; text: string }[] {
  const b = cv.basics;
  const items: { icon: IconName; text: string }[] = [];
  if (b.email) items.push({ icon: "mail", text: b.email });
  if (b.phone) items.push({ icon: "phone", text: b.phone });
  if (b.location) items.push({ icon: "pin", text: b.location });
  if (b.linkedin) items.push({ icon: "linkedin", text: clean(b.linkedin) });
  if (b.website) items.push({ icon: "link", text: clean(b.website) });
  return items;
}

// --- Small components ---------------------------------------------------------

export function Photo({ src, size, border, borderColor = "#ffffff", radius }: { src: string; size: number; border?: number; borderColor?: string; radius?: number }) {
  return (
    <Image
      src={src}
      style={{ width: size, height: size, borderRadius: radius ?? size / 2, objectFit: "cover", borderWidth: border ?? 0, borderColor }}
    />
  );
}

export function Monogram({ name, size, bg, color, font = "Inter", weight = 700, borderColor }: { name: string; size: number; bg: string; color: string; font?: string; weight?: 500 | 600 | 700; borderColor?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: borderColor ? 1 : 0,
        borderColor: borderColor ?? bg,
      }}
    >
      <Text style={{ fontFamily: font, fontWeight: weight, fontSize: size * 0.36, color, letterSpacing: 1 }}>{initials(name) || "CV"}</Text>
    </View>
  );
}

export function Dots({ value, on, off, size = 5.5 }: { value: number; on: string; off: string; size?: number }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: size / 2, marginLeft: i === 1 ? 0 : 2.5, backgroundColor: i <= value ? on : off }} />
      ))}
    </View>
  );
}

export function Chips({ items, bg, color, font = "Inter", weight = 500, size = 8.2, border }: { items: string[]; bg: string; color: string; font?: string; weight?: 400 | 500 | 600; size?: number; border?: string }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginRight: -4 }}>
      {items.filter(Boolean).map((s, i) => (
        <Text
          key={i}
          style={{
            fontFamily: font,
            fontWeight: weight,
            fontSize: size,
            color,
            backgroundColor: bg,
            borderRadius: 9,
            paddingVertical: 2.4,
            paddingHorizontal: 7,
            marginRight: 4,
            marginBottom: 4,
            borderWidth: border ? 0.6 : 0,
            borderColor: border ?? bg,
          }}
        >
          {s}
        </Text>
      ))}
    </View>
  );
}

/** Bullet list with a custom marker so every template controls its own look. */
export function Bullets({
  items,
  font,
  size = 9.4,
  color = "#1f2937",
  marker,
  lineHeight = 1.45,
}: {
  items: string[];
  font: string;
  size?: number;
  color?: string;
  marker: ReactNode;
  lineHeight?: number;
}) {
  return (
    <View style={{ marginTop: 3 }}>
      {items.filter(Boolean).map((item, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 2.2 }} wrap={false}>
          <View style={{ width: 11, paddingTop: size * 0.5 }}>{marker}</View>
          <Text style={{ flex: 1, fontFamily: font, fontSize: size, lineHeight, color }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export const dotMarker = (color: string, size = 3.2) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
);
export const squareMarker = (color: string, size = 3.2) => <View style={{ width: size, height: size, backgroundColor: color }} />;
export const dashMarker = (color: string) => <View style={{ width: 5, height: 0.8, backgroundColor: color, marginTop: 1 }} />;

export function Watermark({ color = "#9ca3af" }: { color?: string }) {
  return (
    <View fixed style={{ position: "absolute", bottom: 12, left: 0, right: 0 }}>
      <Text style={{ fontFamily: "Inter", fontSize: 7.5, color, textAlign: "center" }}>{`Created with ${APP_NAME} · Free plan`}</Text>
    </View>
  );
}

export const hasAny = (cv: CvContent, key: "experience" | "education" | "certifications" | "skills" | "languages" | "projects") =>
  cv[key].length > 0;
