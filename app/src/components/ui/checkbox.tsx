import { cn } from "../../lib/utils";

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled,
  className,
}: {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  className?: string;
}) {
  const isIndeterminate = checked === "indeterminate";
  const isChecked = checked === true;
  const dataState = isIndeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isChecked}
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      role="checkbox"
      data-state={dataState}
      onClick={() => onCheckedChange?.(isChecked ? false : true)}
      className={cn(
        "h-4 w-4 rounded border flex items-center justify-center",
        isChecked ? "bg-primary text-primary-foreground border-primary" : "bg-background",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isChecked ? (
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
        </svg>
      ) : null}
    </button>
  );
}
