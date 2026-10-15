import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
const logo = { url: "/school-logo.jpg" };
import { getPublicSettings } from "@/lib/portal.functions";
import { StudentFlow } from "@/components/portal/StudentFlow";
import { TeacherFlow } from "@/components/portal/TeacherFlow";
import { ParentFlow } from "@/components/portal/ParentFlow";
import { AdminArea } from "@/components/portal/AdminArea";
import { GlassIcon } from "@/components/portal/GlassIcon";
import { GraduationCap, Presentation, Users, ShieldCheck, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Burka Harbu Verification Portal" },
      { name: "description", content: "Verify as a student, teacher or parent of Burka Harbu Special Secondary School to join the official Telegram group." },
      { property: "og:title", content: "Burka Harbu Verification Portal" },
      { property: "og:description", content: "Official secure verification for students, teachers and parents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "student" | "teacher" | "parent" | "admin";
const TABS: { id: Tab; icon: LucideIcon; label: string; hint: string }[] = [
  { id: "student", icon: GraduationCap, label: "Students", hint: "Grade 9–12" },
  { id: "teacher", icon: Presentation, label: "Teachers", hint: "Staff roster" },
  { id: "parent", icon: Users, label: "Parents", hint: "Request access" },
  { id: "admin", icon: ShieldCheck, label: "Admin", hint: "Dashboard" },
];

function Index() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [support, setSupport] = useState("@Spaceanduniverse13");
  const [sections, setSections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getPublicSettings().then((s) => { setSupport(s.support_handle); setSections(s.sections); }).catch(() => {});
  }, []);

  const supportUrl = `https://t.me/${support.replace(/^@/, "")}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
      <Toaster theme="dark" position="top-center" />
      <header className="flex flex-col items-center text-center">
        <img
          src={logo.url}
          alt="Burka Harbu Special Secondary School logo"
          className="glow h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
          draggable={false}
        />
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-4xl">
          Burka Harbu <span className="text-primary">Special Secondary School</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Official Verification Portal</p>
      </header>

      <nav className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`glass rounded-2xl p-4 text-left transition hover:-translate-y-0.5 ${tab === t.id ? "glow" : ""}`}
          >
            <GlassIcon icon={t.icon} />
            <div className="mt-2 font-display font-bold">{t.label}</div>
            <div className="text-xs text-muted-foreground">{t.hint}</div>
          </button>
        ))}
      </nav>

      <main className="mt-6 flex-1">
        {tab === null && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            Choose who you are above to begin verification.
          </div>
        )}
        {tab === "student" && <StudentFlow key="s" sections={sections} supportUrl={supportUrl} support={support} />}
        {tab === "teacher" && <TeacherFlow key="t" supportUrl={supportUrl} support={support} />}
        {tab === "parent" && <ParentFlow key="p" supportUrl={supportUrl} support={support} />}
        {tab === "admin" && <AdminArea key="a" onClose={() => setTab(null)} />}
      </main>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Need help?{" "}
        <a href={supportUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Contact us
        </a>
      </footer>
    </div>
  );
}
