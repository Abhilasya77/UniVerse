import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Button } from "@/components/ui/button";
import { Brand, Field } from "@/features/campus/ui";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { universeTagline } from "@/features/campus/universe-mark";
import { FocusText } from "@/features/campus/universe-motion";
import cover from "@/assets/campus-landing.asset.json";
export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signup" } =>
    search["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Sign in or register | UniVerse" },
      {
        name: "description",
        content: "Sign in to your campus workspace or create a UniVerse account.",
      },
      { property: "og:title", content: "Join UniVerse" },
      { property: "og:description", content: "Access your campus workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});
function Auth() {
  const { mode } = Route.useSearch();
  const signup = mode === "signup";
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const values = new FormData(e.currentTarget);
    const email = String(values.get("email")).trim(),
      password = String(values.get("password"));
    try {
      const result = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { name: values.get("name") },
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (result.data.session) await navigate({ to: "/dashboard" });
      else setMessage("Check your email for your confirmation link, then sign in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google" | "lovable") {
    setError("");
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) await navigate({ to: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Social sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <Link
          to="/welcome"
          className="flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground"
        >
          <ArrowLeft size={16} /> Back to UniVerse
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <div className="w-fit rounded-lg bg-night p-2.5 text-night-text">
            <Brand />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold">
            <FocusText text={signup ? "Create your account" : "Welcome back"} accent />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {signup ? "Join UniVerse from any university." : "Sign in to your campus workspace."}
          </p>
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            {signup && (
              <Field label="Full name">
                <input name="name" autoComplete="name" maxLength={120} required />
              </Field>
            )}
            <Field label="Email address">
              <input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                minLength={6}
                autoComplete={signup ? "new-password" : "current-password"}
                required
              />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-mint-ink">
                {message}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {signup ? "Create account" : "Log in"}
              <ArrowRight />
            </Button>
          </form>
          <div className="mt-4 grid gap-2">
            <Button variant="outline" onClick={() => void social("google")} disabled={busy}>
              <svg aria-hidden="true" className="!size-[18px]" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C15.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button variant="outline" onClick={() => void social("lovable")} disabled={busy}>
              <LovableMark className="!size-[18px]" /> Continue with Lovable
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            {signup ? "Already have an account?" : "New to UniVerse?"}{" "}
            <Link
              to="/auth"
              search={signup ? {} : { mode: "signup" }}
              onClick={() => {
                setError("");
                setMessage("");
              }}
              className="font-bold text-primary"
            >
              {signup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </main>
      <aside className="campus-photo-cover hidden items-end p-12 lg:flex">
        <img src={cover.url} alt="University library at dusk" />
        <p className="max-w-md font-display text-3xl leading-snug font-extrabold">
          {universeTagline}
        </p>
      </aside>
    </div>
  );
}
