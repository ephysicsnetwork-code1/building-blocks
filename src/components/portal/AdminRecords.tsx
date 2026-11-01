import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGetRegistrations, adminUpdateGender, adminGetNotificationHistory, adminGetNotificationDeliveries } from "@/lib/portal.functions";
import { genderLabel, type Gender } from "@/lib/admin-record-rules";
import { GenderField } from "./GenderField";

type Registrations = Awaited<ReturnType<typeof adminGetRegistrations>>;
type History = Awaited<ReturnType<typeof adminGetNotificationHistory>>;
type Deliveries = Awaited<ReturnType<typeof adminGetNotificationDeliveries>>;
type Status = "all" | "delivered" | "blocked" | "failed" | "not_started" | "sending";
const date = (v: string) => new Date(v).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa", dateStyle: "medium", timeStyle: "short" });

function Pager({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) {
  return <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
    <span>{total} records · Page {page + 1} of {Math.max(1, Math.ceil(total / size))}</span>
    <div className="flex gap-1"><Button variant="outline" size="icon" title="Previous page" aria-label="Previous page" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft /></Button>
      <Button variant="outline" size="icon" title="Next page" aria-label="Next page" disabled={(page + 1) * size >= total} onClick={() => onChange(page + 1)}><ChevronRight /></Button></div>
  </div>;
}

export function RegistrationHistory({ token }: { token: string }) {
  const get = useServerFn(adminGetRegistrations);
  const save = useServerFn(adminUpdateGender);
  const [data, setData] = useState<Registrations | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Registrations["rows"][number] | null>(null);
  const [gender, setGender] = useState<Gender | "">("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setError("");
      get({ data: { token, q, page } }).then((r) => { if (active) setData(r); }).catch(() => { if (active) setError("Could not load registrations. Try refreshing."); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [get, token, q, page, refresh]);
  return <section>
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">Registrations</h3><Button variant="ghost" size="icon" aria-label="Refresh registrations" title="Refresh registrations" onClick={() => setRefresh((v) => v + 1)}><RefreshCw /></Button></div>
    <input className="field mb-3" aria-label="Search registrations" placeholder="Search name or Telegram username…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
    <p className="mb-2 text-xs text-muted-foreground">Dates: Addis Ababa (UTC+3)</p>
    {error && <p role="alert" className="mb-3 text-destructive">{error}</p>}
    {!data ? <p className="text-muted-foreground">Loading registrations…</p> : <>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-left text-sm"><thead className="bg-secondary"><tr>{["Name", "Telegram", "Registered as", "Gender", "Registered on", ""].map((h, i) => <th key={i} className="p-3">{h}</th>)}</tr></thead><tbody>
        {data.rows.map((r) => <tr className="border-t" key={r.id}><td className="p-3">{r.full_name}</td><td className="p-3">{r.telegram_handle ?? "No username"}</td><td className="p-3 capitalize">{r.kind === "bot" ? "Bot user" : r.kind}</td><td className="p-3">{genderLabel(r.gender)}</td><td className="whitespace-nowrap p-3">{date(r.registered_at)}</td><td className="p-3"><Button variant="ghost" size="icon" aria-label={`Edit profile for ${r.full_name}`} title="Edit profile" onClick={() => { setEditing(r); setGender((r.gender as Gender) || ""); }}><Pencil /></Button></td></tr>)}
        {data.rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No registrations found.</td></tr>}
      </tbody></table></div><Pager page={page} total={data.count} size={50} onChange={setPage} />
    </>}
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Registration profile">
      <form className="w-full max-w-sm space-y-4 rounded-md border bg-popover p-6" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        try { await save({ data: { token, id: editing.id, gender: gender || null } }); setEditing(null); setRefresh((v) => v + 1); toast.success("Profile saved"); }
        catch { toast.error("Could not save profile"); } finally { setBusy(false); }
      }}><h3 className="text-lg font-semibold">{editing.full_name}</h3><p className="text-sm text-muted-foreground">{editing.telegram_handle ?? "No Telegram username"}</p><p className="text-xs text-muted-foreground">Registered {date(editing.registered_at)}</p><GenderField value={gender} onChange={setGender} /><div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div></form>
    </div>}
  </section>;
}

