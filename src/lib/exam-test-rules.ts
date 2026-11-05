// Grade 12 exam-portal tester selection rules (client-safe, no roster data).
export const EXAM_PORTAL_URL = "https://ashalove.lovable.app/";
export const TESTER_SECTIONS = { A: "Natural", B: "Natural", C: "Social" } as const;
export const PER_SECTION = 5;
export const TOTAL_TESTERS = PER_SECTION * Object.keys(TESTER_SECTIONS).length; // 15
export const TESTER_BENEFITS = ["Early practice with the Grade 12 exam portal before the real exams", "Recognition as an official exam portal tester"];

export function isTesterSection(s: string): s is keyof typeof TESTER_SECTIONS {
  return s in TESTER_SECTIONS;
}

/** Picks up to 5 random sign-ups from each of sections A, B and C. */
export function pickTesters<T extends { section: string }>(list: T[], rng: () => number = Math.random): T[] {
  const out: T[] = [];
  for (const sec of Object.keys(TESTER_SECTIONS)) {
    const pool = list.filter((x) => x.section === sec);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    out.push(...pool.slice(0, PER_SECTION));
  }
  return out;
}

export function parseBenefits(v: string | null | undefined): string[] {
  const list = (v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  return list.length ? list : TESTER_BENEFITS;
}

export function selectionMessage(name: string, benefits: string[] = TESTER_BENEFITS) {
  return `🎉 Congratulations ${name}! You have been picked as one of the ${TOTAL_TESTERS} Grade 12 students to test the new exam portal.\n\nWhat you get:\n${benefits.map((b) => `• ${b}`).join("\n")}\n\nOpen the exam portal: ${EXAM_PORTAL_URL}`;
}
