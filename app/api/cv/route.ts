import { NextResponse } from "next/server";
import {
  buildTemplateObjective,
  buildTemplateSkillsSummary,
  parseCvPayload,
  type CvData,
} from "@/lib/cv";

export const dynamic = "force-dynamic";

/**
 * POST /api/cv — polish a CV's narrative fields.
 *
 * Body: CvData (see lib/cv.ts). Response:
 *   { ok: true, aiUsed: boolean, objective: string, skillsSummary: string }
 *
 * If GEMINI_API_KEY is set, Google Gemini rewrites the Career Objective
 * and skills summary into polished professional English (model chain
 * tried in order). If the key is missing, or every model call fails,
 * template text is returned with aiUsed:false — CV generation never
 * breaks because of the AI step.
 */

// Same model-chain style as the user's other projects; newest flash first.
const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
];

interface PolishResult {
  objective: string;
  skillsSummary: string;
}

function buildPrompt(data: CvData): string {
  const education = data.education
    .filter((r) => r.exam.trim() !== "")
    .map(
      (r) =>
        `${r.exam} — ${r.institute}${r.board ? ` (${r.board})` : ""}${
          r.year ? `, ${r.year}` : ""
        }${r.result ? `, Result: ${r.result}` : ""}`
    )
    .join("\n");

  return [
    "You are a professional CV writer for Bangladeshi job seekers.",
    "Using ONLY the facts below (never invent employers, degrees or skills),",
    "write in polished, professional English:",
    '1) "objective": a Career Objective of 3-4 sentences.',
    '2) "skillsSummary": one or two sentences summarising the skills.',
    "Reply with ONLY a JSON object: {\"objective\": \"...\", \"skillsSummary\": \"...\"}",
    "",
    `Name: ${data.name}`,
    education ? `Education:\n${education}` : "",
    data.experience ? `Experience: ${data.experience}` : "Experience: (none stated)",
    data.skills ? `Skills: ${data.skills}` : "",
    data.languages ? `Languages: ${data.languages}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function polishWithGemini(
  apiKey: string,
  data: CvData
): Promise<PolishResult | null> {
  const prompt = buildPrompt(data);

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
          signal: controller.signal,
        }
      );
      if (!res.ok) continue;

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("");
      if (!text) continue;

      const parsed = JSON.parse(text) as Partial<PolishResult>;
      if (
        typeof parsed.objective === "string" &&
        parsed.objective.trim() !== ""
      ) {
        return {
          objective: parsed.objective.trim(),
          skillsSummary:
            typeof parsed.skillsSummary === "string"
              ? parsed.skillsSummary.trim()
              : "",
        };
      }
    } catch {
      // timeout / network / bad JSON — try the next model in the chain
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "ভুল ডাটা পাঠানো হয়েছে।" },
      { status: 400 }
    );
  }

  const parsed = parseCvPayload(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: 400 }
    );
  }
  const data = parsed.value;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const polished = await polishWithGemini(apiKey, data);
    if (polished) {
      return NextResponse.json({
        ok: true,
        aiUsed: true,
        objective: polished.objective,
        skillsSummary:
          polished.skillsSummary || buildTemplateSkillsSummary(data),
      });
    }
    // AI failed — fall through to the template, never break the CV.
  }

  return NextResponse.json({
    ok: true,
    aiUsed: false,
    objective: buildTemplateObjective(data),
    skillsSummary: buildTemplateSkillsSummary(data),
  });
}
