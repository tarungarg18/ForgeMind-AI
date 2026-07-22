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
        if (tries < 30) window.setTimeout(measure, 100);
        else setRect(null);
        return;
      }

      // Keep target on screen, then measure viewport coords (for position: fixed)
      const r0 = el.getBoundingClientRect();
      const margin = 24;
      if (r0.top < margin || r0.bottom > window.innerHeight - margin) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }

      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top,
          left: r.left,
          width: Math.max(r.width, 48),
          height: Math.max(r.height, 48),
        });
      });
    }

    const t = window.setTimeout(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step, pathname, stepIndex]);

  if (!active || !step) return null;

  const pad = 12;
  const hole = rect
    ? {
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const isLast = stepIndex >= total - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* Dim overlay with a clear hole — content stays visible */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="fm-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole && (
              <rect
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.35)"
          mask="url(#fm-tour-mask)"
        />
      </svg>

      {hole && (
        <div
          className="absolute rounded-xl border-2 border-teal-500"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.25)",
          }}
        />
      )}

      {/* Always-visible control dock — cannot “lose” the tour while scrolling */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-[70] border-t border-gray-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-teal-800">
              Step {stepIndex + 1} of {total}
            </div>
            <h3 className="mt-1 text-base font-semibold text-gray-900">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.description}</p>
            {!hole && (
              <p className="mt-2 text-xs text-amber-700">
                Looking for this section on the page…
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
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
    </div>
  );
}
