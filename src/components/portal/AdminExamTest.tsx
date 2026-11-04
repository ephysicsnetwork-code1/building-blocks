import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { adminExamTesters, adminSetExamDeadline } from "@/lib/portal.functions";

type Data = Awaited<ReturnType<typeof adminExamTesters>>;

export function ExamTestPanel({ token }: { token: string }) {
  const get = useServerFn(adminExamTesters);
  const setDl = useServerFn(adminSetExamDeadline);
  const [d, setD] = useState<Data | null>(null);
  const [local, setLocal] = useState("");
  const load = useCallback(() => get({ data: { token } }).then(setD).catch(() => toast.error("Could not load")), [get, token]);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  if (!d) return <p className="text-muted-foreground">Loading…</p>;

  const picked = d.rows.filter((r) => r.selected);
  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4 text-sm">
        <div>Sign-ups: <b>{d.rows.length}</b> (A {d.rows.filter((r) => r.section === "A").length} · B {d.rows.filter((r) => r.section === "B").length} · C {d.rows.filter((r) => r.section === "C").length})</div>
        <div>Deadline: <b>{d.deadline ? new Date(d.deadline).toLocaleString() : "not set — sign-up is closed"}</b></div>
        <div>Status: <b>{d.pickedAt ? `Picked on ${new Date(d.pickedAt).toLocaleString()}` : "Waiting for deadline"}</b></div>
        {!d.pickedAt && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input type="datetime-local" className="field max-w-xs" value={local} onChange={(e) => setLocal(e.target.value)} />
            <Button className="btn-glow" disabled={!local} onClick={async () => {
              try { await setDl({ data: { token, deadline: new Date(local).toISOString() } }); toast.success("Deadline saved"); load(); }
              catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
            }}>Save deadline</Button>
          </div>
        )}
      </div>
      {d.pickedAt && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Picked testers ({picked.length})</h3>
          <List rows={picked} showMsg />
        </div>
      )}
      <div>
        <h3 className="mb-2 text-sm font-semibold">All sign-ups</h3>
        <List rows={d.rows} />
      </div>
    </div>
  );
}

function List({ rows, showMsg }: { rows: Data["rows"]; showMsg?: boolean }) {
  return (
    <div className="max-h-[50vh] overflow-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-popover text-xs uppercase text-muted-foreground">
          <tr><th className="p-2">Name</th><th className="p-2">Section</th><th className="p-2">Telegram</th><th className="p-2">{showMsg ? "Message" : "Signed up"}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.telegram_handle} className="border-t">
              <td className="p-2">{r.full_name}{!showMsg && r.selected && <span className="ml-2 text-success">✓ picked</span>}</td>
              <td className="p-2">12{r.section}</td>
              <td className="p-2">{r.telegram_handle}</td>
              <td className="p-2 text-xs">{showMsg ? (r.notified ? <span className="text-success">Sent</span> : <span className="text-destructive">Not delivered</span>) : new Date(r.signed_up_at).toLocaleString()}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nothing here yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
