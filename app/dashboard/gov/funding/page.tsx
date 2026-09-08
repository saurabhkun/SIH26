import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import GovDashboardClient from "../GovDashboardClient";

export const dynamic = "force-dynamic";

export default function GovFundingPage() {
  const user = getCurrentUser();

  const navItems: NavItem[] = [
    { label: "State Overview", href: "/dashboard/gov", iconName: "dashboard" },
    {
      label: "Sourced Issues Review",
      href: "/dashboard/gov/triage",
      iconName: "shield",
    },
    {
      label: "Project Allocations",
      href: "/dashboard/gov/allocations",
      iconName: "graduation",
    },
    {
      label: "CSR Capital Co-Funding",
      href: "/dashboard/gov/funding",
      iconName: "coins",
    },
    {
      label: "Cabinet & Nodal Reports",
      href: "/dashboard/gov/reports",
      iconName: "reports",
    },
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
      <GovDashboardClient initialTab="analytics" />
    </DashboardShell>
  );
}
