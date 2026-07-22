"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type WalkthroughStep = {
  id: string;
  route: string;
  target: string;
  title: string;
  description: string;
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "upload",
    route: "/upload",
    target: "tour-upload",
    title: "Upload documents",
    description:
      "Drop a plant PDF, Word, Excel, or image here. ForgeMind processes it into searchable knowledge.",
  },
  {
    id: "equipment",
    route: "/knowledge",
    target: "tour-equipment",
    title: "Select equipment",
    description:
      "Click a machine in this list or on the plant map. History and documents below update for that asset.",
  },
  {
    id: "history",
    route: "/knowledge",
    target: "tour-history",
    title: "Read history",
    description:
      "Each row is an event for the selected machine — install, leak, maintenance — with a link to the source document.",
  },
  {
    id: "ask",
    route: "/ai",
    target: "tour-ask",
    title: "Ask a question",
    description:
      "Ask any plant question here. Include equipment in the text when needed (for example P-102).",
  },
  {
    id: "action",
    route: "/ai",
    target: "tour-action",
    title: "Answer area",
    description:
      "Answers and suggested next steps appear in this section after you ask.",
  },
  {
    id: "coverage",
    route: "/insights",
    target: "tour-coverage",
    title: "Coverage snapshot",
    description:
      "See how complete plant documentation looks — overall score, missing files, freshness.",
  },
  {
    id: "issues",
    route: "/insights",
    target: "tour-issues",
    title: "Open issues",
    description:
      "Recommendations, document conflicts, and missing docs show here.",
  },
];

type WalkthroughCtx = {
  active: boolean;
  stepIndex: number;
  step: WalkthroughStep | null;
  total: number;
  routeReady: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  cancel: () => void;
};

const STORAGE_KEY = "forgemind-walkthrough";

const WalkthroughContext = createContext<WalkthroughCtx | null>(null);

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { active: boolean; stepIndex: number };
      if (parsed.active) {
        setActive(true);
        setStepIndex(Math.min(Math.max(parsed.stepIndex, 0), WALKTHROUGH_STEPS.length - 1));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!active) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ active, stepIndex }));
  }, [active, stepIndex]);

  const step = active ? WALKTHROUGH_STEPS[stepIndex] ?? null : null;
  const routeReady = Boolean(step && pathname === step.route);

  // Keep URL on the active step's route (handles refresh / deep link mid-tour)
  useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.route) {
      router.push(step.route);
    }
  }, [active, step, pathname, router]);

  const goToStep = useCallback(
    (index: number) => {
      const nextStep = WALKTHROUGH_STEPS[index];
      if (!nextStep) return;
      setStepIndex(index);
      if (pathname !== nextStep.route) {
        router.push(nextStep.route);
      }
    },
    [pathname, router]
  );

  const start = useCallback(() => {
    setActive(true);
    setStepIndex(0);
    router.push(WALKTHROUGH_STEPS[0].route);
  }, [router]);

  const cancel = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= WALKTHROUGH_STEPS.length - 1) {
      setActive(false);
      setStepIndex(0);
      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/insights");
      return;
    }
    goToStep(stepIndex + 1);
  }, [goToStep, router, stepIndex]);

  const prev = useCallback(() => {
    if (stepIndex <= 0) return;
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const value = useMemo(
    () => ({
      active,
      stepIndex,
      step,
      total: WALKTHROUGH_STEPS.length,
      routeReady,
      start,
      next,
      prev,
      cancel,
    }),
    [active, cancel, next, prev, routeReady, start, step, stepIndex]
  );

  return (
    <WalkthroughContext.Provider value={value}>{children}</WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) throw new Error("useWalkthrough must be used within WalkthroughProvider");
  return ctx;
}
