import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";

export function LinkChip({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-1"
      aria-label={`Open ${label}`}
      title={`Open ${label}`}
    >
      <Badge variant="secondary" className="rounded-full">
        {label} <ExternalLink className="h-3 w-3 ml-1" />
      </Badge>
    </button>
  );
}
