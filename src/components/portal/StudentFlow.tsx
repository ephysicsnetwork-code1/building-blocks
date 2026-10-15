import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { GRADES, STREAM_GRADES, HANDLE_RE, MAX_FAILED_ATTEMPTS } from "@/lib/school-constants";
import { verifyStudent } from "@/lib/portal.functions";
import { SecureReveal, ErrorCard } from "./SecureReveal";
import { GlassIcon } from "./GlassIcon";

type Result =
  | { ok: true; link: string; name: string; handle: string }
  | { ok: false; reason: "not_found" | "already_joined" | "banned"; remaining?: number };

export function StudentFlow({
  supportUrl,
  support,
  sections,
}: {
  supportUrl: string;
  support: string;
  sections: Record<string, string[]>;
}) {
  const verify = useServerFn(verifyStudent);
  const [grade, setGrade] = useState<string | null>(null);
  const [stream, setStream] = useState<"Natural" | "Social" | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const needsStream = grade ? STREAM_GRADES.includes(grade) : false;
  const step = !grade ? 1 : needsStream && !stream ? 2 : !section ? 3 : 4;

  const reset = () => { setGrade(null); setStream(null); setSection(null); setName(""); setRemaining(null); };

  async function submit() {
    if (name.trim().length < 2) { toast.error("Type your full official name"); return; }
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle, e.g. @username"); return; }
    setBusy(true);
    try {
      const r = (await verify({ data: { grade: grade!, stream, section: section!, name, handle } })) as Result;
      if (!r.ok && r.reason === "not_found") {
        setRemaining(r.remaining ?? null);
        toast.error(`No match found. ${r.remaining ?? 0} attempt(s) left before this name is locked.`);
      } else {
        setResult(r);
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) return <SecureReveal link={result.link} name={result.name} handle={result.handle} />;
  if (result && !result.ok)
    return (
      <ErrorCard
        title={result.reason === "already_joined" ? "Already joined" : "Name locked"}
        text={
          result.reason === "already_joined"
            ? "This student has already joined. If this is a mistake, contact the admin."
            : `Verification failed ${MAX_FAILED_ATTEMPTS} times for this name, so it has been locked. The admin has been notified and can restore access.`
        }
        supportUrl={supportUrl}
        support={support}
      />
    );

  return (
    <div className="glass rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Student verification</h2>
        {grade && <button className="text-sm text-primary" onClick={reset}>Start over</button>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {[grade && `Grade ${grade}`, stream, section && `Section ${section}`].filter(Boolean).join(" · ") || "Step 1 of 4"}
      </p>

      {step === 1 && (
        <Grid label="Select your grade">
          {GRADES.map((g) => <button key={g} className="choice" onClick={() => setGrade(g)}>Grade {g}</button>)}
        </Grid>
      )}
      {step === 2 && (
        <Grid label="Select your stream">
          {(["Natural", "Social"] as const).map((s) => <button key={s} className="choice" onClick={() => setStream(s)}>{s}</button>)}
        </Grid>
      )}
      {step === 3 && (
        <Grid label="Select your section">
          {(sections[grade!] ?? []).map((s) => (
            <button key={s} className="choice" onClick={() => setSection(s)}>Section {s}</button>
          ))}
        </Grid>
      )}
      {step === 4 && (
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border p-3 text-xs text-muted-foreground">
            <GlassIcon icon={Lock} size="sm" />
            <span>
              For privacy the class list is hidden. Type your full name exactly as registered at school.
              After {MAX_FAILED_ATTEMPTS} wrong attempts the name is locked.
            </span>
          </div>
          <div>
            <label className="text-sm font-semibold">Your full official name</label>
            <input className="field mt-2" placeholder="e.g. Abebe Kebede Tesfaye" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="off" />
            {remaining !== null && (
              <p className="mt-2 text-xs text-warning">{remaining} attempt(s) remaining</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold">Your Telegram handle</label>
            <input className="field mt-2" placeholder="@username" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} />
          </div>
          <button className="btn-glow w-full" disabled={!name.trim() || busy} onClick={submit}>
            {busy ? "Verifying…" : "Verify & join"}
          </button>
        </div>
      )}
    </div>
  );
}

function Grid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-3 text-sm font-semibold">{label}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}
