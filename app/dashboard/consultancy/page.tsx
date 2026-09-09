import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import ConsultancyDashboardClient from "@/components/panels/ConsultancyDashboardClient";

export const dynamic = "force-dynamic";

export default function ConsultancyDashboardPage() {
  const user = getCurrentUser();

  const navItems: NavItem[] = [
    {
      label: "Audit Projects",
      href: "/dashboard/consultancy",
      iconName: "building",
    },
    {
      label: "Lab Assays & Field Tests",
      href: "/dashboard/consultancy",
      iconName: "flask",
    },
    {
      label: "Compliance Certifications",
      href: "/dashboard/consultancy",
      iconName: "award",
    },
    {
      label: "Statutory Reports",
      href: "/dashboard/consultancy",
      iconName: "reports",
    },
  ];

  return (
    <DashboardShell
      role="consultancy"
      roleTitle="Technical Consultancy Portal"
      userName={user?.name || "Dr. Alok K. Mishra"}
      userEmail={user?.email || "audit.lead@cmpdi.co.in"}
      designation={
        user?.designation ||
        "Chief Technical Auditor & Environmental Assayer"
      }
      organizationOrCollege={
        user?.organizationName ||
        "Central Mine Planning & Design Institute (CMPDI)"
      }
      navItems={navItems}
    >
      <ConsultancyDashboardClient />
    </DashboardShell>
  );
}
