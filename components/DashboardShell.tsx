"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  Landmark,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  ShieldAlert,
  Coins,
  FileCheck,
  Search,
  FileCode2,
  ListTodo,
  Users2,
  Award,
  Receipt,
  Users,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export type IconName =
  | "dashboard"
  | "shield"
  | "graduation"
  | "coins"
  | "reports"
  | "search"
  | "code"
  | "todo"
  | "teams"
  | "award"
  | "receipt"
  | "users";

export interface NavItem {
  label: string;
  href: string;
  iconName: IconName;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardShellProps {
  role: "gov" | "college" | "industry";
  roleTitle: string;
  userName: string;
  userEmail: string;
  designation?: string;
  organizationOrCollege?: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

function renderNavIcon(name: IconName) {
  switch (name) {
    case "dashboard":
      return <LayoutDashboard className="w-4 h-4" />;
    case "shield":
      return <ShieldAlert className="w-4 h-4" />;
    case "graduation":
      return <GraduationCap className="w-4 h-4" />;
    case "coins":
      return <Coins className="w-4 h-4" />;
    case "reports":
      return <FileCheck className="w-4 h-4" />;
    case "search":
      return <Search className="w-4 h-4" />;
    case "code":
      return <FileCode2 className="w-4 h-4" />;
    case "todo":
      return <ListTodo className="w-4 h-4" />;
    case "teams":
      return <Users2 className="w-4 h-4" />;
    case "award":
      return <Award className="w-4 h-4" />;
    case "receipt":
      return <Receipt className="w-4 h-4" />;
    case "users":
      return <Users className="w-4 h-4" />;
    default:
      return <LayoutDashboard className="w-4 h-4" />;
  }
}

export default function DashboardShell({
  role,
  roleTitle,
  userName,
  userEmail,
  designation,
  organizationOrCollege,
  navItems,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const RoleIcon =
    role === "gov" ? Landmark : role === "college" ? GraduationCap : Briefcase;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Government Strip */}
      <div className="bg-[#001B2E] text-white text-xs py-1.5 px-4 sm:px-8 border-b border-[#FFC49B]/40 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            Government of Jharkhand
          </span>
          <span className="text-[#FFC49B]">|</span>
          <span className="text-slate-300">
            Higher & Technical Education Department
          </span>
        </div>
        <div className="text-slate-300 text-[11px] hidden sm:block">
          Authenticated Portal &bull; Role: {roleTitle}
        </div>
      </div>

      {/* Main App Bar */}
      <header className="bg-white border-b border-slate-300 py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#001B2E] text-[#FFC49B] rounded-xs border border-[#FFC49B]/40">
              <RoleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Link href="/" className="font-serif font-bold text-[#001B2E] text-lg leading-tight hover:underline">
                  CivicResolve
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-700">{roleTitle}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {organizationOrCollege ? `${organizationOrCollege} • ` : ""}
                {designation || "Authorized Stakeholder"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right text-xs">
              <div className="font-semibold text-slate-900">{userName}</div>
              <div className="text-slate-500 text-[11px]">{userEmail}</div>
            </div>

            <NotificationBell />

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Body Layout: Sidebar + Main Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white border border-slate-300 p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 mb-1">
              Navigation Menu
            </div>
            {navItems.map((item, idx) => {
              const isCurrent =
                item.active !== undefined
                  ? item.active
                  : pathname === item.href ||
                    (item.href !== "/dashboard/gov" &&
                      item.href !== "/dashboard/college" &&
                      item.href !== "/dashboard/industry" &&
                      item.href.length > 2 &&
                      pathname.startsWith(item.href));

              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={item.onClick}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-[#001B2E] text-[#FFEFD3] border-l-4 border-[#FFC49B] font-semibold shadow-xs"
                      : "text-slate-700 border-l-4 border-transparent hover:bg-slate-100 hover:text-[#001B2E]"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {renderNavIcon(item.iconName)}
                    <span>{item.label}</span>
                  </div>
                  {isCurrent && <ChevronRight className="w-3.5 h-3.5 text-[#FFC49B]" />}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-white border border-slate-300 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 font-semibold text-[#001B2E] mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Session Authenticated</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Role permissions active for SIH 2026 PS 26043 workflow modules.
            </p>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 w-full bg-white border border-slate-300 p-6">
          {children}
        </main>
      </div>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-300 py-3 px-4 sm:px-8 text-xs text-slate-600 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.
          </div>
          <div className="text-slate-500">
            Unified Portal Shell &bull; Phase 6 Verified
          </div>
        </div>
      </footer>
    </div>
  );
}
