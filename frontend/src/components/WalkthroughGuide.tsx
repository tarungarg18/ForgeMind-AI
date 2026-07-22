"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useWalkthrough } from "@/components/WalkthroughContext";

type Rect = { top: number; left: number; width: number; height: number };

export function WalkthroughGuide() {
  const { active, step, stepIndex, total, next, prev, cancel } = useWalkthrough();
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let tries = 0;

    function measure() {
      if (cancelled || !step) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!el) {
        tries += 1;
        if (tries < 25) window.setTimeout(measure, 120);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: Math.max(r.width, 40),
        height: Math.max(r.height, 40),
      });
    }

    const t = window.setTimeout(measure, 180);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, step, pathname, stepIndex]);

  if (!active || !step) return null;

  const pad = 10;
  const highlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const isLast = stepIndex >= total - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const sy = typeof window !== "undefined" ? window.scrollY : 0;

  let tooltipTop = sy + 100;
  let tooltipLeft = 24;
  if (highlight) {
    const below = highlight.top + highlight.height + 16;
    const above = highlight.top - 200;
    tooltipTop = below + 200 < sy + vh ? below : Math.max(sy + 16, above);
    tooltipLeft = Math.max(16, Math.min(highlight.left, vw - 360));
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Click outside to cancel; dimming comes from spotlight shadow */}
      <button
        type="button"
        aria-label="Cancel walkthrough"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={cancel}
      />

      {highlight ? (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-teal-500"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
            zIndex: 61,
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-slate-900/50" />
      )}

      <div
        className="absolute z-[62] w-[min(100%-2rem,22rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-teal-800">
            Step {stepIndex + 1} of {total}
          </div>
          <button
            type="button"
            onClick={cancel}
            className="text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
        <h3 className="mt-2 text-base font-semibold text-gray-900">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={stepIndex === 0}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            {isLast ? "Finish" : "Next step"}
          </button>
        </div>
      </div>
    </div>
  );
}
