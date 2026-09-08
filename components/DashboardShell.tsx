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
    <div className="min-h-screen bg-civic-canvas text-civic-textDark flex flex-col font-sans">
      {/* Top Government Identifier Strip */}
      <div className="bg-civic-primary text-white text-xs py-1.5 px-4 sm:px-8 border-b border-civic-primaryHover flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">
            Government of Jharkhand
          </span>
          <span className="text-civic-accent">|</span>
          <span className="text-slate-200">
            Higher &amp; Technical Education Department
          </span>
        </div>
        <div className="text-slate-200 text-[11px] hidden sm:block">
          Authenticated Portal &bull; Role:{" "}
          <strong className="text-civic-accent">{roleTitle}</strong>
        </div>
      </div>

      {/* Main App Bar */}
      <header className="bg-civic-surface border-b border-civic-border py-3 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-civic-primary text-white rounded-lg border border-civic-secondary/40 shadow-xs">
              <RoleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="font-serif font-bold text-civic-textDark text-lg leading-tight hover:text-civic-primary transition-colors"
                >
                  CivicResolve
                </Link>
                <span className="text-civic-border">/</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-civic-accent/25 text-civic-primaryHover border border-civic-accent font-medium">
                  {roleTitle}
                </span>
              </div>
              <p className="text-[11px] text-civic-textMuted">
                {organizationOrCollege ? `${organizationOrCollege} • ` : ""}
                {designation || "Authorized Stakeholder"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right text-xs">
              <div className="font-bold text-civic-textDark">{userName}</div>
              <div className="text-civic-textMuted text-[11px]">
                {userEmail}
              </div>
            </div>

            <NotificationBell />

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center px-3.5 py-1.5 bg-civic-canvas text-civic-textDark hover:bg-slate-200 text-xs font-medium border border-civic-border rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-civic-textMuted" />
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Body Layout: Sticky Sidebar + Main Content Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Left Sidebar Column */}
        <aside className="lg:col-span-3 sticky top-6 space-y-4">
          {/* Navigation Card */}
          <div className="bg-civic-surface rounded-xl border border-civic-border p-4 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-civic-textMuted uppercase tracking-wider border-b border-civic-border mb-1">
              Navigation Menu
            </div>
            {navItems.map((item, idx) => {
              const isCurrent =
                item.active !== undefined
                  ? item.active
                  : pathname === item.href;

              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={item.onClick}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-civic-primaryHover text-white border-r-4 border-civic-secondary font-semibold shadow-xs"
                      : "text-civic-textMuted hover:bg-slate-200/70 hover:text-civic-textDark font-medium"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {renderNavIcon(item.iconName)}
                    <span>{item.label}</span>
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-3.5 h-3.5 text-civic-accent" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Session Authenticated Card */}
          <div className="bg-civic-surface rounded-xl border border-civic-border p-4 shadow-xs text-xs text-civic-textMuted">
            <div className="flex items-center space-x-1.5 font-bold text-civic-textDark mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Session Authenticated</span>
            </div>
            <p className="text-[11px] text-civic-textMuted leading-relaxed">
              Role permissions active for SIH 2026 PS 26043 workflow modules.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 min-w-0 bg-civic-surface border border-civic-border rounded-xl p-6 shadow-xs text-civic-textDark space-y-6">
          {children}
        </main>
      </div>

      {/* Official Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-3.5 px-4 sm:px-8 text-xs text-civic-textMuted mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher &amp; Technical Education,
            Government of Jharkhand.
          </div>
          <div className="text-civic-textMuted">
            Unified Portal Shell &bull; Flutter Enterprise Synchronized
          </div>
        </div>
      </footer>
    </div>
  );
}
