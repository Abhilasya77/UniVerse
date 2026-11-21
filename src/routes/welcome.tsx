import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, GraduationCap, LifeBuoy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand, IconTile } from "@/features/campus/ui";
import { CampusScenes } from "@/features/campus/campus-intro";
import { universeTagline } from "@/features/campus/universe-mark";
const description = universeTagline;
export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to UniVerse" },
      { name: "description", content: description },
      { property: "og:title", content: "Welcome to UniVerse" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});
function Welcome() {
  return (
    <>
      <main>
        <section className="campus-welcome">
          <header className="campus-welcome-header">
            <nav className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-9">
              <Link to="/welcome">
                <Brand />
              </Link>
              <Button asChild variant="ghost">
                <Link to="/auth">Log in</Link>
              </Button>
            </nav>
          </header>
          <CampusScenes />
          <div className="campus-welcome-actions">
            <p className="universe-tagline">{description}</p>
            <p className="mt-2 max-w-sm text-base leading-relaxed">
              Discover campus events, build your career, and get the support you need in one place.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="campus-cta">
                <Link to="/" search={{ onboarding: true }}>
                  Get started <ArrowRight />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/">Explore demo</Link>
              </Button>
            </div>
          </div>
        </section>
        <section id="campus-life" className="mx-auto max-w-7xl px-5 py-8 sm:px-9 sm:py-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Your campus life, connected.</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Campus Connect",
                desc: "Discover and register for the events that matter to you.",
                icon: CalendarDays,
              },
              {
                title: "CampusIQ",
                desc: "Make sense of notices and find your next opportunity.",
                icon: Sparkles,
              },
              {
                title: "Student Hub",
                desc: "Track skills and turn your campus experience into a portfolio.",
                icon: GraduationCap,
              },
              {
                title: "Campus Care",
                desc: "Give feedback and follow campus service updates.",
                icon: LifeBuoy,
              },
            ].map((f) => (
              <article key={f.title} className="border-t pt-4">
                <IconTile icon={f.icon} />
                <h3 className="mt-3 font-extrabold">{f.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{f.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 border-t pt-6">
            <h2 className="text-lg font-bold">For students and educators</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Students find opportunities and support. Educators share campus events and keep
              students informed.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
