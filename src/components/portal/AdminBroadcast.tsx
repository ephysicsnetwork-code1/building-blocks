import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminBotStats, adminBroadcast } from "@/lib/portal.functions";

type Stats = Awaited<ReturnType<typeof adminBotStats>>;

export function BroadcastPanel({ token }: { token: string }) {
  const getStats = useServerFn(adminBotStats);
  const send = useServerFn(adminBroadcast);
  const [stats, setStats] = useState<Stats | null>(null);
  const [text, setText] = useState("");
  const [withButton, setWithButton] = useState(true);
  const [target, setTarget] = useState<"all" | "some">("all");
  const [handlesText, setHandlesText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const tick = () => getStats({ data: { token } }).then((s) => { if (active) setStats(s); }).catch(() => {});
    tick();
    const id = setInterval(tick, 5000);
    return () => { active = false; clearInterval(id); };
  }, [getStats, token]);

  return <section className="space-y-5">
    <div className="grid grid-cols-2 gap-3 text-center">
      <div className="rounded-xl border bg-secondary p-4">
        <div className="flex items-center justify-center gap-2 font-display text-3xl font-bold text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden />{stats?.total ?? "…"}
        </div>
        <div className="text-xs text-muted-foreground">Bot users (live)</div>
      </div>
      <div className="rounded-xl border bg-secondary p-4">
        <div className="font-display text-3xl font-bold text-primary">{stats?.today ?? "…"}</div>
        <div className="text-xs text-muted-foreground">New in last 24h</div>
      </div>
    </div>
    {stats && stats.latest.length > 0 && <div className="text-sm">
      <p className="mb-1 text-xs text-muted-foreground">Newest users</p>
      <ul className="space-y-1">{stats.latest.map((u, i) => <li key={i}>{u.first_name ?? "User"} {u.username ? `· @${u.username}` : ""} <span className="text-xs text-muted-foreground">· {new Date(u.first_seen).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa", dateStyle: "medium", timeStyle: "short" })}</span></li>)}</ul>
    </div>}
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault();
      const handles = handlesText.split(/[\s,]+/).map((h) => h.trim()).filter(Boolean);
      if (target === "some" && !handles.length) { toast.error("Add at least one Telegram username"); return; }
      if (!confirm(target === "all" ? `Send this message to all ${stats?.total ?? ""} bot users?` : `Send this message privately to ${handles.length} chosen user(s)?`)) return;
      setBusy(true);
      try {
        const r = await send({ data: { token, text, withButton, ...(target === "some" ? { handles } : {}) } });
        toast.success(`Sent to ${r.sent} of ${r.total} users${r.failed ? ` · ${r.failed} failed or blocked` : ""}${r.notFound?.length ? ` · ${r.notFound.length} not found (never pressed /start): ${r.notFound.join(", ")}` : ""}`, { duration: 8000 });
        setText("");
      } catch { toast.error("Could not send the message"); } finally { setBusy(false); }
    }}>
      <h3 className="font-semibold">Message bot users</h3>
      <div className="inline-flex gap-1 rounded-xl border p-1">
        <Button type="button" size="sm" variant={target === "all" ? "default" : "ghost"} onClick={() => setTarget("all")}>Everyone</Button>
        <Button type="button" size="sm" variant={target === "some" ? "default" : "ghost"} onClick={() => setTarget("some")}>Chosen users</Button>
      </div>
      {target === "some" && (
        <textarea className="field min-h-20" aria-label="Telegram usernames" placeholder={"Telegram usernames, separated by commas or new lines\nExample: @user1, @user2"} value={handlesText} onChange={(e) => setHandlesText(e.target.value)} />
      )}
      <textarea className="field min-h-32" aria-label="Message" placeholder="Write your message…" maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={withButton} onChange={(e) => setWithButton(e.target.checked)} /> Add "Open verification portal" button</label>
      <Button type="submit" className="btn-glow" disabled={busy || !text.trim()}><Send size={16} /> {busy ? "Sending… keep this open" : target === "all" ? "Send to everyone" : "Send privately"}</Button>
      <p className="text-xs text-muted-foreground">{target === "some" ? "Only users who have pressed /start in the bot can be reached." : "Results appear in the Notifications tab."}</p>
    </form>
  </section>;
}
