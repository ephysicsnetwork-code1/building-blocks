import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { SCHOOL_DATABASE, GRADES, STREAM_GRADES, HANDLE_RE } from "@/lib/school-data";
import { verifyStudent } from "@/lib/portal.functions";
import { SecureReveal, ErrorCard } from "./SecureReveal";

type Result = { ok: true; link: string; name: string; handle: string } | { ok: false; reason: string };

export function StudentFlow({ supportUrl, support }: { supportUrl: string; support: string }) {
  const verify = useServerFn(verifyStudent);
  const [grade, setGrade] = useState<string | null>(null);
  const [stream, setStream] = useState<"Natural" | "Social" | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const needsStream = grade ? STREAM_GRADES.includes(grade) : false;
  const step = !grade ? 1 : needsStream && !stream ? 2 : !section ? 3 : 4;
  const names = grade && section ? SCHOOL_DATABASE.students[grade]?.[section] ?? [] : [];
  const filtered = names.filter((n) => n.toLowerCase().includes(query.toLowerCase()));

  const reset = () => { setGrade(null); setStream(null); setSection(null); setName(""); setQuery(""); };

  async function submit() {
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle, e.g. @username"); return; }
    setBusy(true);
    try {
      const r = await verify({ data: { grade: grade!, stream, section: section!, name, handle } });
      setResult(r as Result);
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
        title={result.reason === "already_joined" ? "Already verified" : "Not found"}
        text={result.reason === "already_joined"
          ? "This student has already used their one-time access. If this is a mistake, contact the admin."
          : "We couldn't match your details to the school roster."}
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
          {Object.keys(SCHOOL_DATABASE.students[grade!] ?? {}).map((s) => (
            <button key={s} className="choice" onClick={() => setSection(s)}>Section {s}</button>
          ))}
        </Grid>
      )}
      {step === 4 && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Find your official name</label>
            <input className="field mt-2" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border p-1">
              {filtered.map((n) => (
                <button
                  key={n}
                  onClick={() => setName(n)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${name === n ? "bg-accent text-primary" : "hover:bg-muted"}`}
                >
                  {n}
                </button>
              ))}
              {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No match.</p>}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">Your Telegram handle</label>
            <input className="field mt-2" placeholder="@username" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} />
          </div>
          <button className="btn-glow w-full" disabled={!name || busy} onClick={submit}>
            {busy ? "Verifying…" : "Verify & reveal link"}
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
