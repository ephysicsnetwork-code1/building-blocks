import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { HANDLE_RE } from "@/lib/school-constants";
import { getExamTestStatus, signupExamTester } from "@/lib/portal.functions";
import { TOTAL_TESTERS } from "@/lib/exam-test-rules";

const REASONS: Record<string, string> = {
  not_registered: "We couldn't find you. Only Grade 12 students who already joined through the bot can sign up — use the same name and Telegram username you joined with.",
  wrong_section: "Only Grade 12 sections A, B (Natural) and C (Social) can take part.",
  already: "You've already signed up. Wait for the result on Telegram.",
  closed: "Selection is finished. Thank you for your interest!",
  not_open: "Sign-up hasn't opened yet. Please check back later.",
};

export function ExamTestFlow({ supportUrl }: { supportUrl: string }) {
  const status = useServerFn(getExamTestStatus);
  const signup = useServerFn(signupExamTester);
  const [st, setSt] = useState<{ deadline: string | null; closed: boolean; open: boolean; benefits: string[] } | null>(null);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => { status().then(setSt).catch(() => setSt({ deadline: null, closed: false, open: false, benefits: [] })); }, [status]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) { toast.error("Enter your full name"); return; }
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram username"); return; }
    setBusy(true);
    try {
      const r = await signup({ data: { name, handle } });
      if (r.ok) setDone(r.name);
      else toast.error(REASONS[r.reason] ?? "Something went wrong", { action: { label: "Contact us", onClick: () => window.open(supportUrl, "_blank") } });
    } catch { toast.error("Please try again."); } finally { setBusy(false); }
  }

  const deadline = st?.deadline ? new Date(st.deadline).toLocaleString() : null;

  return (
    <div className="glass space-y-4 rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold">Grade 12 exam portal testers</h2>
      <p className="text-sm text-muted-foreground">
        {TOTAL_TESTERS} Grade 12 students will be picked at random — 5 from section A and 5 from B (Natural), and 5 from section C (Social) — to test our new exam portal.
      </p>
      <div className="rounded-xl border p-3 text-sm">
        <div className="font-semibold">What you get</div>
        <ul className="mt-1 list-disc pl-5 text-muted-foreground">{(st?.benefits ?? []).map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
      {!st ? <p className="text-muted-foreground">Loading…</p>
        : st.closed ? <p className="font-semibold">{REASONS["closed"]}</p>
        : done ? <p className="font-semibold text-success">You're signed up, {done}! If you're picked, you'll get a message on Telegram{deadline ? ` after ${deadline}` : ""}.</p>
        : !st.open ? <p>{REASONS["not_open"]}</p>
        : (
          <form onSubmit={submit} className="space-y-3">
            {deadline && <p className="text-sm">Sign-up closes: <span className="font-semibold">{deadline}</span></p>}
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Full name you joined with" />
            <input className="field" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} placeholder="@telegram username" />
            <button className="btn-glow w-full" disabled={busy}>{busy ? "Checking…" : "Sign up to test"}</button>
          </form>
        )}
    </div>
  );
}
