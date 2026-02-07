import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Outlet } from "react-router-dom";
import { PeriodProvider } from "@/contexts/PeriodContext";

export default function DashboardShell() {
  const [search, setSearch] = useState("");

  return (
    <PeriodProvider>
      <DashboardLayout searchValue={search} onSearchChange={setSearch}>
        <Outlet />
      </DashboardLayout>
    </PeriodProvider>
  );
}
