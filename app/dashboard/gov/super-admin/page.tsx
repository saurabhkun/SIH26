import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import SuperAdminDashboardClient from "@/components/panels/SuperAdminDashboardClient";

export const dynamic = "force-dynamic";

export default function SuperAdminPage() {
  const user = getCurrentUser();

  const navItems: NavItem[] = [
    {
      label: "Master Triage Queue",
      href: "/dashboard/gov/super-admin",
      iconName: "shield",
    },
    {
      label: "Research Org Portal",
      href: "/dashboard/gov/ro",
      iconName: "flask",
    },
    {
      label: "Govt Dept Queues",
      href: "/dashboard/gov",
      iconName: "dashboard",
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
      roleTitle="Chief Super Admin Portal"
      userName={user?.name || "Sri Sunil Kumar, IAS"}
      userEmail={user?.email || "superadmin@jharkhand.gov.in"}
      designation={user?.designation || "Principal Secretary & Chief Super Administrator"}
      organizationOrCollege="Cabinet Secretariat, Government of Jharkhand"
      navItems={navItems}
    >
      <SuperAdminDashboardClient />
    </DashboardShell>
  );
}
