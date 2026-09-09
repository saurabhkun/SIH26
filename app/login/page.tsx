"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Landmark,
  FlaskConical,
  GraduationCap,
  Briefcase,
  Building2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from "lucide-react";

type PortalRole = "gov" | "gov_ro" | "college" | "industry" | "consultancy";

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
    id: "gov",
    title: "Government Department",
    badge: "State Nodal Head",
    description:
      "State Nodal Review Officers, District Magistrates, and Domain Taskforces.",
    icon: Landmark,
    demoEmail: "officer@jharkhand.gov.in",
    demoPass: "Gov@1234",
    demoUser: "Dr. Arvind Kumar (State Review Desk)",
    targetPath: "/dashboard/gov",
  },
  {
    id: "gov_ro",
    title: "Gov Research Officer",
    badge: "Technical Evaluator",
    description:
      "District Feasibility Evaluators, Lab Milestone Auditors, and Nodal R&D Certifiers.",
    icon: FlaskConical,
    demoEmail: "ro.evaluator@jharkhand.gov.in",
    demoPass: "Ro@1234",
    demoUser: "Dr. Birendra Mahato (State Research Officer)",
    targetPath: "/dashboard/gov/ro",
  },
  {
    id: "college",
    title: "University / College",
    badge: "HEI Innovators",
    description:
      "University R&D Directors, Faculty Mentors, and Student Innovator Teams.",
    icon: GraduationCap,
    demoEmail: "director.rnd@bitmesra.ac.in",
    demoPass: "College@1234",
    demoUser: "Dr. Ananya Sen (BIT Mesra)",
    targetPath: "/dashboard/college",
  },
  {
    id: "industry",
    title: "Industry & CSR",
    badge: "Corporate Sponsors",
    description:
      "Corporate CSR Foundations, Project Sponsors, and Technology Adoption Partners.",
    icon: Briefcase,
    demoEmail: "csr.head@tatasteel.com",
    demoPass: "Industry@1234",
    demoUser: "Sanjay Chatterjee (Tata Steel CSR)",
    targetPath: "/dashboard/industry",
  },
  {
    id: "consultancy",
    title: "Technical Consultancy",
    badge: "NABL / QCI Audit Firm",
    description:
      "Empanelled third-party engineering auditors, lab assayers, and safety inspectors.",
    icon: Building2,
    demoEmail: "audit.lead@cmpdi.co.in",
    demoPass: "Consultancy@1234",
    demoUser: "Dr. Alok K. Mishra (CMPDI Technical Lead)",
    targetPath: "/dashboard/consultancy",
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

      router.push(data.redirectUrl || activeRoleConfig.targetPath);
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
        <Link
          href="/"
          className="text-civic-accent hover:text-white transition-colors text-[11px] font-medium"
        >
          &larr; Return to Public Portal
        </Link>
      </div>

      {/* Main Navbar */}
      <header className="bg-civic-surface border-b border-civic-border py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="inline-block text-[11px] font-semibold text-civic-primaryHover bg-civic-accent/25 border border-civic-accent px-2.5 py-0.5 uppercase tracking-wider mb-2 rounded-full">
            Secure Role-Based Authentication
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-civic-textDark leading-tight">
            Select Your Administrative &amp; Stakeholder Role
          </h1>
          <p className="text-xs sm:text-sm text-civic-textMuted mt-1">
            Choose your authorized stakeholder category below to access your dedicated management portal or audit desk.
          </p>
        </div>

        {/* 5 Profile / Role Selection Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`text-left p-4 border transition-all focus:outline-none rounded-xl cursor-pointer shadow-xs flex flex-col justify-between ${
                  isSelected
                    ? "bg-civic-surface border-civic-primary ring-2 ring-civic-primary shadow-sm"
                    : "bg-civic-surface border-civic-border hover:bg-slate-50 hover:border-civic-secondary"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? "bg-civic-primary text-white border-civic-primary"
                          : "bg-civic-canvas text-civic-primary border-civic-border"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-civic-accent/30 text-civic-primaryHover border-civic-accent"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {r.badge}
                    </span>
                  </div>
                  <h2 className="font-serif text-sm font-bold text-civic-textDark">
                    {r.title}
                  </h2>
                  <p className="text-[11px] text-civic-textMuted mt-1 leading-snug line-clamp-3">
                    {r.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      isSelected ? "text-civic-primary" : "text-slate-400"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected
                        ? "text-civic-primary translate-x-0.5"
                        : "text-slate-400"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Role Credentials Form */}
        <div className="bg-civic-surface border border-civic-border rounded-xl shadow-xs overflow-hidden max-w-2xl mx-auto w-full">
          <div className="bg-slate-50 border-b border-civic-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-civic-primary text-white rounded-lg">
                <activeRoleConfig.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-civic-textDark text-sm sm:text-base">
                  Sign In: {activeRoleConfig.title}
                </h3>
                <span className="text-xs text-civic-textMuted">
                  Target: <strong className="text-civic-primary">{activeRoleConfig.targetPath}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEmail(activeRoleConfig.demoEmail);
                setPassword(activeRoleConfig.demoPass);
              }}
              className="text-[11px] font-semibold text-civic-primaryHover bg-civic-accent/30 hover:bg-civic-accent/50 border border-civic-accent px-2.5 py-1 rounded-md transition-colors"
            >
              Fill Demo ({activeRoleConfig.demoEmail.split("@")[0]})
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold text-civic-textDark mb-1"
              >
                Official Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@domain.gov.in / ac.in"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary focus:border-transparent outline-hidden transition-all text-civic-textDark"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold text-civic-textDark"
                >
                  Authorization Password
                </label>
                <span className="text-[11px] text-civic-textMuted">
                  Demo Pass: <code className="bg-slate-100 px-1 rounded font-mono">{activeRoleConfig.demoPass}</code>
                </span>
              </div>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary focus:border-transparent outline-hidden transition-all text-civic-textDark"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-civic-primary hover:bg-civic-primaryHover text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating Role Gateway...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize &amp; Open Portal</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center flex items-center justify-between text-xs text-civic-textMuted">
              <span>New Institution, CSR Partner, or Consultancy?</span>
              <Link
                href="/register"
                className="text-civic-primary hover:text-civic-primaryHover font-bold underline"
              >
                Register Official Organization &rarr;
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-4 px-4 text-center text-xs text-civic-textMuted">
        <p>
          CivicResolve Gateway &bull; Department of Higher &amp; Technical Education &bull; Government of Jharkhand
        </p>
      </footer>
    </div>
  );
}
