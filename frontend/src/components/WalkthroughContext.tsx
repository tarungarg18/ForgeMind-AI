"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

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
      "Start here. Drop a plant PDF, Word, Excel, or image. ForgeMind reads it and adds it to the knowledge base.",
  },
  {
    id: "equipment",
    route: "/knowledge",
    target: "tour-equipment",
    title: "Select equipment",
    description:
      "Pick a machine from this list (or the map). Everything below updates for the selected tag — try P-102.",
  },
  {
    id: "history",
    route: "/knowledge",
    target: "tour-history",
    title: "Read history",
    description:
      "This is the equipment timeline. Each row is an event (install, leak, maintenance) with a link to the source document.",
  },
  {
    id: "ask",
    route: "/ai",
    target: "tour-ask",
    title: "Ask a question",
    description:
      "Type a question or use a suggestion. Answers use the selected machine as context so you do not need to repeat the tag.",
  },
  {
    id: "action",
    route: "/ai",
    target: "tour-action",
    title: "Suggested action",
    description:
      "After you ask, the answer and a clear next step show here — risk, impact, sources, and buttons like Approve or Run Simulator.",
  },
  {
    id: "coverage",
    route: "/insights",
    target: "tour-coverage",
    title: "Coverage snapshot",
    description:
      "Insights shows how complete your plant docs are — overall score, missing files, and freshness.",
  },
  {
    id: "issues",
    route: "/insights",
    target: "tour-issues",
    title: "Open issues",
    description:
      "Suggested work, document conflicts (like pressure mismatches), and missing docs appear here so you know what to fix next.",
  },
];

type WalkthroughCtx = {
  active: boolean;
  stepIndex: number;
  step: WalkthroughStep | null;
  total: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  cancel: () => void;
};

const WalkthroughContext = createContext<WalkthroughCtx | null>(null);

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const goToStep = useCallback(
    (index: number) => {
      const step = WALKTHROUGH_STEPS[index];
      if (!step) return;
      setStepIndex(index);
      router.push(step.route);
    },
    [router]
  );

  const start = useCallback(() => {
    setActive(true);
    setStepIndex(0);
    router.push(WALKTHROUGH_STEPS[0].route);
  }, [router]);

  const cancel = useCallback(() => {
    setActive(false);
    setStepIndex(0);
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= WALKTHROUGH_STEPS.length - 1) {
      setActive(false);
      setStepIndex(0);
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
      step: active ? WALKTHROUGH_STEPS[stepIndex] : null,
      total: WALKTHROUGH_STEPS.length,
      start,
      next,
      prev,
      cancel,
    }),
    [active, cancel, next, prev, start, stepIndex]
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
