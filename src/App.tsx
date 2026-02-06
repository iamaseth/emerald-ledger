import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardShell from "./pages/DashboardShell";
import ExecutivePulse from "./pages/ExecutivePulse";
import FinancialAuditor from "./pages/FinancialAuditor";
import AuditLog from "./pages/AuditLog";
import MenuCogs from "./pages/MenuCogs";
import InventoryVault from "./pages/InventoryVault";
import StaffIntelligence from "./pages/StaffIntelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardShell />}>
            <Route path="/" element={<ExecutivePulse />} />
            <Route path="/financial-auditor" element={<FinancialAuditor />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/menu-cogs" element={<MenuCogs />} />
            <Route path="/inventory" element={<InventoryVault />} />
            <Route path="/staff" element={<StaffIntelligence />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