export function NotificationHistory({ token }: { token: string }) {
  const get = useServerFn(adminGetNotificationHistory);
  const getDeliveries = useServerFn(adminGetNotificationDeliveries);
  const [history, setHistory] = useState<History | null>(null);
  const [deliveries, setDeliveries] = useState<Deliveries | null>(null);
  const [selected, setSelected] = useState<History["rows"][number] | null>(null);
  const [page, setPage] = useState(0);
  const [recipientPage, setRecipientPage] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    get({ data: { token, page } }).then((r) => { if (active) { setHistory(r); setError(""); } }).catch(() => { if (active) setError("Could not load notifications."); });
    return () => { active = false; };
  }, [get, token, page, refresh]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const timer = setTimeout(() => getDeliveries({ data: { token, id: selected.id, q, status, page: recipientPage } }).then((r) => { if (active) { setDeliveries(r); setError(""); } }).catch(() => { if (active) setError("Could not load delivery results."); }), 250);
    return () => { active = false; clearTimeout(timer); };
  }, [getDeliveries, token, selected, q, status, recipientPage, refresh]);
  return <section>
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">Notification history</h3><Button variant="ghost" size="icon" title="Refresh notification history" aria-label="Refresh notification history" onClick={() => setRefresh((v) => v + 1)}><RefreshCw /></Button></div>
    {error && <p role="alert" className="mb-3 text-destructive">{error}</p>}
    {selected ? <>
      <Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft /> All messages</Button>
      <p className="my-3 whitespace-pre-wrap break-words text-sm">{selected.message}</p>
      <p className="mb-3 text-xs text-muted-foreground">Last sent {date(selected.last_sent_at)} · Addis Ababa (UTC+3)</p>
      {deliveries && <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">{deliveries.totals.map((t) => <span key={t.status} className={t.status === "delivered" ? "text-success" : t.status === "blocked" || t.status === "failed" ? "text-destructive" : "text-muted-foreground"}>{t.status.replace("_", " ")}: {t.count}</span>)}</div>}
      <div className="mb-3 flex flex-wrap gap-2"><input className="field min-w-0 flex-1" aria-label="Search deliveries" placeholder="Search name or Telegram username…" value={q} onChange={(e) => { setQ(e.target.value); setRecipientPage(0); }} /><select className="field w-auto" aria-label="Delivery status" value={status} onChange={(e) => { setStatus(e.target.value as Status); setRecipientPage(0); }}>{["all", "delivered", "blocked", "failed", "not_started", "sending"].map((s) => <option value={s} key={s}>{s.replace("_", " ")}</option>)}</select></div>
      {!deliveries ? <p>Loading deliveries…</p> : <><div className="overflow-x-auto rounded-md border"><table className="w-full text-left text-sm"><thead className="bg-secondary"><tr>{["User", "Telegram / Chat ID", "Delivery", "When", "Failure reason"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{deliveries.rows.map((d) => <tr key={d.id} className="border-t"><td className="p-3">{d.display_name ?? "—"}</td><td className="p-3">{d.telegram_handle ?? d.chat_id ?? "—"}</td><td className={`p-3 ${d.status === "delivered" ? "text-success" : d.status === "blocked" || d.status === "failed" ? "text-destructive" : "text-warning"}`}>{d.status.replace("_", " ")}</td><td className="whitespace-nowrap p-3">{date(d.attempted_at)}</td><td className="p-3">{d.error_message ?? "—"}{d.error_code ? ` (${d.error_code})` : ""}</td></tr>)}{deliveries.rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No deliveries match.</td></tr>}</tbody></table></div><Pager page={recipientPage} total={deliveries.count} size={50} onChange={setRecipientPage} /></>}
    </> : !history ? <p>Loading notifications…</p> : <>
      <div className="divide-y border-y">{history.rows.map((n) => <div key={n.id} className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="whitespace-pre-wrap break-words text-sm">{n.message}</p><p className="mt-2 text-xs text-muted-foreground">{date(n.last_sent_at)} · Addis Ababa (UTC+3)</p></div><Button variant="outline" className="shrink-0" onClick={() => { setSelected(n); setDeliveries(null); setQ(""); setStatus("all"); setRecipientPage(0); }}>View deliveries</Button></div>)}</div>
      {history.rows.length === 0 && <p className="py-6 text-center text-muted-foreground">No recorded messages yet. Earlier broadcasts have no saved recipient history.</p>}
      <Pager page={page} total={history.count} size={25} onChange={setPage} />
    </>}
  </section>;
}