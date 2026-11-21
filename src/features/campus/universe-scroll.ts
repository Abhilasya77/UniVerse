import { useEffect, type RefObject } from "react";

export function useUniversityScroll(scope: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const start = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const sections = Array.from(node.querySelectorAll<HTMLElement>(".universe-scroll-section"));
        sections
          .filter((item) => item.getBoundingClientRect().top > innerHeight)
          .forEach((item, i) => {
            gsap.from(item, {
              y: 38,
              opacity: 0.28,
              duration: 0.54,
              delay: (i % 3) * 0.055,
              ease: "power2.out",
              scrollTrigger: { trigger: item, start: "top 95%", once: true },
            });
          });
      });
      media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const scene = node.querySelector(".universe-home-scene");
        const images = scene?.querySelectorAll(".universe-home-slide");
        const words = scene?.querySelectorAll(".universe-home-word");
        const hero = scene?.querySelector(".campus-daily-hero");
        if (!scene || !hero || !images || !words) return;
        const story = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            pin: hero,
            pinSpacing: false,
            start: "top top+=76",
            end: "+=300",
            scrub: 0.55,
            anticipatePin: 1,
          },
        });
        images.forEach((image, i) => {
          if (!i) return;
          const before = images[i - 1];
          const previous = words[i - 1];
          const word = words[i];
          if (before) story.to(before, { opacity: 0, scale: 1.055, duration: 0.65 }, i - 0.65);
          story.fromTo(
            image,
            { opacity: 0, scale: 1.075 },
            { opacity: 1, scale: 1, duration: 0.65 },
            i - 0.65,
          );
          if (previous && word)
            story
              .to(previous, { opacity: 0, y: -8, duration: 0.24 }, i - 0.65)
              .fromTo(word, { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.3 }, i - 0.42);
        });
        const stats = node.querySelector(".campus-pulse-stats");
        if (stats)
          gsap.from(Array.from(stats.children), {
            y: (i: number) => 14 + i * 8,
            opacity: 0.65,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: { trigger: stats, start: "top 100%", end: "top 70%", scrub: 0.35 },
          });
      });
      cleanup = () => media.revert();
    };
    void start();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [scope]);
}
