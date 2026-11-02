import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminResumeDeliveryAI } from "@/lib/portal.functions";

export function DeliveryQuestions({ token, notificationId }: { token: string; notificationId: string | null }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const resume = useServerFn(adminResumeDeliveryAI);
  useEffect(() => () => abort.current?.abort(), []);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(""); setAnswer(""); setReasoning("");
    try {
      const response = await fetch("/api/public/admin/delivery-question", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ question, notificationId }), signal: controller.signal });
      if (!response.ok) {
        const failure = await response.json(); setPaused(Boolean(failure.paused));
        throw new Error(failure.message ?? `Lovable AI error (${response.status})`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No answer stream received.");
      const decoder = new TextDecoder(); let pending = "";
      while (true) {
        const chunk = await reader.read();
        pending += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = pending.split("\n"); pending = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "text") setAnswer((v) => v + event.text);
          if (event.type === "reasoning") setReasoning((v) => v + event.text);
          if (event.type === "error") { setError(event.message); setPaused(Boolean(event.paused)); }
        }
        if (chunk.done) break;
      }
    } catch (e) { setError(controller.signal.aborted ? "Stopped. Your partial answer is kept." : e instanceof Error ? e.message : "Could not answer."); }
    finally { setBusy(false); abort.current = null; }
  }
  return <div className="mt-6 border-t pt-5">
    <h3 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="text-primary" size={18} /> Ask about deliveries</h3>
    <form className="flex items-end gap-2" onSubmit={ask}><label className="min-w-0 flex-1 text-sm">{notificationId ? "Question about this message" : "Question about notification history"}<textarea aria-label="Delivery history question" className="field mt-2 min-h-20" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1200} placeholder="Which recipients failed, and why?" /></label>
      {busy ? <Button type="button" variant="icon" size="icon" title="Stop answer" aria-label="Stop answer" onClick={() => abort.current?.abort()}><Square /></Button> : <Button type="submit" size="icon" title="Ask question" aria-label="Ask question" disabled={paused || question.trim().length < 3}><Send /></Button>}</form>
    {busy && <p role="status" className="mt-3 text-sm text-muted-foreground">Checking recorded deliveries…</p>}
    {reasoning && <details className="mt-3 text-xs text-muted-foreground"><summary>Analysis</summary><p className="mt-2 whitespace-pre-wrap">{reasoning}</p></details>}
    {answer && <div className="mt-4 whitespace-pre-wrap break-words text-sm" aria-live="polite">{answer}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {paused && <Button variant="outline" className="mt-3" onClick={async () => { try { await resume({ data: { token } }); setPaused(false); setError(""); } catch { setError("Could not resume AI questions."); } }}>Resume after access is restored</Button>}
  </div>;
}