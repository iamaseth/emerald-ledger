import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { SearchBar } from "@/components/shared/SearchBar";
import { CSVImportModal } from "@/components/shared/CSVImportModal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  searchValue: string;
  onSearchChange: (v: string) => void;
}

export function DashboardLayout({ children, searchValue, onSearchChange }: DashboardLayoutProps) {
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-6">
          <div className="flex-1 max-w-md">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>
          <Button onClick={() => setCsvOpen(true)} size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      <CSVImportModal open={csvOpen} onOpenChange={setCsvOpen} />
    </div>
  );
}
