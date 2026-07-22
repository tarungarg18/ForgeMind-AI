"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="fm-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[color:var(--surface-2)]"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-950">{title}</h2>
            {badge ? (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-[color:var(--border)]">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? <div className="border-t border-[color:var(--border)] p-5">{children}</div> : null}
    </section>
  );
}
