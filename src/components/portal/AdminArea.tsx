import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  adminLogin, adminGetData, adminUpdateSettings, adminDecideParent, adminResetStudent, adminTestBot, adminUnban, adminResolveAlert,
  adminDeleteParent, adminAddPerson, adminEditPerson, adminRemovePerson, adminResetTeacher, adminResetParent,
} from "@/lib/portal.functions";
import { ShieldCheck, X, ShieldAlert, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { GlassIcon } from "./GlassIcon";

type Data = Awaited<ReturnType<typeof adminGetData>>;
const KEY = "bh_admin_token";

export function AdminArea({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(sessionStorage.getItem(KEY)); }, []);

  if (!token)
    return <LoginModal onClose={onClose} onSuccess={(t) => { sessionStorage.setItem(KEY, t); setToken(t); }} />;
  return <Dashboard token={token} onLogout={() => { sessionStorage.removeItem(KEY); setToken(null); onClose(); }} />;
}

function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (t: string) => void }) {
  const login = useServerFn(adminLogin);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await login({ data: { username: u, password: p } });
      if (r.ok) onSuccess(r.token);
      else if (r.blocked) toast.error("Too many wrong attempts. Admin login is blocked and the admin has been alerted.");
      else toast.error(`Invalid username or password. ${r.remaining} attempt(s) left.`);
    } catch {
      toast.error("Login failed");
    } finally {
      setBusy(false);
      setP("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" role="dialog" aria-modal>
      <form onSubmit={submit} className="glass glow w-full max-w-sm space-y-4 rounded-2xl p-6" autoComplete="off">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-xl font-bold"><GlassIcon icon={ShieldCheck} size="sm" /> Admin login</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground" aria-label="Close"><X size={18} /></button>
        </div>
        <input className="field" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} autoComplete="off" />
        <input className="field" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="new-password" />
        <button className="btn-glow w-full" disabled={busy || !u || !p}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

type View = "security" | "parents" | "students" | "teachers" | "settings";

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const get = useServerFn(adminGetData);
  const save = useServerFn(adminUpdateSettings);
  const decide = useServerFn(adminDecideParent);
  const resetS = useServerFn(adminResetStudent);
  const testBot = useServerFn(adminTestBot);
  const unban = useServerFn(adminUnban);
  const resolve = useServerFn(adminResolveAlert);
  const delParent = useServerFn(adminDeleteParent);
  const resetT = useServerFn(adminResetTeacher);
  const resetPar = useServerFn(adminResetParent);
  const addP = useServerFn(adminAddPerson);
  const editP = useServerFn(adminEditPerson);
  const removeP = useServerFn(adminRemovePerson);
  const [editing, setEditing] = useState<null | { kind: "student" | "teacher"; oldName?: string; name: string; grade: string; section: string; stream: string }>(null);
  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState<View>("security");
  const [settings, setSettings] = useState({ telegram_link: "", support_handle: "", notify_chat_id: "" });
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await get({ data: { token } });
      setData(d);
      setSettings(d.settings);
    } catch {
      toast.error("Session expired. Please sign in again.");
      onLogout();
    }
  }, [get, token, onLogout]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Loading dashboard…</div>;

  const joined = new Map(data.joins.map((j) => [j.full_name, j]));
  const pending = data.parents.filter((p) => p.status === "pending");
  const openAlerts = data.alerts.filter((a) => !a.resolved);
  const banned = data.attempts.filter((a) => a.banned);
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Admin dashboard</h2>
        <button className="btn-ghost text-sm" onClick={onLogout}>Log out</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Stat label="Students joined" value={data.joins.length} />
        <Stat label="Teacher visits" value={data.teacherAccess.length} />
        <Stat label="Pending parents" value={pending.length} />
        <Stat label="Locked names" value={banned.length} />
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto">
        {(["security", "parents", "students", "teachers", "settings"] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`btn-ghost whitespace-nowrap text-sm capitalize ${view === v ? "glow text-primary" : ""}`}>{v}{v === "security" && openAlerts.length > 0 ? ` (${openAlerts.length})` : ""}</button>
        ))}
      </div>

      {openAlerts.length > 0 && view !== "security" && (
        <button onClick={() => setView("security")} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-warning/40 p-3 text-left text-sm">
          <GlassIcon icon={ShieldAlert} size="sm" />
          <span>{openAlerts.length} security alert(s) need review</span>
        </button>
      )}

      <div className="mt-4">
        {view === "security" && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Alerts</h3>
              <Table head={["When", "Alert", ""]}>
                {data.alerts.map((a) => (
                  <tr key={a.id} className={`border-t ${a.resolved ? "opacity-50" : ""}`}>
                    <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="p-2">{a.message}</td>
                    <td className="p-2">{!a.resolved && <button className="text-primary" onClick={() => run(() => resolve({ data: { token, id: a.id } }), "Marked as reviewed")}>Dismiss</button>}</td>
                  </tr>
                ))}
                {data.alerts.length === 0 && <Empty cols={3} />}
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Failed attempts &amp; locked names</h3>
              <Table head={["Name typed", "Failures", "Status", ""]}>
                {data.attempts.map((a) => (
                  <tr key={a.subject} className="border-t">
                    <td className="p-2">{a.display_name}</td>
                    <td className="p-2">{a.failed_count}</td>
                    <td className={`p-2 ${a.banned ? "text-destructive" : "text-warning"}`}>{a.banned ? "Locked" : "Watching"}</td>
                    <td className="p-2">
                      <button className="text-success" onClick={() => run(() => unban({ data: { token, subject: a.subject } }), a.banned ? "Unbanned & re-added" : "Attempts cleared")}>
                        {a.banned ? "Unban / Re-add" : "Clear"}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.attempts.length === 0 && <Empty cols={4} />}
              </Table>
            </div>
          </div>
        )}
        {view === "parents" && (
          <Table head={["Parent", "Handle", "Student", "Status", ""]}>
            {data.parents.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.parent_name}</td>
                <td className="p-2">{p.telegram_handle}</td>
                <td className="p-2">{p.student_name}</td>
                <td className={`p-2 capitalize ${p.status === "approved" ? "text-success" : p.status === "rejected" ? "text-destructive" : "text-warning"}`}>{p.status}</td>
                <td className="p-2 whitespace-nowrap">
                  {p.status === "pending" && (
                    <>
                      <button className="text-success" onClick={async () => {
                        try {
                          const r = await decide({ data: { token, id: p.id, status: "approved" } });
                          if (r.messaged) toast.success("Approved — Telegram approval message sent");
                          else toast.warning(r.messageError ?? "Approval saved, but no Telegram message was sent. Check the parent's Telegram handle.", { duration: 15000 });
                          await load();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Approval failed");
                        }
                      }}>Approve</button>
                      <button className="ml-3 text-destructive" onClick={() => run(() => decide({ data: { token, id: p.id, status: "rejected" } }), "Rejected")}>Reject</button>
                    </>
                  )}
                  {p.status !== "pending" && <button className="ml-3 text-warning" aria-label="Reset" title="Reset to pending" onClick={() => confirm(`Reset ${p.parent_name}'s request to pending?`) && run(() => resetPar({ data: { token, id: p.id } }), "Status reset")}><RotateCcw size={15} /></button>}
                  <button className="ml-3 text-muted-foreground" aria-label="Delete" title="Delete" onClick={() => confirm(`Delete request from ${p.parent_name}?`) && run(() => delParent({ data: { token, id: p.id } }), "Request deleted")}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {data.parents.length === 0 && <Empty cols={5} />}
          </Table>
        )}

        {view === "students" && (
          <>
            <div className="mb-3 flex gap-2">
              <input className="field" placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn-glow flex items-center gap-1 whitespace-nowrap" onClick={() => setEditing({ kind: "student", name: "", grade: "9", section: "A", stream: "" })}><Plus size={16} /> Add</button>
            </div>
            <Table head={["Name", "Class", "Status", "Handle", ""]}>
              {data.students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).map((s) => {
                const j = joined.get(s.name);
                return (
                  <tr key={s.name + s.grade + s.section} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.grade}{s.section}</td>
                    <td className={`p-2 ${j ? "text-success" : "text-muted-foreground"}`}>{j ? "Joined" : "Not joined"}</td>
                    <td className="p-2">{j?.telegram_handle ?? "—"}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <button className="text-primary" title="Edit" aria-label="Edit" onClick={() => setEditing({ kind: "student", oldName: s.name, name: s.name, grade: s.grade, section: s.section, stream: s.stream ?? "" })}><Pencil size={15} /></button>
                        <button className="text-destructive" title="Remove" aria-label="Remove" onClick={() => confirm(`Remove ${s.name} from the roster?`) && run(() => removeP({ data: { token, kind: "student", name: s.name } }), "Student removed")}><Trash2 size={15} /></button>
                        {j && <button className="text-warning" title="Reset join status" aria-label="Reset" onClick={() => confirm(`Reset join status for ${s.name}?`) && run(() => resetS({ data: { token, name: s.name } }), "Status reset")}><RotateCcw size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </>
        )}

        {view === "teachers" && (
          <>
          <div className="mb-3 flex justify-end">
            <button className="btn-glow flex items-center gap-1" onClick={() => setEditing({ kind: "teacher", name: "", grade: "", section: "", stream: "" })}><Plus size={16} /> Add teacher</button>
          </div>
          <Table head={["#", "Official name", "Last verified as", ""]}>
            {data.teachers.map((t, i) => {
              const a = data.teacherAccess.find((x) => x.full_name === t.name);
              return (
                <tr key={t.name} className="border-t">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2">{t.name}</td>
                  <td className="p-2">{a ? `${a.telegram_handle} · ${new Date(a.accessed_at).toLocaleDateString()}` : "—"}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <button className="text-primary" title="Edit" aria-label="Edit" onClick={() => setEditing({ kind: "teacher", oldName: t.name, name: t.name, grade: "", section: "", stream: "" })}><Pencil size={15} /></button>
                      <button className="text-destructive" title="Remove" aria-label="Remove" onClick={() => confirm(`Remove ${t.name} from the staff list?`) && run(() => removeP({ data: { token, kind: "teacher", name: t.name } }), "Teacher removed")}><Trash2 size={15} /></button>
                      {a && <button className="text-warning" title="Reset verification" aria-label="Reset" onClick={() => confirm(`Reset verification for ${t.name}?`) && run(() => resetT({ data: { token, name: t.name } }), "Status reset")}><RotateCcw size={15} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
          </>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" role="dialog" aria-modal>
            <form
              className="glass glow w-full max-w-sm space-y-3 rounded-2xl p-6"
              onSubmit={(e) => {
                e.preventDefault();
                const person = {
                  kind: editing.kind, name: editing.name,
                  ...(editing.kind === "student" ? { grade: editing.grade as "9", section: editing.section, stream: (editing.stream || null) as "Natural" | null } : {}),
                };
                const e2 = editing;
                run(() => e2.oldName ? editP({ data: { token, oldName: e2.oldName, person } }) : addP({ data: { token, person } }), e2.oldName ? "Saved" : "Added").then(() => setEditing(null));
              }}
            >
              <h3 className="text-lg font-bold">{editing.oldName ? "Edit" : "Add"} {editing.kind}</h3>
              <input className="field" placeholder="Full name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              {editing.kind === "student" && (
                <div className="grid grid-cols-3 gap-2">
                  <select className="field" value={editing.grade} onChange={(e) => setEditing({ ...editing, grade: e.target.value })}>
                    {["9", "10", "11", "12"].map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                  <input className="field" placeholder="Section" maxLength={2} value={editing.section} onChange={(e) => setEditing({ ...editing, section: e.target.value.toUpperCase() })} />
                  <select className="field" value={editing.stream} onChange={(e) => setEditing({ ...editing, stream: e.target.value })}>
                    <option value="">No stream</option><option value="Natural">Natural</option><option value="Social">Social</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn-glow flex-1" disabled={editing.name.trim().length < 3}>Save</button>
                <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {view === "settings" && (
          <form
            className="max-w-lg space-y-4"
            onSubmit={(e) => { e.preventDefault(); run(() => save({ data: { token, ...settings } }), "Settings saved"); }}
          >
            <Field label="Telegram group invite link" value={settings.telegram_link} onChange={(v) => setSettings({ ...settings, telegram_link: v })} />
            <Field label="Admin support handle" value={settings.support_handle} onChange={(v) => setSettings({ ...settings, support_handle: v })} />
            <Field label="Bot notification chat ID (optional)" value={settings.notify_chat_id} onChange={(v) => setSettings({ ...settings, notify_chat_id: v })} />
            <div className="flex flex-wrap gap-3">
              <button className="btn-glow">Save settings</button>
              <button type="button" className="btn-ghost" onClick={async () => {
                const r = await testBot({ data: { token } });
                r.ok ? toast.success(r.message) : toast.error(r.message);
              }}>Test Telegram bot</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-secondary p-3">
      <div className="font-display text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="max-h-[60vh] overflow-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-popover text-xs uppercase text-muted-foreground">
          <tr>{head.map((h, i) => <th key={i} className="p-2">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} className="p-6 text-center text-muted-foreground">Nothing here yet.</td></tr>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input className="field mt-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
