import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateText } from "./data";
import type { eventFit } from "./planner";
import type { Tables } from "@/integrations/supabase/types";

export type RatedEvent = { event: Tables<"events">; fit: ReturnType<typeof eventFit> };

export function WorthDial({ score }: { score: number }) {
  const dial = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(score);
  useEffect(() => {
    const el = dial.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(score);
      return;
    }
    let frame = 0;
    const observe = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observe.disconnect();
      const start = performance.now();
      const animate = (time: number) => {
        const progress = Math.min(1, (time - start) / 460);
        setShown(Math.round(score * (1 - (1 - progress) ** 2)));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      setShown(0);
      frame = requestAnimationFrame(animate);
    });
    observe.observe(el);
    return () => {
      observe.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [score]);
  return (
    <span
      ref={dial}
      className="campus-dial"
      data-tone={score >= 75 ? "high" : score >= 50 ? "mid" : "low"}
      aria-label={`${score}% Worth it for you`}
    >
      <svg viewBox="0 0 62 62" aria-hidden="true">
        <circle cx="31" cy="31" r="27" />
        <circle cx="31" cy="31" r="27" pathLength="100" strokeDasharray={`${shown} 100`} />
      </svg>
      <span aria-hidden="true" className="campus-mono">
        {shown}%
      </span>
    </span>
  );
}

export function EventRing({
  items,
  render,
  open,
  label,
}: {
  items: RatedEvent[];
  render?: (item: RatedEvent) => ReactNode;
  open: (event: RatedEvent["event"]) => void;
  label: string;
}) {
  const [position, setPosition] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; id: number; moved: boolean } | null>(null);
  const wheel = useRef(0);
  const max = items.length;
  const index = Math.min(position, Math.max(0, max - 1));
  const current = items[index];
  const jump = (n: number) => {
    if (!max) return;
    const target = (n + max) % max;
    setPosition(target);
    const el = track.current;
    const child = el?.children[target];
    if (el && child instanceof HTMLElement && el.scrollWidth > el.clientWidth)
      el.scrollTo({
        left: child.offsetLeft - el.offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const handleWheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)").matches || !max)
        return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if ((delta < 0 && index === 0) || (delta > 0 && index === max - 1)) return;
      if (Math.abs(delta) < 12) return;
      event.preventDefault();
      if (Date.now() - wheel.current < 320) return;
      wheel.current = Date.now();
      setPosition(Math.max(0, Math.min(max - 1, index + Math.sign(delta))));
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [index, max]);
  if (!current) return null;
  return (
    <section className="campus-ring" aria-label={label}>
      <div className="campus-ring-controls">
        <span className="campus-mono" aria-live="polite">
          {String(index + 1).padStart(2, "0")} / {String(max).padStart(2, "0")} · RSVP
        </span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            aria-label="Previous event"
            title="Previous event"
            disabled={max < 2}
            onClick={() => jump(index - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Next event"
            title="Next event"
            disabled={max < 2}
            onClick={() => jump(index + 1)}
          >
            <ArrowRight />
          </Button>
        </div>
      </div>
      <div
        className="campus-ring-surface"
        ref={surface}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button === 0)
            pointer.current = { x: e.clientX, id: e.pointerId, moved: false };
        }}
        onPointerMove={(e) => {
          const start = pointer.current;
          if (
            !start ||
            start.id !== e.pointerId ||
            start.moved ||
            Math.abs(e.clientX - start.x) < 42 ||
            window.matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)").matches
          )
            return;
          start.moved = true;
          jump(index + Math.sign(start.x - e.clientX));
        }}
        onPointerLeave={() => {
          pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onClickCapture={(e) => {
          if (pointer.current?.moved) {
            e.stopPropagation();
            e.preventDefault();
          }
          pointer.current = null;
        }}
      >
        <svg
          className="universe-ring-orbits"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <ellipse cx="300" cy="100" rx="277" ry="71" />
          <ellipse cx="300" cy="100" rx="241" ry="93" />
          <circle cx="23" cy="100" r="4" />
          <circle cx="577" cy="100" r="4" />
        </svg>
        <div
          className="campus-ring-track"
          ref={track}
          onScroll={(e) => {
            if (
              !window.matchMedia("(max-width: 767px) and (prefers-reduced-motion: no-preference)")
                .matches
            )
              return;
            const el = e.currentTarget;
            const nearest = Array.from(el.children).reduce((best, child, i, all) => {
              const match = all[best];
              if (!(child instanceof HTMLElement) || !(match instanceof HTMLElement)) return best;
              return Math.abs(child.offsetLeft - el.offsetLeft - el.scrollLeft) <
                Math.abs(match.offsetLeft - el.offsetLeft - el.scrollLeft)
                ? i
                : best;
            }, 0);
            setPosition(nearest);
          }}
        >
          {items.map((item, i) => {
            const relative = (i - index + max) % max;
            const side =
              i === index
                ? "center"
                : relative === 1
                  ? "right"
                  : relative === max - 1
                    ? "left"
                    : "hidden";
            return (
              <div className="campus-ring-slot" data-side={side} key={item.event.id}>
                <div className="campus-ring-ticket">
                  <span className="campus-mono text-xs text-muted-foreground">
                    {item.event.host_university} · {item.event.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <h3 className="min-w-0 flex-1 text-2xl leading-tight">{item.event.title}</h3>
                    <WorthDial score={item.fit.score} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="campus-mono text-xs text-muted-foreground">
                      {dateText(item.event.starts_at)}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => open(item.event)}>
                      Details <ArrowUpRight />
                    </Button>
                  </div>
                </div>
                {render && <div className="campus-ring-static-detail">{render(item)}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {render && <div className="campus-ring-active-detail mt-3">{render(current)}</div>}
    </section>
  );
}
