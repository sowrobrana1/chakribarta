"use client";

import { useState } from "react";
import { formatBnDate } from "@/lib/format";
import {
  EMPTY_CV,
  EMPTY_EDUCATION_ROW,
  type CvData,
  type EducationRow,
} from "@/lib/cv";

interface PolishResponse {
  ok: boolean;
  aiUsed?: boolean;
  objective?: string;
  skillsSummary?: string;
  error?: string;
}

interface GeneratedCv {
  data: CvData;
  aiUsed: boolean;
  objective: string;
  skillsSummary: string;
}

export default function CvMaker() {
  const [form, setForm] = useState<CvData>(EMPTY_CV);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<GeneratedCv | null>(null);

  function set<K extends keyof CvData>(key: K, value: CvData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setEdu(index: number, key: keyof EducationRow, value: string) {
    setForm((f) => {
      const education = f.education.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      );
      return { ...f, education };
    });
  }

  function addEduRow() {
    setForm((f) => ({
      ...f,
      education: [...f.education, { ...EMPTY_EDUCATION_ROW }],
    }));
  }

  function removeEduRow(index: number) {
    setForm((f) => ({
      ...f,
      education:
        f.education.length > 1
          ? f.education.filter((_, i) => i !== index)
          : f.education,
    }));
  }

  async function generate() {
    setError("");
    if (!form.name.trim()) {
      setError("আপনার নাম লিখুন।");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as PolishResponse;
      if (!data.ok) {
        setError(data.error ?? "CV তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      setGenerated({
        data: form,
        aiUsed: data.aiUsed === true,
        objective: data.objective ?? "",
        skillsSummary: data.skillsSummary ?? "",
      });
      // Bring the fresh preview into view.
      requestAnimationFrame(() => {
        document
          .getElementById("cv-preview")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("সার্ভারের সঙ্গে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  const eduFilled = (rows: EducationRow[]) =>
    rows.filter((r) => r.exam.trim() || r.institute.trim());

  return (
    <>
      <section className="admin-card no-print">
        <h2 className="admin-card-title">আপনার তথ্য দিন</h2>
        <p className="admin-muted">
          ফর্মটি পূরণ করে &ldquo;CV তৈরি করুন&rdquo; চাপুন — নিচে সুন্দর
          একটি CV তৈরি হয়ে যাবে, যেটি প্রিন্ট বা PDF হিসেবে সেভ করতে
          পারবেন। আপনার তথ্য কোথাও সংরক্ষণ করা হয় না।
        </p>

        <div className="admin-form">
          <div className="form-field">
            <label htmlFor="cv-name">আপনার নাম (ইংরেজিতে) *</label>
            <input
              id="cv-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="যেমন: Md. Rahim Uddin"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="cv-father">পিতার নাম</label>
              <input
                id="cv-father"
                value={form.fatherName}
                onChange={(e) => set("fatherName", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="cv-mother">মাতার নাম</label>
              <input
                id="cv-mother"
                value={form.motherName}
                onChange={(e) => set("motherName", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cv-present">বর্তমান ঠিকানা</label>
            <input
              id="cv-present"
              value={form.presentAddress}
              onChange={(e) => set("presentAddress", e.target.value)}
              placeholder="গ্রাম/বাসা, থানা, জেলা"
            />
          </div>
          <div className="form-field">
            <label htmlFor="cv-permanent">স্থায়ী ঠিকানা</label>
            <input
              id="cv-permanent"
              value={form.permanentAddress}
              onChange={(e) => set("permanentAddress", e.target.value)}
              placeholder="বর্তমান ঠিকানার মতোই হলে খালি রাখুন"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="cv-mobile">মোবাইল নম্বর</label>
              <input
                id="cv-mobile"
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="form-field">
              <label htmlFor="cv-dob">জন্ম তারিখ</label>
              <input
                id="cv-dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cv-email">ইমেইল</label>
            <input
              id="cv-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
      </section>

      <section className="admin-card no-print">
        <h2 className="admin-card-title">শিক্ষাগত যোগ্যতা</h2>
        <div className="admin-form">
          {form.education.map((row, i) => (
            <div key={i} className="edu-row">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor={`cv-edu-exam-${i}`}>পরীক্ষা</label>
                  <input
                    id={`cv-edu-exam-${i}`}
                    value={row.exam}
                    onChange={(e) => setEdu(i, "exam", e.target.value)}
                    placeholder="SSC / HSC / স্নাতক"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`cv-edu-inst-${i}`}>প্রতিষ্ঠান</label>
                  <input
                    id={`cv-edu-inst-${i}`}
                    value={row.institute}
                    onChange={(e) => setEdu(i, "institute", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`cv-edu-board-${i}`}>
                    বোর্ড / বিশ্ববিদ্যালয়
                  </label>
                  <input
                    id={`cv-edu-board-${i}`}
                    value={row.board}
                    onChange={(e) => setEdu(i, "board", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`cv-edu-year-${i}`}>পাসের বছর</label>
                  <input
                    id={`cv-edu-year-${i}`}
                    value={row.year}
                    onChange={(e) => setEdu(i, "year", e.target.value)}
                    placeholder="2022"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`cv-edu-result-${i}`}>
                    ফলাফল (GPA/CGPA)
                  </label>
                  <input
                    id={`cv-edu-result-${i}`}
                    value={row.result}
                    onChange={(e) => setEdu(i, "result", e.target.value)}
                    placeholder="GPA 5.00"
                  />
                </div>
              </div>
              {form.education.length > 1 && (
                <button
                  type="button"
                  className="btn-small btn-danger"
                  onClick={() => removeEduRow(i)}
                >
                  এই সারি মুছুন
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-outline" onClick={addEduRow}>
            + আরও যোগ্যতা যোগ করুন
          </button>
        </div>
      </section>

      <section className="admin-card no-print">
        <h2 className="admin-card-title">অভিজ্ঞতা, দক্ষতা ও ভাষা</h2>
        <div className="admin-form">
          <div className="form-field">
            <label htmlFor="cv-exp">কর্ম অভিজ্ঞতা (না থাকলে খালি রাখুন)</label>
            <textarea
              id="cv-exp"
              rows={3}
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
              placeholder="পদ, প্রতিষ্ঠান, সময়কাল — যেমন: Account Assistant, XYZ Ltd, 2022–2024"
            />
          </div>
          <div className="form-field">
            <label htmlFor="cv-skills">দক্ষতা (কমা দিয়ে আলাদা করুন)</label>
            <textarea
              id="cv-skills"
              rows={2}
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="MS Word, Excel, Computer typing, Internet browsing"
            />
          </div>
          <div className="form-field">
            <label htmlFor="cv-lang">ভাষা</label>
            <input
              id="cv-lang"
              value={form.languages}
              onChange={(e) => set("languages", e.target.value)}
              placeholder="Bangla (Native), English (Fluent)"
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          <button
            type="button"
            className="btn-primary"
            onClick={generate}
            disabled={busy}
          >
            {busy ? "CV তৈরি হচ্ছে…" : "CV তৈরি করুন"}
          </button>
        </div>
      </section>

      {generated && (
        <section id="cv-preview" className="cv-print-area">
          <div className="no-print">
            {generated.aiUsed ? (
              <p className="admin-success">
                ✓ AI দিয়ে Career Objective ও দক্ষতার সারাংশ সাজানো হয়েছে।
              </p>
            ) : (
              <p className="notice">
                ℹ️ AI সাজানো (polish) বর্তমানে বন্ধ আছে — টেমপ্লেট দিয়েই CV
                তৈরি হয়েছে। তথ্য ঠিক থাকলে এটি ব্যবহারের জন্য সম্পূর্ণ
                প্রস্তুত।
              </p>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.print()}
              style={{ marginTop: 12 }}
            >
              🖨️ প্রিন্ট / PDF সেভ করুন
            </button>
          </div>

          <article className="cv-sheet">
            <header className="cv-head">
              <h1>{generated.data.name}</h1>
              <p className="cv-contact">
                {[generated.data.presentAddress, generated.data.mobile, generated.data.email]
                  .filter(Boolean)
                  .join("  •  ")}
              </p>
            </header>

            <h2 className="cv-section-title">Career Objective</h2>
            <p className="cv-text">{generated.objective}</p>

            <h2 className="cv-section-title">Personal Information</h2>
            <table className="cv-table">
              <tbody>
                {generated.data.fatherName && (
                  <tr>
                    <th>Father&rsquo;s Name</th>
                    <td>{generated.data.fatherName}</td>
                  </tr>
                )}
                {generated.data.motherName && (
                  <tr>
                    <th>Mother&rsquo;s Name</th>
                    <td>{generated.data.motherName}</td>
                  </tr>
                )}
                {generated.data.dob && (
                  <tr>
                    <th>Date of Birth</th>
                    <td>{formatBnDate(generated.data.dob)}</td>
                  </tr>
                )}
                {generated.data.presentAddress && (
                  <tr>
                    <th>Present Address</th>
                    <td>{generated.data.presentAddress}</td>
                  </tr>
                )}
                {(generated.data.permanentAddress ||
                  generated.data.presentAddress) && (
                  <tr>
                    <th>Permanent Address</th>
                    <td>
                      {generated.data.permanentAddress ||
                        generated.data.presentAddress}
                    </td>
                  </tr>
                )}
                {generated.data.mobile && (
                  <tr>
                    <th>Mobile</th>
                    <td>{generated.data.mobile}</td>
                  </tr>
                )}
                {generated.data.email && (
                  <tr>
                    <th>Email</th>
                    <td>{generated.data.email}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {eduFilled(generated.data.education).length > 0 && (
              <>
                <h2 className="cv-section-title">Educational Qualifications</h2>
                <table className="cv-table cv-edu-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Institution</th>
                      <th>Board / University</th>
                      <th>Year</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eduFilled(generated.data.education).map((row, i) => (
                      <tr key={i}>
                        <td>{row.exam}</td>
                        <td>{row.institute}</td>
                        <td>{row.board}</td>
                        <td>{row.year}</td>
                        <td>{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {generated.data.experience.trim() && (
              <>
                <h2 className="cv-section-title">Work Experience</h2>
                <p className="cv-text pre-line">{generated.data.experience}</p>
              </>
            )}

            {(generated.skillsSummary || generated.data.skills.trim()) && (
              <>
                <h2 className="cv-section-title">Skills</h2>
                <p className="cv-text">
                  {generated.skillsSummary || generated.data.skills}
                </p>
              </>
            )}

            {generated.data.languages.trim() && (
              <>
                <h2 className="cv-section-title">Languages</h2>
                <p className="cv-text">{generated.data.languages}</p>
              </>
            )}

            <h2 className="cv-section-title">Declaration</h2>
            <p className="cv-text">
              I hereby declare that the information given above is true and
              correct to the best of my knowledge and belief.
            </p>
            <div className="cv-signature">
              <span>Signature</span>
              <strong>{generated.data.name}</strong>
            </div>
          </article>
        </section>
      )}
    </>
  );
}
