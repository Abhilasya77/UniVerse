import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import sunrise from "@/assets/campus-sunrise.webp.asset.json";
import lecture from "@/assets/campus-lecture.webp.asset.json";
import noticeboard from "@/assets/campus-noticeboard.webp.asset.json";
import canteen from "@/assets/campus-canteen.webp.asset.json";

import { OrbitMark, Wordmark, universeSecondary } from "./universe-mark";
import { FocusText } from "./universe-motion";

export { sunrise };
const scenes = [
  {
    img: sunrise,
    caption: "THE UNIVERSITY SUPER APP",
    title: universeSecondary,
    alt: "Illustrated campus avenue and clocktower at sunrise",
  },
  {
    img: lecture,
    caption: "Student Hub",
    title: "Student Hub",
    alt: "University lecture hall lit by the morning sun",
  },
  {
    img: noticeboard,
    caption: "Campus Connect",
    title: "Campus Connect",
    alt: "Campus corridor with a notice board full of student flyers",
  },
  {
    img: canteen,
    caption: "Campus Care",
    title: "Campus Care",
    alt: "Students sharing a meal in the campus canteen at sunset",
  },
] as const;

export function CampusScenes() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const artwork = useRef<HTMLDivElement>(null);
  const lastWheel = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (step: number) =>
    setScene((current) => (current + step + scenes.length) % scenes.length);
  useEffect(() => {
    const el = artwork.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!inView || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setScene((s) => (s + 1) % scenes.length), 5000);
    return () => window.clearTimeout(timer);
  }, [scene, paused, inView]);
  const current = scenes[scene] ?? scenes[0];
  return (
    <div
      className="campus-scenes"
      ref={artwork}
      onWheel={(e) => {
        if (
          Math.abs(e.deltaY) < 12 ||
          Date.now() - lastWheel.current < 850 ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        lastWheel.current = Date.now();
        move(Math.sign(e.deltaY));
      }}
      onTouchStart={(e) => {
        const point = e.touches[0];
        if (point) touch.current = { x: point.clientX, y: point.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        const point = e.changedTouches[0];
        touch.current = null;
        if (
          start &&
          point &&
          Math.abs(point.clientX - start.x) > Math.max(55, Math.abs(point.clientY - start.y))
        )
          move(Math.sign(start.x - point.clientX));
      }}
    >
      {scenes.map((item, i) => (
        <img
          key={item.img.url}
          className="campus-scene-image"
          data-active={scene === i}
          src={item.img.url}
          alt={item.alt}
          aria-hidden={scene !== i}
          loading={i === 0 ? "eager" : "lazy"}
          width={768}
          height={512}
        />
      ))}
      <div className="campus-scene-scrim" />
      <span className="campus-scene-edge campus-mono" aria-hidden="true">
        {current.caption} / 0{scene + 1}
      </span>
      <div className="campus-scene-words" key={scene}>
        <p className="campus-mono mb-4 text-sm text-night-text">
          0{scene + 1} / 0{scenes.length} <span aria-hidden="true">—</span> {current.caption}
        </p>
        {scene === 0 ? (
          <h1>
            <FocusText text={current.title} accent />
          </h1>
        ) : (
          <>
            <h1 className="sr-only">{universeSecondary}</h1>
            <p className="campus-scene-title">
              <FocusText text={current.title} accent />
            </p>
          </>
        )}
      </div>
      <div className="campus-scene-controls" aria-label="Campus scenes">
        <Button
          size="icon"
          variant="ghost"
          className="campus-scene-motion"
          aria-label={paused ? "Play campus scenes" : "Pause campus scenes"}
          title={paused ? "Play campus scenes" : "Pause campus scenes"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play /> : <Pause />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Previous scene"
          title="Previous scene"
          onClick={() => {
            move(-1);
            setPaused(true);
          }}
        >
          <ArrowLeft />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Next scene"
          title="Next scene"
          onClick={() => {
            move(1);
            setPaused(true);
          }}
        >
          <ArrowRight />
        </Button>
        <Button
          asChild
          size="icon"
          variant="ghost"
          aria-label="Your campus life, connected"
          title="Your campus life, connected"
        >
          <a href="#campus-life">
            <ArrowDown />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function CampusLoader() {
  const [progress, setProgress] = useState<number | null>(null);
  const skip = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("campus360-paper-intro")) return;
      sessionStorage.setItem("campus360-paper-intro", "seen");
    } catch {
      return;
    }
    let frame = 0;
    const start = performance.now();
    const finish = () => {
      cancelAnimationFrame(frame);
      setProgress(null);
    };
    const step = (now: number) => {
      const value = Math.min(100, Math.floor((now - start) / 13));
      setProgress(value);
      if (value < 100) frame = requestAnimationFrame(step);
    };
    setProgress(0);
    frame = requestAnimationFrame(step);
    const timeout = window.setTimeout(finish, 1450);
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", keys);
    skip.current = finish;
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", keys);
    };
  }, []);
  if (progress === null) return null;
  return (
    <Button
      variant="ghost"
      className="campus-loader"
      aria-label="Skip loading the campus"
      onClick={() => skip.current?.()}
    >
      <div className="universe-loader-central">
        <svg viewBox="0 0 280 180" aria-hidden="true" className="universe-loader-lines">
          <path
            pathLength="1"
            d="M12 22 60 108 111 62 140 90 194 27 233 78 268 146 M60 108 89 155 140 90 203 138 233 78"
          />
          {[
            [12, 22],
            [60, 108],
            [111, 62],
            [89, 155],
            [194, 27],
            [233, 78],
            [203, 138],
            [268, 146],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" />
          ))}
        </svg>
        <OrbitMark />
        <Wordmark />
      </div>
      <span className="campus-loader-label campus-mono">ENTERING THE UNIVERSE</span>
      <span className="campus-loader-count campus-mono" aria-hidden="true">
        {String(progress).padStart(3, "0")}%
      </span>
    </Button>
  );
}
