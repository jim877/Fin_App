import * as React from "react";
import { cn } from "../../lib/utils";

type PopoverCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = React.createContext<PopoverCtx | null>(null);

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onDoc() {
      setOpen(false);
    }
    if (open) document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  );
}

export function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("PopoverTrigger must be used within Popover");

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        child.props.onClick?.(e);
        ctx.setOpen(!ctx.open);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        ctx.setOpen(!ctx.open);
      }}
    >
      {children}
    </button>
  );
}

export function PopoverContent({
  className,
  align = "center",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end" }) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("PopoverContent must be used within Popover");
  if (!ctx.open) return null;

  const alignClass =
    align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-50 mt-2 min-w-[200px] rounded-2xl border border-slate-200 bg-white py-1 text-sm text-slate-900 shadow-xl",
        alignClass,
        className
      )}
      {...props}
    />
  );
}
