"use client";

import { useEffect, useState } from "react";
import { useWalkthrough } from "@/components/WalkthroughContext";

type Rect = { top: number; left: number; width: number; height: number };

const DOCK_H = 148;
const PAD = 10;

export function WalkthroughGuide() {
  const { active, step, stepIndex, total, routeReady, next, prev, cancel } =
    useWalkthrough();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !step || !routeReady) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let tries = 0;
    let timer: number | undefined;

    function measure() {
      if (cancelled || !step) return;
      const el = document.querySelector(
        `[data-tour="${step.target}"]`
      ) as HTMLElement | null;

      if (!el) {
        tries += 1;
        if (tries < 50) {
          timer = window.setTimeout(measure, 80);
        } else {
          setRect(null);
        }
        return;
      }

      const availableBottom = window.innerHeight - DOCK_H - 12;
      const r0 = el.getBoundingClientRect();
      const needsScroll =
        r0.top < 16 ||
        r0.bottom > availableBottom ||
        r0.height > availableBottom - 16;

      if (needsScroll) {
        // Keep the target in the clear area above the dock
        const y =
          window.scrollY +
          r0.top -
          Math.max(24, (availableBottom - Math.min(r0.height, availableBottom - 24)) / 2);
        window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
      }

      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const r = el.getBoundingClientRect();
        const top = Math.max(8, r.top - PAD);
        const left = Math.max(8, r.left - PAD);
        const maxBottom = window.innerHeight - DOCK_H - 8;
        const rawBottom = Math.min(r.bottom + PAD, maxBottom);
        const height = Math.max(40, rawBottom - top);
        const width = Math.min(
          Math.max(r.width + PAD * 2, 48),
          window.innerWidth - left - 8
        );

        setRect({ top, left, width, height });
      });
    }

    timer = window.setTimeout(measure, 100);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step, stepIndex, routeReady]);

  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    // Allow scroll so tall targets can be brought into view; lock only horizontal jank
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overflowX = "";
    };
  }, [active]);

  if (!active || !step) return null;

  const isLast = stepIndex >= total - 1;
  const hole = rect;

  return (
    <div className="fixed inset-0 z-[60]" data-testid="walkthrough-root">
      {/* Four-panel dim so the hole stays clickable and fully visible */}
      {hole ? (
        <>
          <div
            className="absolute bg-slate-900/35"
            style={{ top: 0, left: 0, right: 0, height: hole.top }}
            aria-hidden
          />
          <div
            className="absolute bg-slate-900/35"
            style={{
              top: hole.top,
              left: 0,
              width: hole.left,
              height: hole.height,
            }}
            aria-hidden
          />
          <div
            className="absolute bg-slate-900/35"
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              right: 0,
              height: hole.height,
            }}
            aria-hidden
          />
          <div
            className="absolute bg-slate-900/35"
            style={{
              top: hole.top + hole.height,
              left: 0,
              right: 0,
              bottom: DOCK_H,
            }}
            aria-hidden
          />
          <div
            data-testid="walkthrough-highlight"
            className="pointer-events-none absolute rounded-xl border-2 border-teal-600"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              boxShadow: "0 0 0 1px rgba(13,148,136,0.25)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bottom-[148px] bg-slate-900/25" aria-hidden />
      )}

      <div
        data-testid="walkthrough-dock"
        className="absolute inset-x-0 bottom-0 z-[70] border-t border-gray-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div
              className="text-xs font-semibold text-teal-800"
              data-testid="walkthrough-step-label"
            >
              Step {stepIndex + 1} of {total}
            </div>
            <h3 className="mt-1 text-base font-semibold text-gray-900">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.description}</p>
            {!routeReady || !hole ? (
              <p className="mt-2 text-xs text-amber-700" data-testid="walkthrough-loading">
                Loading this step…
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              data-testid="walkthrough-cancel"
              onClick={cancel}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="walkthrough-prev"
              onClick={prev}
              disabled={stepIndex === 0}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              data-testid="walkthrough-next"
              onClick={next}
              className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
