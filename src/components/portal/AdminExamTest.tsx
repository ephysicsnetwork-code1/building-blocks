import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { adminExamTesters, adminSetExamDeadline, adminSetExamBenefits, adminSetExamMode, adminRemoveExamTester, adminResetExamPick, adminSetExamVisible, adminPickExamTesters } from "@/lib/portal.functions";
import { RotateCcw, Lock, Unlock, Timer, Eye, EyeOff, UserCheck } from "lucide-react";

type Data = Awaited<ReturnType<typeof adminExamTesters>>;

export function ExamTestPanel({ token }: { token: string }) {
  const get = useServerFn(adminExamTesters);
  const setDl = useServerFn(adminSetExamDeadline);
  const [d, setD] = useState<Data | null>(null);
  const [local, setLocal] = useState("");
  const setBen = useServerFn(adminSetExamBenefits);
  const [ben, setBenText] = useState<string | null>(null);
  const setMode = useServerFn(adminSetExamMode);
  const removeT = useServerFn(adminRemoveExamTester);
  const resetPick = useServerFn(adminResetExamPick);
  const setVisible = useServerFn(adminSetExamVisible);
  const pickManual = useServerFn(adminPickExamTesters);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast.success(msg); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } };
  const load = useCallback(() => get({ data: { token } }).then(setD).catch(() => toast.error("Could not load")), [get, token]);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  if (!d) return <p className="text-muted-foreground">Loading…</p>;

  const picked = d.rows.filter((r) => r.selected);
  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4 text-sm">
        <div>Sign-ups: <b>{d.rows.length}</b> (A {d.rows.filter((r) => r.section === "A").length} · B {d.rows.filter((r) => r.section === "B").length} · C {d.rows.filter((r) => r.section === "C").length})</div>
        <div>Deadline: <b>{d.deadline ? new Date(d.deadline).toLocaleString() : "not set — sign-up is closed"}</b></div>
        <div>Status: <b>{d.pickedAt ? `Picked on ${new Date(d.pickedAt).toLocaleString()}` : d.mode === "open" ? "Open (manual)" : d.mode === "closed" ? "Closed (manual)" : "Automatic — open until deadline"}</b></div>
        <div className="mt-3 inline-flex flex-wrap gap-1 rounded-xl border p-1">
          {([["auto", Timer, "Automatic"], ["open", Unlock, "Open now"], ["closed", Lock, "Close now"]] as const).map(([m, Icon, label]) => (
            <Button key={m} size="sm" variant={d.mode === m ? "default" : "ghost"} className="gap-1.5" onClick={() => act(() => setMode({ data: { token, mode: m } }), `Registration: ${label}`)}><Icon size={15} /> {label}</Button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Automatic opens sign-up and picks 15 at the deadline. Open/Close now override it manually.</p>
        <div className="mt-3">
          <Button size="sm" variant="ghost" className="gap-1.5 border border-border" onClick={() => act(() => setVisible({ data: { token, visible: !d.visible } }), d.visible ? "Exam test tab hidden from the home page" : "Exam test tab shown on the home page")}>
            {d.visible ? <><EyeOff size={15} /> Hide from home page</> : <><Eye size={15} /> Show on home page</>}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">Currently {d.visible ? "visible" : "hidden"} to users. Hiding does not close sign-up — students with the link can still sign up.</p>
        </div>
        {d.pickedAt && <Button variant="ghost" className="mt-3 gap-1.5 border border-border text-warning hover:bg-warning/10" onClick={() => confirm("Clear the current pick so a new deadline can pick again? Sign-ups are kept.") && act(() => resetPick({ data: { token } }), "Pick cleared")}><RotateCcw size={15} /> Reset pick</Button>}
        {!d.pickedAt && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input type="datetime-local" className="field max-w-xs" value={local} onChange={(e) => setLocal(e.target.value)} />
            <Button className="btn-glow" disabled={!local} onClick={async () => {
              try { await setDl({ data: { token, deadline: new Date(local).toISOString() } }); toast.success("Deadline saved"); load(); }
              catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
            }}>{d.deadline ? "Change schedule" : "Save deadline"}</Button>
          </div>
        )}
      </div>
      <div className="rounded-xl border p-4 text-sm">
        <label className="font-semibold" htmlFor="benefits">Benefits (one per line)</label>
        <p className="text-xs text-muted-foreground">Shown on the sign-up page and in the message picked students receive.</p>
        <textarea id="benefits" className="field mt-2 min-h-28" value={ben ?? d.benefits.join("\n")} onChange={(e) => setBenText(e.target.value)} />
        <Button className="btn-glow mt-2" disabled={ben === null} onClick={async () => {
          const list = (ben ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
          if (!list.length) { toast.error("Add at least one benefit"); return; }
          try { await setBen({ data: { token, benefits: list } }); toast.success("Benefits saved"); setBenText(null); load(); }
          catch { toast.error("Each benefit must be under 200 characters, max 10"); }
        }}>Save benefits</Button>
      </div>
      {d.pickedAt && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Picked testers ({picked.length})</h3>
          <List rows={picked} showMsg onRemove={(h) => act(() => removeT({ data: { token, handle: h } }), "Sign-up removed")} />
        </div>
      )}
      <div>
        <h3 className="mb-2 text-sm font-semibold">All sign-ups</h3>
        {!d.pickedAt && d.rows.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button size="sm" className="btn-glow gap-1.5" disabled={chosen.size === 0} onClick={() => {
              if (!confirm(`Pick ${chosen.size} student(s) and send each one the congratulations message? This closes the sign-up.`)) return;
              act(async () => {
                const r = await pickManual({ data: { token, handles: [...chosen] } });
                setChosen(new Set());
                toast.success(`Picked ${r.picked} · message sent to ${r.sent}${r.failed ? ` · ${r.failed} not delivered` : ""}`);
              }, "Picked");
            }}><UserCheck size={15} /> Pick selected ({chosen.size}) &amp; send messages</Button>
            <p className="text-xs text-muted-foreground">Tick students below to pick them yourself instead of waiting for the deadline.</p>
          </div>
        )}
        <List rows={d.rows} selectable={!d.pickedAt} chosen={chosen} onToggle={(h) => setChosen((s) => { const n = new Set(s); n.has(h) ? n.delete(h) : n.add(h); return n; })} onRemove={(h) => act(() => removeT({ data: { token, handle: h } }), "Sign-up removed")} />
      </div>
    </div>
  );
}

