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
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Gov Identifier Bar */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-8 border-b border-gold/40 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            Government of Jharkhand
          </span>
          <span className="text-gold">|</span>
          <span className="text-slate-300">
            Higher & Technical Education Department
          </span>
        </div>
        <Link href="/" className="text-gold hover:underline text-[11px]">
          &larr; Return to Public Portal
        </Link>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-300 py-3.5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="group block">
            <span className="text-2xl font-serif font-bold text-navy tracking-tight block leading-tight">
              CivicResolve
            </span>
            <span className="text-[11px] text-slate-600 block">
              Official Single Sign-On Gateway &bull; Role-Based Authorization
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-navy font-semibold px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-block text-[11px] font-semibold text-navy bg-gold/15 border border-gold/40 px-2.5 py-0.5 uppercase tracking-wider mb-2">
            Secure Portal Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy leading-tight">
            Select Your Administrative Role
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Choose your authorized stakeholder category below to access your dedicated management portal.
          </p>
        </div>

        {/* 3 Profile / Role Selection Tiles (Plain Bordered Boxes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`text-left p-5 border transition-all focus:outline-none ${
                  isSelected
                    ? "bg-white border-navy ring-2 ring-navy/20 shadow-xs"
                    : "bg-white/80 border-slate-300 hover:bg-white hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xs border ${
                      isSelected
                        ? "bg-navy text-gold border-gold/40"
                        : "bg-slate-100 text-navy border-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 border ${
                      isSelected
                        ? "bg-navy/5 text-navy border-navy/30"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {r.badge}
                  </span>
                </div>

                <h2 className="text-base font-serif font-bold text-navy mb-1">
                  {r.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {r.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {isSelected ? "Selected Service" : "Click to select"}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-navy bg-navy text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Credentials Form Box */}
        <div className="max-w-md mx-auto w-full bg-white border border-slate-300 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                Authenticating as
              </span>
              <h3 className="font-serif font-bold text-navy text-lg">
                {activeRoleConfig.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                SSO Active
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                placeholder="name@domain.gov.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                placeholder="••••••••"
              />
            </div>

            {/* Quick Demo Fill Note */}
            <div className="bg-slate-50 border border-slate-200 p-2.5 text-[11.5px] text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <KeyRound className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span className="truncate">
                  Demo User: <strong className="text-slate-800">{activeRoleConfig.demoUser}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(activeRoleConfig.demoEmail);
                  setPassword(activeRoleConfig.demoPass);
                }}
                className="text-[11px] text-navy font-semibold underline ml-2 flex-shrink-0 hover:text-navyLight"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-navy text-gold text-xs font-bold border border-gold hover:bg-navyLight disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              {isLoading ? "Validating Credentials..." : `Access ${activeRoleConfig.title}`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-300 py-4 px-4 sm:px-8 text-xs text-slate-600 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.
          </div>
          <div className="text-slate-500">
            State Unified Grievance & Technical Problem Solving Gateway
          </div>
        </div>
      </footer>
    </div>
  );
}
