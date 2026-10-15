import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { HANDLE_RE } from "@/lib/school-constants";
import { verifyTeacher } from "@/lib/portal.functions";
import { SecureReveal, ErrorCard } from "./SecureReveal";

type Result = { ok: true; link: string; name: string; handle: string } | { ok: false; reason: string };

export function TeacherFlow({ supportUrl, support }: { supportUrl: string; support: string }) {
  const verify = useServerFn(verifyTeacher);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) { toast.error("Enter your full official name"); return; }
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle"); return; }
    setBusy(true);
    try {
      setResult((await verify({ data: { name, handle } })) as Result);
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) return <SecureReveal link={result.link} name={result.name} handle={result.handle} />;
  if (result && !result.ok)
    return <ErrorCard title="Not on staff roster" text="Your name didn't match the official staff list. Use your full official name, or contact the admin." supportUrl={supportUrl} support={support} />;

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold">Teacher verification</h2>
      <div>
        <label className="text-sm font-semibold">Full official name</label>
        <input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Girmaa Gaaddisaa Korsaa" />
      </div>
      <div>
        <label className="text-sm font-semibold">Telegram handle</label>
        <input className="field mt-2" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} placeholder="@username" />
      </div>
      <button className="btn-glow w-full" disabled={busy}>{busy ? "Checking…" : "Verify"}</button>
    </form>
  );
}
