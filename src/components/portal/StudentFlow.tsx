import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Check } from "lucide-react";
import { HANDLE_RE } from "@/lib/school-constants";
import { verifyStudent, searchStudents } from "@/lib/portal.functions";
import { SecureReveal, ErrorCard } from "./SecureReveal";
import { GlassIcon } from "./GlassIcon";

type Result =
  | { ok: true; link: string; name: string; handle: string }
  | { ok: false; reason: "not_found" | "already_joined" | "banned"; remaining?: number };
type Match = { name: string; grade: string; section: string };

export function StudentFlow({
  supportUrl,
  support,
}: {
  supportUrl: string;
  support: string;
  sections?: Record<string, string[]>;
}) {
  const verify = useServerFn(verifyStudent);
  const search = useServerFn(searchStudents);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [picked, setPicked] = useState<Match | null>(null);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (picked || query.trim().length < 3) { setMatches([]); return; }
    const t = setTimeout(() => {
      search({ data: { q: query } }).then(setMatches).catch(() => setMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query, picked, search]);

  async function submit() {
    if (!picked) { toast.error("Type your name and tap it in the list"); return; }
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle, e.g. @username"); return; }
    setBusy(true);
    try {
      const r = (await verify({
        data: { grade: picked.grade as "9", stream: null, section: picked.section, name: picked.name, handle },
      })) as Result;
      setResult(r);
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
            : "This name has been locked. The admin has been notified and can restore access."
        }
        supportUrl={supportUrl}
        support={support}
      />
    );

  return (
    <div className="glass rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold">Student verification</h2>
      <div className="mt-5 space-y-4">
        <div className="flex items-start gap-3 rounded-xl border p-3 text-xs text-muted-foreground">
          <GlassIcon icon={Lock} size="sm" />
          <span>Start typing your name (at least 3 letters), then tap your full name when it appears.</span>
        </div>
        <div>
          <label className="text-sm font-semibold">Your name</label>
          <input
            className="field mt-2"
            placeholder="e.g. Abebe"
            value={picked ? picked.name : query}
            onChange={(e) => { setPicked(null); setQuery(e.target.value); }}
            maxLength={120}
            autoComplete="off"
          />
          {picked && (
            <p className="mt-2 flex items-center gap-1 text-xs text-primary">
              <Check className="h-3 w-3" /> Grade {picked.grade} · Section {picked.section}
              <button className="ml-2 underline" onClick={() => { setPicked(null); setQuery(""); }}>Change</button>
            </p>
          )}
          {!picked && matches.length > 0 && (
            <div className="mt-2 space-y-2">
              {matches.map((m) => (
                <button
                  key={`${m.name}-${m.grade}-${m.section}`}
                  className="choice w-full text-left"
                  onClick={() => setPicked(m)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          {!picked && query.trim().length >= 3 && matches.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">No name found yet. Keep typing or check the spelling.</p>
          )}
        </div>
        <div>
          <label className="text-sm font-semibold">Your Telegram handle</label>
          <input className="field mt-2" placeholder="@username" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} />
        </div>
        <button className="btn-glow w-full" disabled={!picked || busy} onClick={submit}>
          {busy ? "Verifying…" : "Verify & join"}
        </button>
      </div>
    </div>
  );
}
