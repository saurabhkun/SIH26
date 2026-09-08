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
      <div className="bg-[#001422] text-white text-xs py-1.5 px-4 sm:px-8 border-b border-[#294C60]/80 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">
            Government of Jharkhand
          </span>
          <span className="text-[#FFC49B]">|</span>
          <span className="text-[#ADB6C4]">
            Higher & Technical Education Department
          </span>
        </div>
        <Link href="/" className="text-[#FFC49B] hover:underline text-[11px]">
          &larr; Return to Public Portal
        </Link>
      </div>

      {/* Main Navbar */}
      <header className="bg-[#001B2E] border-b border-[#294C60]/70 py-3.5 px-4 sm:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="group block">
            <span className="text-2xl font-serif font-bold text-white tracking-tight block leading-tight">
              CivicResolve
            </span>
            <span className="text-[11px] text-[#ADB6C4] block">
              Official Single Sign-On Gateway &bull; Role-Based Authorization
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[#FFEFD3] font-semibold px-3 py-1.5 border border-[#294C60] bg-[#294C60]/40 hover:bg-[#294C60] rounded-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1 text-[#FFC49B]" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-block text-[11px] font-semibold text-[#FFC49B] bg-[#294C60]/40 border border-[#FFC49B]/30 px-2.5 py-0.5 uppercase tracking-wider mb-2 rounded-xs">
            Secure Portal Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
            Select Your Administrative Role
          </h1>
          <p className="text-xs sm:text-sm text-[#ADB6C4] mt-1">
            Choose your authorized stakeholder category below to access your dedicated management portal.
          </p>
        </div>

        {/* 3 Profile / Role Selection Tiles (Bordered Blue Boxes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`text-left p-5 border transition-all focus:outline-none rounded-xs cursor-pointer shadow-md ${
                  isSelected
                    ? "bg-[#294C60]/70 border-[#FFC49B] ring-1 ring-[#FFC49B]"
                    : "bg-[#001B2E] border-[#294C60]/70 hover:bg-[#294C60]/30 hover:border-[#294C60]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xs border ${
                      isSelected
                        ? "bg-[#FFC49B] text-[#001B2E] border-[#FFC49B]"
                        : "bg-[#294C60]/40 text-[#FFC49B] border-[#294C60]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 border rounded-xs ${
                      isSelected
                        ? "bg-[#FFC49B]/20 text-[#FFC49B] border-[#FFC49B]/50"
                        : "bg-[#001422] text-[#ADB6C4] border-[#294C60]"
                    }`}
                  >
                    {r.badge}
                  </span>
                </div>

                <h2 className="text-base font-serif font-bold text-white mb-1">
                  {r.title}
                </h2>
                <p className="text-xs text-[#ADB6C4] leading-relaxed">
                  {r.description}
                </p>

                <div className="mt-4 pt-3 border-t border-[#294C60]/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#ADB6C4]/80">
                    {isSelected ? "Selected Service" : "Click to select"}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-[#FFC49B] bg-[#FFC49B] text-[#001B2E]"
                        : "border-[#294C60] bg-[#001422]"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#001B2E]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Credentials Form Box */}
        <div className="max-w-md mx-auto w-full bg-[#001625] border border-[#294C60] p-6 sm:p-8 rounded-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-[#294C60]/60 pb-3 mb-5">
            <div>
              <span className="text-[11px] text-[#ADB6C4] uppercase tracking-wider block">
                Authenticating as
              </span>
              <h3 className="font-serif font-bold text-white text-lg">
                {activeRoleConfig.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 font-medium rounded-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                SSO Active
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 text-xs text-red-200 flex items-start gap-2 rounded-xs">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#FFEFD3] mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#001B2E] border border-[#294C60] text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:border-[#FFC49B] focus:ring-1 focus:ring-[#FFC49B] rounded-xs"
                placeholder="name@domain.gov.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#FFEFD3] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#001B2E] border border-[#294C60] text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:border-[#FFC49B] focus:ring-1 focus:ring-[#FFC49B] rounded-xs"
                placeholder="••••••••"
              />
            </div>

            {/* Quick Demo Fill Note */}
            <div className="bg-[#001B2E] border border-[#294C60] p-2.5 text-[11.5px] text-[#ADB6C4] flex items-center justify-between rounded-xs">
              <div className="flex items-center gap-1.5 truncate">
                <KeyRound className="w-3.5 h-3.5 text-[#FFC49B] flex-shrink-0" />
                <span className="truncate">
                  Demo User: <strong className="text-white">{activeRoleConfig.demoUser}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(activeRoleConfig.demoEmail);
                  setPassword(activeRoleConfig.demoPass);
                }}
                className="text-[11px] text-[#FFC49B] font-semibold underline ml-2 flex-shrink-0 hover:text-white cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#FFC49B] text-[#001B2E] text-xs font-bold border border-[#FFC49B] hover:bg-[#FFC49B]/90 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2 rounded-xs shadow-md cursor-pointer transition-colors"
            >
              {isLoading ? "Validating Credentials..." : `Access ${activeRoleConfig.title}`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {selectedRole !== "gov" && (
              <div className="pt-2 text-center border-t border-[#294C60]/60 mt-4">
                <p className="text-xs text-[#ADB6C4]">
                  New institution or CSR partner?{" "}
                  <Link href="/register" className="font-bold text-[#FFC49B] underline hover:text-white">
                    Register Account &rarr;
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Official Footer */}
      <footer className="bg-[#001422] border-t border-[#294C60]/70 py-4 px-4 sm:px-8 text-xs text-[#ADB6C4] mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.
          </div>
          <div className="text-[#ADB6C4]/70">
            State Unified Grievance & Technical Problem Solving Gateway
          </div>
        </div>
      </footer>
    </div>
  );
}
