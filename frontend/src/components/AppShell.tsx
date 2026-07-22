"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Bell,
  Factory,
  House,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Upload,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useWalkthrough } from "@/components/WalkthroughContext";

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  ts?: string;
};

const nav = [
  { href: "/", label: "Home", icon: House },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/knowledge", label: "Knowledge", icon: Factory },
  { href: "/ai", label: "Ask AI", icon: MessageSquare },
  { href: "/insights", label: "Insights", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { active: tourActive } = useWalkthrough();
  const [health, setHealth] = useState<number | null>(null);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [openNotes, setOpenNotes] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    api
      .knowledgeHealth()
      .then((value: { knowledge_health: number }) => setHealth(value.knowledge_health))
      .catch(() => {});
    api
      .notifications()
      .then((value: NotificationItem[]) => setNotes(value))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenNotes(false);
        setMobileNavOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-20 hidden h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 lg:flex">
          <div className="border-b border-gray-200 px-4 py-4">
            <Link href="/" className="block">
              <div className="text-base font-semibold text-gray-900">ForgeMind AI</div>
              <div className="mt-0.5 text-xs text-gray-500">Plant docs assistant</div>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-white text-teal-800 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 p-3">
            {health !== null ? (
              <div className="mb-2 rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                <div className="text-xs text-gray-500">Doc coverage</div>
                <div className="text-lg font-semibold text-teal-800">{health}%</div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setOpenNotes((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition",
                openNotes ? "bg-white text-gray-900 ring-1 ring-gray-200" : "text-gray-600 hover:bg-white"
              )}
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </span>
              {notes.length > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {notes.length}
                </span>
              ) : null}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="rounded-md border border-gray-200 p-2 text-gray-700"
                aria-label="Menu"
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <Link href="/" className="text-sm font-semibold text-gray-900">
                ForgeMind AI
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setOpenNotes(true)}
              className="relative rounded-md border border-gray-200 p-2 text-gray-700"
              aria-label="Alerts"
            >
              <Bell className="h-4 w-4" />
              {notes.length > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-[10px] leading-4 text-white">
                  {notes.length}
                </span>
              ) : null}
            </button>
          </header>

          {mobileNavOpen ? (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 lg:hidden">
              <nav className="grid gap-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                        active ? "bg-white text-teal-800 ring-1 ring-gray-200" : "text-gray-700"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}

          <main
            className={cn(
              "mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6",
              !tourActive && "pb-24 lg:pb-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>

      {!tourActive ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 py-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[11px] font-medium",
                    active ? "text-teal-800" : "text-gray-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      {openNotes ? (
        <>
          <button
            type="button"
            aria-label="Close alerts"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpenNotes(false)}
          />
          <div className="fm-slide-panel fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Alerts</div>
                <div className="text-xs text-gray-500">{notes.length} items</div>
              </div>
              <button
                type="button"
                onClick={() => setOpenNotes(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500">No alerts right now.</p>
              ) : null}
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {note.type}
                  </div>
                  <div className="mt-1 text-sm text-gray-800">{note.message}</div>
                  {note.ts && note.ts !== "now" ? (
                    <div className="mt-2 text-xs text-gray-400">{note.ts}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
