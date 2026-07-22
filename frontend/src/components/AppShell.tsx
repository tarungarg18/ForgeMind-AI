"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Brain,
  Factory,
  LayoutDashboard,
  Upload,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/knowledge", label: "Knowledge Base", icon: Factory },
  { href: "/ai", label: "ForgeMind AI", icon: Sparkles },
  { href: "/insights", label: "Insights", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<number | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [openNotes, setOpenNotes] = useState(false);

  useEffect(() => {
    api.knowledgeHealth().then((h) => setHealth(h.knowledge_health)).catch(() => {});
    api.notifications().then(setNotes).catch(() => {});
  }, [pathname]);

  return (
    <div className="min-h-screen text-[var(--fg)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(14,116,144,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(180,83,9,0.12),_transparent_45%),linear-gradient(160deg,#07111a_0%,#0b1724_45%,#102033_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-3">
          <Link href="/knowledge" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-600/20 ring-1 ring-cyan-400/40">
              <Brain className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="leading-tight">
              <div className="font-[family-name:var(--font-display)] text-lg tracking-tight text-white">
                ForgeMind AI
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">
                Industrial Knowledge Intelligence
              </div>
            </div>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {health !== null && (
              <div className="hidden items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 sm:flex">
                <span className="text-[11px] uppercase tracking-wider text-emerald-200/80">
                  Knowledge Health
                </span>
                <span className="font-[family-name:var(--font-display)] text-lg text-emerald-300">
                  {health}%
                </span>
              </div>
            )}
            <button
              onClick={() => setOpenNotes((v) => !v)}
              className="relative rounded-md border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"
            >
              <Bell className="h-4 w-4" />
              {notes.length > 0 && (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] leading-4 text-black">
                  {notes.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {openNotes && (
          <div className="border-t border-white/10 bg-[#0a1624] px-5 py-3">
            <div className="mx-auto max-w-[1400px] space-y-2">
              {notes.slice(0, 5).map((n) => (
                <div key={n.id} className="text-sm text-slate-300">
                  <span className="mr-2 text-amber-300">{n.type}</span>
                  {n.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">{children}</main>
    </div>
  );
}
