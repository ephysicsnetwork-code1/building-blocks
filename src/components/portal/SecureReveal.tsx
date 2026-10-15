import { ShieldX } from "lucide-react";
import { GlassIcon } from "./GlassIcon";
import { useEffect, useState } from "react";

/** Protected link reveal: no selection, no context menu, blocked shortcuts, watermark, blur on background. */
export function SecureReveal({ link, name, handle }: { link: string; name: string; handle: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (
        e.key === "F12" ||
        e.key === "PrintScreen" ||
        (mod && ["s", "u", "p", "c", "a"].includes(k)) ||
        (mod && e.shiftKey && ["i", "j", "c", "s"].includes(k))
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "PrintScreen") setHidden(true);
      }
    };
    const onHide = () => setHidden(true);
    const onVis = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("keydown", keys, true);
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("keydown", keys, true);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const mark = `${name} • ${handle}`;

  return (
    <div className="no-select glass glow relative overflow-hidden rounded-2xl p-6 sm:p-8" onContextMenu={(e) => e.preventDefault()}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -rotate-12 scale-150 opacity-[0.09]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap py-3 font-display text-sm font-bold text-foreground">
            {Array.from({ length: 6 }).map(() => mark).join("     ")}
          </div>
        ))}
      </div>

      <div className={`relative transition duration-200 ${hidden ? "blur-xl opacity-0" : ""}`}>
        <div className="text-sm font-semibold text-success">✓ Verified</div>
        <h2 className="mt-1 text-2xl font-bold">Welcome, {name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This link is personal to {handle}. Do not share it — it is watermarked to you.
        </p>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          className="btn-glow mt-6 w-full text-lg"
        >
          Join the official Telegram group
        </a>
        <p className="mt-4 text-center text-xs text-muted-foreground">Access is recorded. One-time use only.</p>
      </div>

      {hidden && (
        <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground">
          Content hidden for security. Tap here to return.
          <button className="absolute inset-0" onClick={() => setHidden(false)} aria-label="Show content" />
        </div>
      )}
    </div>
  );
}

export function ErrorCard({ title, text, supportUrl, support }: { title: string; text: string; supportUrl: string; support: string }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <GlassIcon icon={ShieldX} size="lg" />
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <a href={supportUrl} target="_blank" rel="noreferrer" className="btn-glow mt-6">
        Contact {support}
      </a>
    </div>
  );
}