function List({ rows, showMsg, onRemove, selectable, chosen, onToggle }: { rows: Data["rows"]; showMsg?: boolean; onRemove: (h: string) => void; selectable?: boolean; chosen?: Set<string>; onToggle?: (h: string) => void }) {
  return (
    <div className="max-h-[50vh] overflow-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-popover text-xs uppercase text-muted-foreground">
          <tr>{selectable && <th className="p-2"></th>}<th className="p-2">Name</th><th className="p-2">Section</th><th className="p-2">Telegram</th><th className="p-2">{showMsg ? "Message" : "Signed up"}</th><th className="p-2"></th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.telegram_handle} className="border-t">
              {selectable && <td className="p-2"><input type="checkbox" aria-label={`Pick ${r.full_name}`} checked={chosen?.has(r.telegram_handle) ?? false} onChange={() => onToggle?.(r.telegram_handle)} /></td>}
              <td className="p-2">{r.full_name}{!showMsg && r.selected && <span className="ml-2 text-success">✓ picked</span>}</td>
              <td className="p-2">12{r.section}</td>
              <td className="p-2">{r.telegram_handle}</td>
              <td className="p-2 text-xs">{showMsg ? (r.notified ? <span className="text-success">Sent</span> : <span className="text-destructive">Not delivered</span>) : new Date(r.signed_up_at).toLocaleString()}</td>
              <td className="p-2"><Button variant="ghost" size="icon" className="text-warning hover:bg-warning/10" title="Reset sign-up" aria-label="Reset sign-up" onClick={() => confirm(`Remove ${r.full_name}'s sign-up so they can sign up again?`) && onRemove(r.telegram_handle)}><RotateCcw size={15} /></Button></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={selectable ? 6 : 5} className="p-6 text-center text-muted-foreground">Nothing here yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
