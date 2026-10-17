import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Hourglass, Send, RefreshCw } from "lucide-react";
import { HANDLE_RE, normalizeHandle } from "@/lib/school-constants";
import { submitParentRequest, getParentStatus } from "@/lib/portal.functions";
import { GlassIcon } from "./GlassIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getTelegramInitData } from "@/lib/parent-telegram";

const KEY = "bh_parent_handle";
const RECEIPT_KEY = "bh_parent_receipt";
const RETURN_HOURS = 18;
type Phase = "checking" | "form" | "pending" | "approved" | "error" | "lookup";

export function ParentFlow({ supportUrl, support }: { supportUrl: string; support: string }) {
  const submit = useServerFn(submitParentRequest);
  const status = useServerFn(getParentStatus);
  const [phase, setPhase] = useState<Phase>("checking");
  const [link, setLink] = useState<string | null>(null);
  const [parentName, setParentName] = useState("");
  const [handle, setHandle] = useState("");
  const [student, setStudent] = useState("");
  const [busy, setBusy] = useState(false);
  const [showStart, setShowStart] = useState(false);

  async function checkStatus(saved?: string | null) {
    const stored = saved ?? localStorage.getItem(KEY);
    const receipt = localStorage.getItem(RECEIPT_KEY);
    const initData = getTelegramInitData();
    if (!stored && !receipt && !initData) { setPhase("form"); return; }
    try {
      const r = await status({ data: { ...(stored ? { handle: stored } : {}), ...(receipt ? { receipt } : {}), ...(initData ? { initData } : {}) } });
      setLink(r.link);
      if (r.status === "approved") setPhase("approved");
      else if (r.status === "pending") setPhase("pending");
      else setPhase("form");
    } catch { setPhase("error"); }
  }

  useEffect(() => {
    void checkStatus();
    const refresh = () => { void checkStatus(); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [status]);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle"); return; }
    setBusy(true);
    localStorage.setItem(KEY, normalizeHandle(handle));
    await checkStatus(normalizeHandle(handle));
    setBusy(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parentName.trim().length < 3) { toast.error("Enter your full name"); return; }
    if (!HANDLE_RE.test(handle.trim())) { toast.error("Enter a valid Telegram handle"); return; }
    if (student.trim().length < 2) { toast.error("Type your child's full name"); return; }
    setBusy(true);
    try {
      const r = await submit({ data: { parentName, handle, studentName: student } });
      if (!r.ok) {
        toast.error(r.reason === "handle_is_student"
          ? "This Telegram username is already registered as a student. Parents must use their own account."
          : "We couldn't find that student. Check the spelling of the full name.");
        return;
      }
      localStorage.setItem(KEY, normalizeHandle(handle));
      if ("receipt" in r && r.receipt) localStorage.setItem(RECEIPT_KEY, r.receipt);
      if (r.status === "approved") { await checkStatus(normalizeHandle(handle)); }
      else { setPhase("pending"); setShowStart(true); }
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "checking")
    return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Checking your request…</div>;

  if (phase === "approved")
    return (
      <div className="glass glow rounded-2xl p-8 text-center">
        <GlassIcon icon={Send} size="lg" />
        <h2 className="mt-4 text-xl font-bold">Your request is approved</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your parent access has been approved by the school admin. You can now join the group.</p>
        {link ? (
          <Button asChild className="mt-6"><a href={link} target="_blank" rel="noreferrer">Join the Telegram group</a></Button>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">Open the portal from @BHSSS_Verification_bot to verify your Telegram account and view your access link.</p>

          </>
        )}
      </div>
    );

  if (phase === "pending")
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <GlassIcon icon={Hourglass} size="lg" />
        <h2 className="mt-4 text-xl font-bold">Request under review</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your request is pending admin approval. Please come back after {RETURN_HOURS} hours to check your status.</p>
        <Button variant="outline" className="mt-6" onClick={() => { void checkStatus(); }}><RefreshCw />Check status</Button>
        <Dialog open={showStart} onOpenChange={setShowStart}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
            <DialogTitle>Request submitted</DialogTitle>
            <DialogDescription className="space-y-4" asChild>
              <div>
                <p>Your request is pending admin approval.</p>
                <p>Please come back after {RETURN_HOURS} hours to check your status.</p>
              </div>
            </DialogDescription>
            <Button onClick={() => setShowStart(false)}>OK</Button>
          </DialogContent>
        </Dialog>
      </div>
    );

  if (phase === "error") return (
    <div className="glass rounded-2xl p-8 text-center">
      <h2 className="text-xl font-bold">Could not check your request</h2>
      <p className="mt-2 text-sm text-muted-foreground">Your saved request is still here. Please try again.</p>
      <Button className="mt-6" onClick={() => { void checkStatus(); }}><RefreshCw />Try again</Button>
    </div>
  );

  if (phase === "lookup") return (
    <form onSubmit={onLookup} className="glass space-y-4 rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold">Check your request</h2>
      <label htmlFor="parent-status-handle" className="text-sm font-semibold">Your Telegram handle</label>
      <input id="parent-status-handle" className="field" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} placeholder="@username" />
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Checking…" : "Check status"}</Button>
    </form>
  );

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold">Parent access request</h2>
      <p className="text-xs text-muted-foreground">Parent requests are approved manually by the admin.</p>
      <div>
        <label htmlFor="parent-name" className="text-sm font-semibold">Your full name</label>
        <input id="parent-name" className="field mt-2" value={parentName} onChange={(e) => setParentName(e.target.value)} maxLength={120} />
      </div>
      <div>
        <label htmlFor="parent-handle" className="text-sm font-semibold">Your Telegram handle</label>
        <input id="parent-handle" className="field mt-2" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={33} placeholder="@username" />
      </div>
      <div>
        <label htmlFor="parent-student" className="text-sm font-semibold">Your child's full name</label>
        <input id="parent-student" className="field mt-2" value={student} onChange={(e) => setStudent(e.target.value)} maxLength={120} placeholder="As registered at school" autoComplete="off" />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</Button>
      <Button type="button" variant="ghost" className="w-full" onClick={() => setPhase("lookup")}>Already requested? Check status</Button>
    </form>
  );
}
