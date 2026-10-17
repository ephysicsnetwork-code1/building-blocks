import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Hourglass, Send } from "lucide-react";
import { HANDLE_RE, normalizeHandle } from "@/lib/school-constants";
import { submitParentRequest, getParentStatus } from "@/lib/portal.functions";
import { GlassIcon } from "./GlassIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PARENT_BOT_URL, getTelegramInitData, openParentBot } from "@/lib/parent-telegram";

const KEY = "bh_parent_handle";
type Phase = "checking" | "form" | "pending" | "approved";

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

  function onStartBot(e: React.MouseEvent<HTMLAnchorElement>) {
    if (openParentBot()) e.preventDefault();
  }

  // On every visit, if this device submitted before, go straight to the right screen.
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const initData = getTelegramInitData();
    if (!saved && !initData) { setPhase("form"); return; }
    status({ data: { ...(saved ? { handle: saved } : {}), ...(initData ? { initData } : {}) } })
      .then((r) => {
        if (r.status === "approved") { setLink(r.link); setPhase("approved"); }
        else if (r.status === "pending") setPhase("pending");
        else setPhase("form");
      })
      .catch(() => setPhase("form"));
  }, [status]);

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
      if (r.status === "approved") { setLink(r.link); setPhase("approved"); }
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
        <h2 className="mt-4 text-xl font-bold">Join the group</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your parent access has been approved by the school admin.</p>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="btn-glow mt-6">Join the Telegram group</a>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">Open the portal from @BHSSS_Verification_bot to verify your Telegram account and view your access link.</p>
            <Button asChild className="mt-6"><a href={PARENT_BOT_URL} onClick={onStartBot}>🚀 Tap Here to Start Bot</a></Button>
          </>
        )}
      </div>
    );

  if (phase === "pending")
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <GlassIcon icon={Hourglass} size="lg" />
        <h2 className="mt-4 text-xl font-bold">Request under review</h2>
        <p className="mt-2 text-sm text-muted-foreground">The school admin will review your request. Start @BHSSS_Verification_bot now to receive your approval notification.</p>
        <Button asChild className="mt-6"><a href={PARENT_BOT_URL} onClick={onStartBot}>🚀 Tap Here to Start Bot</a></Button>
        <Dialog open={showStart} onOpenChange={setShowStart}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
            <DialogTitle>Request submitted</DialogTitle>
            <DialogDescription className="space-y-4" asChild>
              <div>
                <p>Step 1: Your request is pending admin approval.</p>
                <p>Step 2: You MUST open our Telegram Bot (@BHSSS_Verification_bot) and tap /start right now so the bot can notify you when your status is updated!</p>
              </div>
            </DialogDescription>
            <Button asChild className="h-auto min-h-10 whitespace-normal text-center"><a href={PARENT_BOT_URL} onClick={onStartBot}>🚀 Tap Here to Start Bot</a></Button>
          </DialogContent>
        </Dialog>
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
        <label className="text-sm font-semibold">Your child's full name</label>
        <input className="field mt-2" value={student} onChange={(e) => setStudent(e.target.value)} maxLength={120} placeholder="As registered at school" autoComplete="off" />
      </div>
      <button className="btn-glow w-full" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
    </form>
  );
}
