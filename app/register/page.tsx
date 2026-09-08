"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  MapPin,
  User,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { JHARKHAND_DISTRICTS } from "@/lib/data/districts";
import { ISSUE_DOMAINS } from "@/lib/constants/domains";

type RegisterRole = "college" | "industry";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>("college");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Shared state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // College form state
  const [institutionName, setInstitutionName] = useState("");
  const [district, setDistrict] = useState(JHARKHAND_DISTRICTS[0].name);
  const [facultyLeadName, setFacultyLeadName] = useState("");
  const [labEquipmentInput, setLabEquipmentInput] = useState("");
  const [labEquipmentTags, setLabEquipmentTags] = useState<string[]>([
    "Water Quality Spectrophotometer",
    "IoT Microcontroller Testbench",
  ]);

  // Industry form state
  const [companyName, setCompanyName] = useState("");
  const [csrRegistrationNo, setCsrRegistrationNo] = useState("");
  const [csrDomainFocus, setCsrDomainFocus] = useState<string>("Water");

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = labEquipmentInput.trim().replace(/,/g, "");
      if (val && !labEquipmentTags.includes(val)) {
        setLabEquipmentTags([...labEquipmentTags, val]);
        setLabEquipmentInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLabEquipmentTags(labEquipmentTags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please retype carefully.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        email: email.trim(),
        password,
        institutionName: role === "college" ? institutionName.trim() : undefined,
        district: role === "college" ? district : undefined,
        facultyLeadName: role === "college" ? facultyLeadName.trim() : undefined,
        labEquipment: role === "college" ? labEquipmentTags : undefined,
        companyName: role === "industry" ? companyName.trim() : undefined,
        csrRegistrationNo: role === "industry" ? csrRegistrationNo.trim() : undefined,
        csrDomainFocus: role === "industry" ? csrDomainFocus : undefined,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please check your inputs.");
      }

      setSuccessMsg(data.message || "Account registered successfully! Redirecting...");
      setTimeout(() => {
        router.push(data.redirectUrl || (role === "college" ? "/dashboard/college" : "/dashboard/industry"));
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected registration error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001B2E] flex flex-col justify-between text-[#FFEFD3]">
      {/* Top Banner */}
      <div className="bg-[#001422] text-white py-2.5 px-4 sm:px-8 border-b border-[#294C60]/80 flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">Government of Jharkhand</span>
          <span className="text-[#FFC49B]">|</span>
          <span className="text-[#ADB6C4]">Smart India Hackathon 2026 &bull; PS 26043</span>
        </div>
        <Link href="/" className="text-[#FFC49B] hover:underline flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
        </Link>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        <div className="bg-[#001625] border border-[#294C60] rounded-xs shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#001422] text-white p-6 sm:p-8 border-b border-[#294C60]">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-xs text-[11px] font-bold uppercase tracking-wider bg-[#FFC49B] text-[#001B2E]">
                Institutional Registration
              </span>
              <span className="text-xs text-[#ADB6C4]">CivicResolve Autonomous Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Join the State R&amp;D Innovation Ecosystem
            </h1>
            <p className="text-xs sm:text-sm text-[#ADB6C4] mt-1">
              Onboard your accredited higher education institution or corporate CSR foundation to resolve grassroots challenges across Jharkhand.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 border-b border-[#294C60] bg-[#001B2E]">
            <button
              type="button"
              onClick={() => {
                setRole("college");
                setErrorMsg("");
              }}
              className={`py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
                role === "college"
                  ? "bg-[#294C60]/60 text-white border-[#FFC49B] shadow-xs"
                  : "text-[#ADB6C4] border-transparent hover:bg-[#294C60]/30 hover:text-white"
              }`}
            >
              <GraduationCap className="w-5 h-5 text-[#FFC49B]" />
              <span>University / College</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("industry");
                setErrorMsg("");
              }}
              className={`py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
                role === "industry"
                  ? "bg-[#294C60]/60 text-white border-[#FFC49B] shadow-xs"
                  : "text-[#ADB6C4] border-transparent hover:bg-[#294C60]/30 hover:text-white"
              }`}
            >
              <Briefcase className="w-5 h-5 text-[#FFC49B]" />
              <span>Industry / CSR Partner</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border-l-4 border-red-600 rounded text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-600 rounded text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {role === "college" ? (
              <>
                {/* University Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Institution Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        required
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g. Birla Institute of Technology, Mesra / NIT Jamshedpur"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Official Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rnd.director@institution.ac.in"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      District (Jharkhand) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      >
                        {JHARKHAND_DISTRICTS.map((d) => (
                          <option key={d.name} value={d.name} className="bg-[#001B2E] text-white">
                            {d.name} ({d.division})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Primary Faculty Lead / Dean of R&amp;D *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        required
                        value={facultyLeadName}
                        onChange={(e) => setFacultyLeadName(e.target.value)}
                        placeholder="e.g. Dr. Sudhanshu Shekhar"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Available Specialized Lab Equipment &amp; R&amp;D Facilities
                    </label>
                    <div className="relative mb-2">
                      <FlaskConical className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        value={labEquipmentInput}
                        onChange={(e) => setLabEquipmentInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Type equipment name and press Enter or comma (e.g. Water Quality Spectrophotometer)"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      />
                    </div>
                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1.5">
                      {labEquipmentTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#294C60]/50 text-[#FFEFD3] border border-[#294C60] rounded-xs text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-[#FFC49B] hover:text-white font-bold ml-1 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Industry / CSR Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Company / Foundation Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Tata Steel Foundation / Jindal CSR Wing"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Corporate / CSR Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="csr.lead@company.com"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      MCA CSR-1 Registration No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={csrRegistrationNo}
                      onChange={(e) => setCsrRegistrationNo(e.target.value)}
                      placeholder="e.g. CSR00012345"
                      className="w-full px-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                      Primary CSR Mandate / Societal Domain *
                    </label>
                    <select
                      value={csrDomainFocus}
                      onChange={(e) => setCsrDomainFocus(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                    >
                      {ISSUE_DOMAINS.map((domain) => (
                        <option key={domain} value={domain} className="bg-[#001B2E] text-white">
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Password Credentials */}
            <div className="border-t border-[#294C60]/60 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FFEFD3] mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#001B2E] border border-[#294C60] rounded-xs text-white placeholder-[#ADB6C4]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC49B] focus:border-[#FFC49B]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#FFC49B] hover:text-white hover:underline flex items-center gap-1"
              >
                Already registered? Sign In &rarr;
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-7 py-3 bg-[#FFC49B] hover:bg-[#FFC49B]/90 text-[#001B2E] font-bold text-sm rounded-xs shadow-md transition-all flex items-center justify-center gap-2 border border-[#FFC49B] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Registering Institution..." : "Complete Registration"}
                <ArrowRight className="w-4 h-4 text-[#001B2E]" />
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-[#ADB6C4] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified under Government of Jharkhand Societal Innovation Platform Protocol</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#001422] border-t border-[#294C60]/70 py-3 text-center text-xs text-[#ADB6C4]">
        &copy; 2026 Department of Higher &amp; Technical Education, Government of Jharkhand.
      </footer>
    </div>
  );
}
