/**
 * Shared types + template text for the AI CV Maker (/cv).
 *
 * The page collects the user's details, POSTs them to /api/cv, and the
 * API returns a polished (Gemini, when GEMINI_API_KEY is set) or
 * template "Career Objective" + skills summary. The preview is then
 * rendered client-side from the form data + those two AI/template fields.
 */

export interface EducationRow {
  exam: string; // পরীক্ষার নাম (SSC / HSC / স্নাতক…)
  institute: string; // প্রতিষ্ঠান
  board: string; // বোর্ড / বিশ্ববিদ্যালয়
  year: string; // পাসের বছর
  result: string; // ফলাফল / GPA / CGPA
}

export interface CvData {
  name: string;
  fatherName: string;
  motherName: string;
  presentAddress: string;
  permanentAddress: string;
  mobile: string;
  email: string;
  dob: string; // ISO date (yyyy-mm-dd)
  education: EducationRow[];
  experience: string;
  skills: string;
  languages: string;
}

export const EMPTY_EDUCATION_ROW: EducationRow = {
  exam: "",
  institute: "",
  board: "",
  year: "",
  result: "",
};

export const EMPTY_CV: CvData = {
  name: "",
  fatherName: "",
  motherName: "",
  presentAddress: "",
  permanentAddress: "",
  mobile: "",
  email: "",
  dob: "",
  education: [{ ...EMPTY_EDUCATION_ROW }],
  experience: "",
  skills: "",
  languages: "",
};

/** Highest qualification label, for the template objective. */
function highestQualification(data: CvData): string {
  const filled = data.education.filter((r) => r.exam.trim() !== "");
  return filled.length > 0 ? filled[filled.length - 1].exam.trim() : "";
}

/**
 * Fallback "Career Objective" used when Gemini is unavailable (no key,
 * API error, timeout). Written in plain professional English from the
 * form data only — never invents facts beyond what the user typed.
 */
export function buildTemplateObjective(data: CvData): string {
  const qual = highestQualification(data);
  const qualPart = qual
    ? ` Holding a qualification of ${qual}, I bring a strong academic background and a sincere commitment to quality work.`
    : "";
  const expPart = data.experience.trim()
    ? " With relevant practical experience, I am confident I can contribute effectively from the very beginning."
    : " As a motivated and quick learner, I am eager to apply my knowledge and grow with the organisation.";
  return (
    `To build my career in a reputed organisation where I can apply my education, skills and dedication to achieve both organisational goals and personal professional growth.${qualPart}${expPart} ` +
    `I am hardworking, honest and able to work under pressure, and I am looking for an opportunity where performance and sincerity are valued.`
  );
}

/**
 * Fallback skills summary used when Gemini is unavailable: presents the
 * user's own comma/newline separated skills as one clean sentence.
 */
export function buildTemplateSkillsSummary(data: CvData): string {
  const skills = data.skills
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (skills.length === 0) return "";
  return `Skilled in ${skills.join(", ")}.`;
}

/** Validate + normalize a CV payload coming from the client form. */
export function parseCvPayload(
  body: unknown
): { ok: true; value: CvData } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "ভুল ডাটা পাঠানো হয়েছে।" };
  }
  const b = body as Record<string, unknown>;

  const str = (v: unknown): string =>
    typeof v === "string" ? v.trim().slice(0, 2000) : "";

  const name = str(b.name);
  if (!name) return { ok: false, error: "আপনার নাম আবশ্যক।" };

  let education: EducationRow[] = [];
  if (Array.isArray(b.education)) {
    education = b.education.slice(0, 8).map((row) => {
      const r = (row ?? {}) as Record<string, unknown>;
      return {
        exam: str(r.exam),
        institute: str(r.institute),
        board: str(r.board),
        year: str(r.year),
        result: str(r.result),
      };
    });
  }

  return {
    ok: true,
    value: {
      name,
      fatherName: str(b.fatherName),
      motherName: str(b.motherName),
      presentAddress: str(b.presentAddress),
      permanentAddress: str(b.permanentAddress),
      mobile: str(b.mobile),
      email: str(b.email),
      dob: /^\d{4}-\d{2}-\d{2}$/.test(str(b.dob)) ? str(b.dob) : "",
      education,
      experience: str(b.experience),
      skills: str(b.skills),
      languages: str(b.languages),
    },
  };
}
