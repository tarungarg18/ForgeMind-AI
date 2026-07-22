"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Factory,
  LayoutDashboard,
  MessageSquare,
  Upload,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/upload", label: "Upload", hint: "Add documents", icon: Upload },
  { href: "/knowledge", label: "Knowledge", hint: "Map & history", icon: Factory },
  { href: "/ai", label: "Ask AI", hint: "Questions", icon: MessageSquare },
  { href: "/insights", label: "Insights", hint: "Overview", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<number | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [openNotes, setOpenNotes] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.knowledgeHealth().then((h) => setHealth(h.knowledge_health)).catch(() => {});
    api.notifications().then(setNotes).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenNotes(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-20 flex h-screen w-52 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
          <div className="border-b border-gray-200 px-4 py-5">
            <Link href="/knowledge" className="block">
              <div className="text-base font-semibold text-gray-900">ForgeMind AI</div>
              <div className="mt-1 text-xs text-gray-500">Plant docs assistant</div>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-3 transition",
                    active
                      ? "bg-white text-teal-800 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <div className="mt-0.5 pl-6 text-xs text-gray-500">{item.hint}</div>
                </Link>
              );
            })}
          </nav>

          <div className="relative border-t border-gray-200 p-3">
            {health !== null && (
              <div className="mb-3 rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                <div className="text-xs text-gray-500">Doc coverage</div>
                <div className="text-lg font-semibold text-teal-800">{health}%</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpenNotes((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition",
                openNotes
                  ? "bg-white text-gray-900 ring-1 ring-gray-200"
                  : "text-gray-600 hover:bg-white"
              )}
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </span>
              {notes.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {notes.length}
                </span>
              )}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-8">{children}</main>
        </div>
      </div>

      {/* Floating alerts panel — slides in from the right */}
      {openNotes && (
        <>
          <button
            type="button"
            aria-label="Close alerts"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpenNotes(false)}
          />
          <div
            ref={panelRef}
            className="fm-slide-panel fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Alerts</div>
                <div className="text-xs text-gray-500">{notes.length} items</div>
              </div>
              <button
                type="button"
                onClick={() => setOpenNotes(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {notes.length === 0 && (
                <p className="text-sm text-gray-500">No alerts right now.</p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {n.type}
                  </div>
                  <div className="mt-1 text-sm text-gray-800">{n.message}</div>
                  {n.ts && n.ts !== "now" && (
                    <div className="mt-2 text-xs text-gray-400">{n.ts}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
