"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Factory,
  LayoutDashboard,
  MessageSquare,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  {
    href: "/upload",
    label: "1. Upload",
    hint: "Add documents",
    icon: Upload,
  },
  {
    href: "/knowledge",
    label: "2. Knowledge",
    hint: "Map & history",
    icon: Factory,
  },
  {
    href: "/ai",
    label: "3. Ask AI",
    hint: "Questions & actions",
    icon: MessageSquare,
  },
  {
    href: "/insights",
    label: "4. Insights",
    hint: "Gaps & demo",
    icon: LayoutDashboard,
  },
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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
          <div className="border-b border-gray-200 px-4 py-4">
            <Link href="/knowledge" className="block">
              <div className="text-base font-semibold text-gray-900">ForgeMind AI</div>
              <div className="mt-0.5 text-xs text-gray-500">Plant document assistant</div>
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
                    "rounded-lg px-3 py-2.5 transition",
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

          <div className="border-t border-gray-200 p-3">
            {health !== null && (
              <div className="mb-2 rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                <div className="text-xs text-gray-500">Doc coverage</div>
                <div className="text-lg font-semibold text-teal-800">{health}%</div>
              </div>
            )}
            <button
              onClick={() => setOpenNotes((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-white"
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </span>
              {notes.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 text-xs text-amber-800">
                  {notes.length}
                </span>
              )}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {openNotes && (
            <div className="border-b border-gray-200 bg-amber-50 px-6 py-3">
              <div className="mb-1 text-xs font-semibold text-amber-900">Alerts</div>
              <div className="space-y-1">
                {notes.slice(0, 5).map((n) => (
                  <div key={n.id} className="text-sm text-amber-950">
                    <span className="mr-2 font-medium">{n.type}:</span>
                    {n.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
