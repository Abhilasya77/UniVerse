import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useUniversityScroll } from "./universe-scroll";
import { ConnectionIcon } from "./universe-mark";

const points = [
  [48, 142],
  [177, 74],
  [265, 119],
  [325, 41],
  [452, 88],
  [575, 44],
  [677, 120],
  [752, 74],
  [820, 160],
  [687, 233],
  [504, 199],
  [397, 254],
  [247, 216],
  [123, 255],
] as const;
const shapes: Record<string, string> = {
  overview:
    "M48 142 177 74 265 119 452 88 575 44 677 120 752 74 820 160 M265 119 247 216 123 255 M677 120 687 233 504 199",
  events:
    "M48 142 177 74 265 119 325 41 452 88 575 44 677 120 752 74 820 160 M123 255 247 216 265 119 504 199 677 120 687 233 820 160 M247 216 397 254 504 199",
  calendar: "M177 74 265 119 452 88 677 120 687 233 M123 255 247 216 397 254 687 233",
  care: "M48 142 177 74 265 119 247 216 123 255 M575 44 677 120 752 74 820 160",
  "lost-found": "M48 142 177 74 247 216 397 254 504 199 677 120 820 160 M325 41 452 88 575 44",
  pulse: "M177 74 265 119 452 88 M504 199 687 233 820 160",
};
function Starfield({ scene }: { scene: string }) {
  return (
    <div className="universe-field" data-scene={scene}>
      <svg viewBox="0 0 870 300" preserveAspectRatio="xMidYMid slice" className="universe-sky">
        <path className="universe-lines" d={shapes[scene] ?? shapes["overview"]} />
        {scene === "calendar" && (
          <g className="universe-clock">
            <ellipse cx="455" cy="151" rx="220" ry="91" />
            <ellipse cx="455" cy="151" rx="166" ry="62" />
            <circle cx="675" cy="151" r="4" />
          </g>
        )}
        {points.map(([x, y], i) => (
          <circle
            key={x}
            className={`universe-point ${i % 2 ? "universe-point-extra" : ""}`}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 3.1 : 1.65}
            style={{ animationDelay: `${i * -0.83}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

export function UniverseAtmosphere() {
  const location = useRouterState({ select: (s) => s.location });
  const pending = useRouterState({ select: (s) => s.isLoading });
  const reduce = useReducedMotion();
  const progress = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const search = location.search as { view?: string };
  const scene =
    search.view ??
    (location.pathname === "/" || location.pathname === "/dashboard"
      ? "overview"
      : location.pathname.slice(1));
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    let stopSmooth: (() => void) | undefined;
    let version = 0;
    const sync = async () => {
      const ticket = ++version;
      stopSmooth?.();
      stopSmooth = undefined;
      if (preference.matches || !desktop.matches) return;
      const { default: Lenis } = await import("lenis");
      if (ticket !== version) return;
      const lenis = new Lenis({
        autoRaf: true,
        lerp: 0.19,
        allowNestedScroll: true,
        prevent: (node) => !!node.closest('[role="dialog"], .campus-ring-surface'),
      });
      stopSmooth = () => lenis.destroy();
    };
    const scroll = () => {
      const travel = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0})`;
    };
    let frame = 0;
    let magnetic: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      if (!desktop.matches || preference.matches || e.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const node = cursor.current;
        if (!node) return;
        node.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
        node.dataset["visible"] = "true";
        const control =
          e.target instanceof Element ? e.target.closest<HTMLElement>(".universe-pressable") : null;
        node.dataset["action"] = String(!!control);
        if (magnetic !== control) {
          magnetic?.style.removeProperty("--pull-x");
          magnetic?.style.removeProperty("--pull-y");
          magnetic = control;
        }
        if (control) {
          const bounds = control.getBoundingClientRect();
          control.style.setProperty(
            "--pull-x",
            `${Math.max(-2, Math.min(2, (e.clientX - bounds.left - bounds.width / 2) * 0.045))}px`,
          );
          control.style.setProperty(
            "--pull-y",
            `${Math.max(-2, Math.min(2, (e.clientY - bounds.top - bounds.height / 2) * 0.06))}px`,
          );
        }
      });
    };
    const leave = () => {
      if (cursor.current) cursor.current.dataset["visible"] = "false";
    };
    void sync();
    scroll();
    preference.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    const size = new ResizeObserver(scroll);
    size.observe(document.body);
    return () => {
      version++;
      stopSmooth?.();
      size.disconnect();
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <>
      <div className="universe-atmosphere" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={scene}
            className="universe-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.55 }}
          >
            <Starfield scene={scene} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div aria-hidden="true" className="universe-progress">
        <span ref={progress} />
        {pending && <i />}
      </div>
      <div aria-hidden="true" className="universe-cursor" ref={cursor}>
        <i />
      </div>
    </>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  const scope = useRef<HTMLDivElement>(null);
  useUniversityScroll(scope);
  return (
    <motion.div
      ref={scope}
      className="campus-page universe-page"
      data-exiting={!present}
      inert={!present}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 13 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: reduce ? 0.12 : 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FocusText({ text, accent = false }: { text: string; accent?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || reduce || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduce, text]);
  const words = text.split(/(\s+)/u);
  let order = 0;
  const lastWord = words.length - 1 - [...words].reverse().findIndex((word) => !!word.trim());
  return (
    <span
      className="universe-focus"
      data-focus={ready}
      data-long={text.trim().split(/\s+/u).length > 8}
      ref={ref}
      aria-label={text}
    >
      {words.map((word, i) =>
        !word.trim() ? (
          word
        ) : (
          <span
            key={i}
            className={`universe-word ${accent && i === lastWord ? "universe-emphasis" : ""}`}
          >
            {Array.from(word).map((letter, j) => (
              <span
                className="universe-letter"
                key={j}
                style={{ animationDelay: `${Math.min(order++, 22) * 27}ms` }}
              >
                {letter}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  );
}

export function CountUp({ value, digits = 0 }: { value: number; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || reduce || !window.IntersectionObserver) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / 420, 1);
        setShown(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, reduce]);
  const actual = String(value).padStart(digits, "0");
  return (
    <span ref={ref}>
      <span aria-hidden="true">{reduce ? actual : String(shown).padStart(digits, "0")}</span>
      <span className="sr-only">{actual}</span>
    </span>
  );
}

export function successSignal(message: string) {
  toast.success(message, { icon: <ConnectionIcon /> });
}
