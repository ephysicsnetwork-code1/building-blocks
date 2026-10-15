import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { allStudents, HANDLE_RE } from "@/lib/school-data";
import { submitParentRequest } from "@/lib/portal.functions";

export function ParentFlow() {
  const submit = useServerFn(submitParentRequest);
  const students = useMemo(() => allStudents(), []);
  const [parentName, setParentName] = useState("");
  const [handle, setHandle] = useState("");
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const matches = query.length >= 2
    ? students.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parentName.trim().length < 3) { toast.error("Enter your full name"); return; }
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle"); return; }
    if (!student) { toast.error("Select your child from the list"); return; }
    setBusy(true);
    try {
      const r = await submit({ data: { parentName, handle, studentName: student } });
      if (r.ok) setDone(true);
      else toast.error("Student not found");
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="text-4xl">⏳</div>
        <h2 className="mt-3 text-xl font-bold">Request submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">The school admin will review your request and contact you on Telegram.</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold">Parent access request</h2>
      <p className="text-xs text-muted-foreground">Parent requests are approved manually by the admin.</p>
      <div>
        <label className="text-sm font-semibold">Your full name</label>
        <input className="field mt-2" value={parentName} onChange={(e) => setParentName(e.target.value)} maxLength={120} />
      </div>
      <div>
        <label className="text-sm font-semibold">Your Telegram handle</label>
        <input className="field mt-2" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} placeholder="@username" />
      </div>
      <div>
        <label className="text-sm font-semibold">Your child's name</label>
        {student ? (
          <div className="mt-2 flex items-center justify-between rounded-xl border p-3 text-sm">
            <span className="text-primary">{student}</span>
            <button type="button" className="text-xs text-muted-foreground" onClick={() => { setStudent(""); setQuery(""); }}>Change</button>
          </div>
        ) : (
          <>
            <input className="field mt-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type at least 2 letters…" />
            {matches.length > 0 && (
              <div className="mt-2 space-y-1 rounded-xl border p-1">
                {matches.map((s) => (
                  <button type="button" key={s.name} onClick={() => setStudent(s.name)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
                    {s.name} <span className="text-xs text-muted-foreground">· G{s.grade}{s.section}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <button className="btn-glow w-full" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
    </form>
  );
}
