"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Landmark,
  FlaskConical,
  GraduationCap,
  Building2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

type PortalRole = "auto" | "super_admin" | "gov" | "gov_ro" | "college" | "industry_tech" | "industry" | "consultancy";

interface RoleOption {
  id: PortalRole;
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  demoEmail: string;
  demoPass: string;
  demoUser: string;
  targetPath: string;
}

const ROLES: RoleOption[] = [
  {
    id: "super_admin",
    title: "Chief Super Admin",
    badge: "State Apex Oversight",
    description: "Principal Secretary, Master Triage Desk, Audit Overrides & Routing Matrix.",
    icon: ShieldAlert,
    demoEmail: "superadmin@jharkhand.gov.in",
    demoPass: "SuperAdmin@1234",
    demoUser: "Sri Sunil Kumar, IAS (Chief Super Admin)",
    targetPath: "/dashboard/gov/super-admin",
  },
  {
    id: "gov",
    title: "Gov Nodal & Depts",
    badge: "PWD & Urban Works",
    description: "Municipal maintenance queues, PWD road repairs & water taskforces.",
    icon: Landmark,
    demoEmail: "officer@jharkhand.gov.in",
    demoPass: "Gov@1234",
    demoUser: "Dr. Arvind Kumar (State Review Desk)",
    targetPath: "/dashboard/gov",
  },
  {
    id: "gov_ro",
    title: "Research Organization",
    badge: "State & District Lab",
    description: "Urban planning analysis, research feasibility & R&D milestone certification.",
    icon: FlaskConical,
    demoEmail: "ro.evaluator@jharkhand.gov.in",
    demoPass: "Ro@1234",
    demoUser: "Dr. Birendra Mahato (State Research Org Evaluator)",
    targetPath: "/dashboard/gov/ro",
  },
  {
    id: "college",
    title: "University / College",
    badge: "HEI Faculty & Labs",
    description: "Faculty PIs and student innovators developing civic prototypes.",
    icon: GraduationCap,
    demoEmail: "director.rnd@bitmesra.ac.in",
    demoPass: "College@1234",
    demoUser: "Dr. Ananya Sen (BIT Mesra)",
    targetPath: "/dashboard/college",
  },
  {
    id: "industry_tech",
    title: "Industry & Tech Partners",
    badge: "Corporate Co-Funders & NABL / QCI Audits",
    description: "Corporate co-funders, CSR escrow partners & empanelled technical laboratory auditors.",
    icon: Building2,
    demoEmail: "csr.head@tatasteel.com",
    demoPass: "Industry@1234",
    demoUser: "Sanjay Chatterjee (Tata Steel CSR & Tech Lead)",
    targetPath: "/dashboard/industry",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<PortalRole>("auto");
  const [email, setEmail] = useState("superadmin@jharkhand.gov.in");
  const [password, setPassword] = useState("SuperAdmin@1234");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Instant fast-session hydration check
  useEffect(() => {
    try {
      const cachedSession = sessionStorage.getItem("civic_session_user");
      if (cachedSession) {
        const parsed = JSON.parse(cachedSession);
        if (parsed?.role) {
          const redirectPath =
            parsed.role === "super_admin"
              ? "/dashboard/gov/super-admin"
              : parsed.role === "gov_ro"
              ? "/dashboard/gov/ro"
              : parsed.role === "consultancy"
              ? "/dashboard/consultancy"
              : parsed.role === "gov"
              ? "/dashboard/gov"
              : parsed.role === "college"
              ? "/dashboard/college"
              : parsed.role === "industry"
              ? "/dashboard/industry"
              : "/";
          // Check if session cookie is alive by pinging /api/auth/me non-blockingly
          fetch("/api/auth/me").then((res) => {
            if (res.ok) router.push(redirectPath);
          });
        }
      }
    } catch {}
  }, [router]);

  const handleRoleSelect = (roleId: PortalRole) => {
    setSelectedRole(roleId);
    const config = ROLES.find((r) => r.id === roleId);
    if (config) {
      setEmail(config.demoEmail);
      setPassword(config.demoPass);
    }
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole === "auto" ? undefined : selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Fast-hydrate session in sessionStorage for zero-latency retrieval
      if (data.user) {
        sessionStorage.setItem("civic_session_user", JSON.stringify(data.user));
      }
      if (data.token) {
        sessionStorage.setItem("civic_session_token", data.token);
      }

      router.push(data.redirectUrl || "/dashboard/gov");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-civic-canvas dark:bg-[#0B0F17] text-civic-textDark dark:text-[#F8FAFC] flex flex-col justify-between transition-colors">
      {/* Top Gov Identifier Bar */}
      <div className="bg-civic-primary text-white text-xs py-2 px-4 sm:px-8 border-b border-civic-primaryHover flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">
            Government of Jharkhand
          </span>
          <span className="text-civic-accent">|</span>
          <span className="text-slate-200">
            Cabinet Secretariat &amp; Higher Education Department
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link
            href="/"
            className="text-civic-accent hover:text-white transition-colors text-[11px] font-medium"
          >
            &larr; Public Portal
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-civic-surface dark:bg-[#1E293B] border-b border-civic-border dark:border-[#334155] py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="group block">
            <span className="text-2xl font-serif font-bold text-civic-primary dark:text-[#A3CEF1] tracking-tight block leading-tight">
              CivicResolve
            </span>
            <span className="text-[11px] text-civic-textMuted dark:text-[#94A3B8] block">
              Unified Single Sign-On Gateway &bull; Dynamic Role Recognition
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-civic-primary dark:text-[#A3CEF1] font-semibold px-3 py-1.5 border border-civic-border dark:border-[#334155] bg-civic-canvas dark:bg-[#0B0F17] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1 text-civic-secondary" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-civic-primaryHover dark:text-amber-300 bg-civic-accent/25 dark:bg-amber-950/40 border border-civic-accent dark:border-amber-500/30 px-2.5 py-0.5 uppercase tracking-wider mb-2 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Unified Stakeholder &amp; Super Admin Portal</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-civic-textDark dark:text-[#F8FAFC] leading-tight">
            Sign In to CivicResolve
          </h1>
          <p className="text-xs sm:text-sm text-civic-textMuted dark:text-[#94A3B8] mt-1">
            Single gateway for Super Administrators, Government Departments, Research Organizations, Colleges, CSR Sponsors, and Technical Consultancies.
          </p>
        </div>

        {/* 5 Profile / Role Selection Tiles */}
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;

              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`text-left p-3.5 border transition-all focus:outline-hidden rounded-xl cursor-pointer shadow-xs flex flex-col justify-between h-full min-h-[140px] ${
                    isSelected
                      ? "bg-civic-surface dark:bg-[#1E293B] border-civic-primary dark:border-blue-400 ring-2 ring-civic-primary dark:ring-blue-400 shadow-sm"
                      : "bg-civic-surface dark:bg-[#1E293B] border-civic-border dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`p-2 rounded-lg border ${
                          isSelected
                            ? "bg-civic-primary dark:bg-blue-600 text-white border-civic-primary"
                            : "bg-civic-canvas dark:bg-[#0B0F17] text-civic-primary dark:text-[#A3CEF1] border-civic-border dark:border-[#334155]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h2 className="font-serif text-xs font-bold text-civic-textDark dark:text-[#F8FAFC]">
                      {r.title}
                    </h2>
                    <span className="text-[9.5px] font-bold text-civic-secondary block mt-0.5">
                      {r.badge}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? "text-civic-primary dark:text-blue-300 font-bold" : "text-slate-400"}>
                      {isSelected ? "Active" : "Auto Fill"}
                    </span>
                    <ArrowRight className={`w-3 h-3 ${isSelected ? "text-civic-primary dark:text-blue-300" : "text-slate-400"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified Credentials Form */}
        <div className="bg-civic-surface dark:bg-[#1E293B] border border-civic-border dark:border-[#334155] rounded-xl shadow-xs overflow-hidden max-w-xl mx-auto w-full">
          <div className="bg-slate-50 dark:bg-[#111827] border-b border-civic-border dark:border-[#334155] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <KeyRound className="w-5 h-5 text-civic-primary dark:text-[#A3CEF1]" />
              <div>
                <h3 className="font-serif font-bold text-civic-textDark dark:text-[#F8FAFC] text-sm">
                  Authorized Enterprise Sign-In
                </h3>
                <span className="text-[11px] text-civic-textMuted dark:text-[#94A3B8]">
                  Dynamic role resolution &amp; session acceleration
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedRole("auto");
                setEmail("superadmin@jharkhand.gov.in");
                setPassword("SuperAdmin@1234");
              }}
              className="text-[11px] font-semibold text-civic-primaryHover dark:text-amber-300 bg-civic-accent/30 dark:bg-amber-900/30 border border-civic-accent dark:border-amber-500/30 px-2.5 py-1 rounded-md transition-colors"
            >
              Super Admin Fast-Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold text-civic-textDark dark:text-[#F8FAFC] mb-1"
              >
                Official Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@domain.gov.in / ac.in / corporate"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden transition-all text-civic-textDark dark:text-[#F8FAFC]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold text-civic-textDark dark:text-[#F8FAFC]"
                >
                  Authorization Password
                </label>
              </div>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden transition-all text-civic-textDark dark:text-[#F8FAFC]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-civic-primary dark:bg-blue-600 hover:bg-civic-primaryHover dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating &amp; Hydrating Session...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize &amp; Launch Portal</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center flex items-center justify-between text-xs text-civic-textMuted dark:text-[#94A3B8]">
              <span>New Institution, CSR Partner, or Consultancy?</span>
              <Link
                href="/register"
                className="text-civic-primary dark:text-[#A3CEF1] hover:underline font-bold"
              >
                Empanel Official Organization &rarr;
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-civic-surface dark:bg-[#1E293B] border-t border-civic-border dark:border-[#334155] py-4 px-4 text-center text-xs text-civic-textMuted dark:text-[#94A3B8]">
        <p>
          CivicResolve Gateway &bull; Government of Jharkhand &bull; Single Sign-On &amp; Session Engine
        </p>
      </footer>
    </div>
  );
}
