import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { SearchBar } from "@/components/shared/SearchBar";
import { CSVImportModal } from "@/components/shared/CSVImportModal";
import { Button } from "@/components/ui/button";
import { Upload, Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  searchValue: string;
  onSearchChange: (v: string) => void;
}

export function DashboardLayout({ children, searchValue, onSearchChange }: DashboardLayoutProps) {
  const [csvOpen, setCsvOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 max-w-md">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>
          <Button onClick={() => setCsvOpen(true)} size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
        </header>

        {/* Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
      <CSVImportModal open={csvOpen} onOpenChange={setCsvOpen} />
    </div>
  );
}
