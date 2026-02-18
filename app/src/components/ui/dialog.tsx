import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type DialogCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = React.createContext<DialogCtx | null>(null);

type DragCtx = {
  modalStyle: React.CSSProperties;
  dragHandleProps: { onMouseDown: (e: React.MouseEvent) => void; className: string };
};

const DragCtx = React.createContext<DragCtx | null>(null);

function useDialogDrag(open: boolean) {
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  React.useEffect(() => {
    if (!open) setPosition(null);
  }, [open]);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = (e.currentTarget as HTMLElement).closest('[data-draggable-dialog]') as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition((prev) => prev ?? { x: rect.left, y: rect.top });
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { startX, startY, startLeft, startTop } = dragRef.current;
      setPosition({
        x: startLeft + e.clientX - startX,
        y: startTop + e.clientY - startY,
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open]);

  const modalStyle: React.CSSProperties =
    position != null ? { position: "fixed" as const, left: position.x, top: position.y } : {};

  return {
    modalStyle,
    dragHandleProps: {
      onMouseDown,
      className: "cursor-grab active:cursor-grabbing select-none",
    },
  };
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const ctx = React.useMemo<DialogCtx>(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function DialogContent({
  className,
  children,
  draggable = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean }) {
  const ctx = React.useContext(Ctx);
  const drag = useDialogDrag(!!ctx?.open);

  if (!ctx) throw new Error("DialogContent must be used within Dialog");
  if (!ctx.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          data-draggable-dialog
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl p-0",
            className
          )}
          style={draggable ? drag.modalStyle : undefined}
          {...props}
        >
          <DragCtx.Provider value={draggable ? drag : null}>{children}</DragCtx.Provider>
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(Ctx);
  const drag = React.useContext(DragCtx);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4",
        drag && "cursor-grab active:cursor-grabbing select-none",
        className
      )}
      onMouseDown={drag?.dragHandleProps.onMouseDown}
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

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold text-slate-900 tracking-tight", className)}
      {...props}
    />
  );
}

/** Use for scrollable dialog body content. Keeps padding and typography consistent. */
export function DialogBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4",
        className
      )}
      {...props}
    />
  );
}
