import type { ReactNode } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrbitMark, Wordmark } from "./universe-mark";
import { FocusText } from "./universe-motion";

export function Brand() {
  return (
    <span className="universe-brand">
      <OrbitMark />
      <Wordmark />
    </span>
  );
}
export const shades = {
  red: "bg-destructive/10 text-destructive",
  violet: "bg-secondary text-secondary-foreground",
  mint: "bg-mint text-mint-ink",
  amber: "bg-amber-soft text-amber-ink",
  sky: "bg-sky-soft text-sky-ink",
};
export type Shade = keyof typeof shades;
export function IconTile({ icon: Icon, shade = "violet" }: { icon: LucideIcon; shade?: Shade }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${shades[shade]}`}>
      <Icon size={19} strokeWidth={1.85} />
    </span>
  );
}
export function Badge({ children, shade = "violet" }: { children: ReactNode; shade?: Shade }) {
  return (
    <span
      className={`campus-mono inline-flex w-fit max-w-full items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${shades[shade]}`}
    >
      {children}
    </span>
  );
}
export function Heading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-2">
      <h2 className="font-display text-[17px] font-extrabold">
        <FocusText text={title} />
      </h2>
      {action && (
        <Button variant="link" size="sm" className="h-7 px-0" onClick={onAction}>
          {action}
          <ArrowUpRight />
        </Button>
      )}
    </div>
  );
}
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`campus-card universe-scroll-section ${className}`}>{children}</section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="universe-empty rounded-lg border border-dashed p-7 text-center text-sm text-muted-foreground">
      <OrbitMark />
      {children}
    </div>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="campus-field">
      {label}
      {children}
    </label>
  );
}
export function Modal({
  title,
  description,
  placement = "center",
  children,
  onClose,
}: {
  title: string;
  description?: string;
  placement?: "center" | "edge";
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`campus-dialog max-h-[90dvh] overflow-auto sm:max-w-lg ${placement === "edge" ? "campus-event-drawer" : ""}`}
      >
        <DialogHeader>
          <DialogTitle>
            <FocusText text={title} />
          </DialogTitle>
          <DialogDescription className={description ? "" : "sr-only"}>
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
