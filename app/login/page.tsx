"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Landmark,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from "lucide-react";

type PortalRole = "gov" | "college" | "industry";

interface RoleOption {
  id: PortalRole;
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  demoEmail: string;
  demoPass: string;
  demoUser: string;
}

const ROLES: RoleOption[] = [
  {
    id: "gov",
    title: "Government Department",
    badge: "State & District Nodal",
    description: "State Nodal Review Officers, District Magistrates, and Domain Taskforces.",
    icon: Landmark,
    demoEmail: "officer@jharkhand.gov.in",
    demoPass: "Gov@1234",
    demoUser: "Dr. Arvind Kumar (State Review Desk)",
  },
  {
    id: "college",
    title: "University / College Portal",
    badge: "HEI Faculty & Student Teams",
    description: "University R&D Directors, Faculty Mentors, and Multidisciplinary Student Innovators.",
    icon: GraduationCap,
    demoEmail: "rnd.director@bitmesra.ac.in",
    demoPass: "College@1234",
    demoUser: "Dr. Ananya Sen (BIT Mesra)",
  },
  {
    id: "industry",
    title: "Industry & CSR Partner",
    badge: "Corporate & CSR Sponsors",
    description: "CSR Foundations, Industry Sponsors, Mentors, and Technology Adoption Partners.",
    icon: Briefcase,
    demoEmail: "csr.head@tatasteel.com",
    demoPass: "Industry@1234",
    demoUser: "Sanjay Chatterjee (Tata Steel CSR)",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<PortalRole>("gov");
  const [email, setEmail] = useState("officer@jharkhand.gov.in");
  const [password, setPassword] = useState("Gov@1234");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

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
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push(data.redirectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-civic-canvas text-civic-textDark flex flex-col justify-between">
      {/* Top Gov Identifier Bar */}
      <div className="bg-civic-primary text-white text-xs py-2 px-4 sm:px-8 border-b border-civic-primaryHover flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">
            Government of Jharkhand
          </span>
          <span className="text-civic-accent">|</span>
          <span className="text-slate-200">
            Higher &amp; Technical Education Department
          </span>
        </div>
        <Link href="/" className="text-civic-accent hover:text-white transition-colors text-[11px] font-medium">
          &larr; Return to Public Portal
        </Link>
      </div>

      {/* Main Navbar */}
      <header className="bg-civic-surface border-b border-civic-border py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="group block">
            <span className="text-2xl font-serif font-bold text-civic-primary tracking-tight block leading-tight">
              CivicResolve
            </span>
            <span className="text-[11px] text-civic-textMuted block">
              Official Single Sign-On Gateway &bull; Role-Based Authorization
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-civic-primary font-semibold px-3 py-1.5 border border-civic-border bg-civic-canvas hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1 text-civic-secondary" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-block text-[11px] font-semibold text-civic-primaryHover bg-civic-accent/25 border border-civic-accent px-2.5 py-0.5 uppercase tracking-wider mb-2 rounded-full">
            Secure Portal Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-civic-textDark leading-tight">
            Select Your Administrative Role
          </h1>
          <p className="text-xs sm:text-sm text-civic-textMuted mt-1">
            Choose your authorized stakeholder category below to access your dedicated management portal.
          </p>
        </div>

        {/* 3 Profile / Role Selection Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`text-left p-5 border transition-all focus:outline-none rounded-xl cursor-pointer shadow-xs ${
                  isSelected
                    ? "bg-civic-surface border-civic-primary ring-2 ring-civic-primary shadow-sm"
                    : "bg-civic-surface border-civic-border hover:bg-slate-50 hover:border-civic-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isSelected
                        ? "bg-civic-primary text-white border-civic-primary"
                        : "bg-civic-canvas text-civic-primary border-civic-border"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 border rounded-full ${
                      isSelected
                        ? "bg-civic-accent/30 text-civic-primaryHover border-civic-accent"
                        : "bg-slate-100 text-civic-textMuted border-slate-200"
                    }`}
                  >
                    {r.badge}
                  </span>
                </div>

                <h2 className="text-base font-serif font-bold text-civic-textDark mb-1">
                  {r.title}
                </h2>
                <p className="text-xs text-civic-textMuted leading-relaxed">
                  {r.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-civic-textMuted">
                    {isSelected ? "Selected Service" : "Click to select"}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-civic-primary bg-civic-primary text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Credentials Form Box */}
        <div className="max-w-md mx-auto w-full bg-civic-surface border border-civic-border p-6 sm:p-8 rounded-xl shadow-xs">
          <div className="flex items-center justify-between border-b border-civic-border pb-3 mb-5">
            <div>
              <span className="text-[11px] text-civic-textMuted uppercase tracking-wider block">
                Authenticating as
              </span>
              <h3 className="font-serif font-bold text-civic-textDark text-lg">
                {activeRoleConfig.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-medium rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                SSO Active
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-civic-textDark mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-civic-border text-civic-textDark placeholder-slate-400 focus:outline-none focus:border-civic-primary focus:ring-1 focus:ring-civic-primary rounded-lg"
                placeholder="name@domain.gov.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-civic-textDark mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-civic-border text-civic-textDark placeholder-slate-400 focus:outline-none focus:border-civic-primary focus:ring-1 focus:ring-civic-primary rounded-lg"
                placeholder="••••••••"
              />
            </div>

            {/* Quick Demo Fill Note */}
            <div className="bg-slate-50 border border-civic-border p-2.5 text-[11.5px] text-civic-textMuted flex items-center justify-between rounded-lg">
              <div className="flex items-center gap-1.5 truncate">
                <KeyRound className="w-3.5 h-3.5 text-civic-secondary flex-shrink-0" />
                <span className="truncate">
                  Demo: <strong className="text-civic-textDark">{activeRoleConfig.demoUser}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(activeRoleConfig.demoEmail);
                  setPassword(activeRoleConfig.demoPass);
                }}
                className="text-[11px] text-civic-primary hover:text-civic-primaryHover font-semibold underline ml-2 flex-shrink-0 cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-civic-primary hover:bg-civic-primaryHover text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2 cursor-pointer transition-colors"
            >
              {isLoading ? "Validating Credentials..." : `Access ${activeRoleConfig.title}`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {selectedRole !== "gov" && (
              <div className="pt-2 text-center border-t border-civic-border mt-4">
                <p className="text-xs text-civic-textMuted">
                  New institution or CSR partner?{" "}
                  <Link href="/register" className="font-bold text-civic-primary hover:text-civic-primaryHover underline">
                    Register Account &rarr;
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Official Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-4 px-4 sm:px-8 text-xs text-civic-textMuted mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher &amp; Technical Education, Government of Jharkhand.
          </div>
          <div className="text-civic-textMuted">
            State Unified Grievance &amp; Technical Problem Solving Gateway
          </div>
        </div>
      </footer>
    </div>
  );
}
