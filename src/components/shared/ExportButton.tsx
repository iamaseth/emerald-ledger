import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  label?: string;
}

export function ExportButton({ label = "Export" }: ExportButtonProps) {
  return (
    <Button variant="outline" size="sm" className="gap-2">
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
