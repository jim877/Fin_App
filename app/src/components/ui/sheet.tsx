import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type SheetCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = React.createContext<SheetCtx | null>(null);

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const ctx = React.useMemo<SheetCtx>(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function SheetContent({
  className,
  side = "right",
  children,
}: {
  className?: string;
  side?: "right" | "left";
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("SheetContent must be used within Sheet");
  if (!ctx.open) return null;

  const sideClass = side === "right" ? "right-0" : "left-0";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div
        className={cn(
          "absolute top-0 flex h-full w-full max-w-[520px] flex-col bg-background shadow-xl border-l",
          sideClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(Ctx);

  return (
    <div
      className={cn(
        "flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-background px-4 py-3",
        className
      )}
      {...rest}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {ctx && (
        <button
          type="button"
          onClick={() => ctx.setOpen(false)}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function SheetClose({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("SheetClose must be used within Sheet");

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        ctx.setOpen(false);
      },
    });
  }

  return (
    <button type="button" onClick={() => ctx.setOpen(false)}>
      {children}
    </button>
  );
}
