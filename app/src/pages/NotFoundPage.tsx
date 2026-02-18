import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="text-2xl font-semibold">404</div>
      <div className="text-sm text-muted-foreground">That page doesn’t exist.</div>
      <Button onClick={() => navigate("/")}>Go home</Button>
    </div>
  );
}
