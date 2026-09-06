import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import GovDashboardClient from "./GovDashboardClient";

export const dynamic = "force-dynamic";

export default function GovDashboardPage() {
  const user = getCurrentUser();

  const navItems: NavItem[] = [
    { label: "State Overview", href: "/dashboard/gov", iconName: "dashboard", active: true },
    { label: "Sourced Issues Review", href: "/dashboard/gov", iconName: "shield" },
    { label: "HEI Project Allocations", href: "/dashboard/gov", iconName: "graduation" },
    { label: "CSR Capital Co-Funding", href: "/dashboard/gov", iconName: "coins" },
    { label: "Cabinet & Nodal Reports", href: "/dashboard/gov", iconName: "reports" },
  ];

  return (
    <DashboardShell
      role="gov"
      roleTitle="Government Department Portal"
      userName={user?.name || "Dr. Arvind Kumar"}
      userEmail={user?.email || "officer@jharkhand.gov.in"}
      designation={user?.designation || "State Nodal Review Officer"}
      organizationOrCollege="Dept. of Higher & Technical Education, Jharkhand"
      navItems={navItems}
    >
      <GovDashboardClient />
    </DashboardShell>
  );
}
