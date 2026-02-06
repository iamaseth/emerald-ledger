import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Outlet } from "react-router-dom";

export default function DashboardShell() {
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout searchValue={search} onSearchChange={setSearch}>
      <Outlet />
    </DashboardLayout>
  );
}
