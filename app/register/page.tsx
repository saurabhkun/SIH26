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
  const [tier, setTier] = useState<"L1" | "L2" | "L3R" | "L3G">("L2");
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
        tier: role === "college" ? tier : undefined,
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
    <div className="min-h-screen bg-[#FFEFD3]/30 flex flex-col justify-between text-[#001B2E]">
      {/* Top Banner */}
      <div className="bg-[#001B2E] text-white py-2.5 px-4 sm:px-8 border-b border-[#FFC49B]/30 flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">Government of Jharkhand</span>
          <span className="text-[#FFC49B]">|</span>
          <span className="text-[#ADB6C4]">Smart India Hackathon 2026 &bull; PS 26043</span>
        </div>
        <Link href="/" className="text-[#FFC49B] hover:underline flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
        </Link>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        <div className="bg-white border border-[#294C60]/20 rounded-md shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#001B2E] text-white p-6 sm:p-8 border-b border-[#FFC49B]/30">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#FFC49B] text-[#001B2E]">
                Institutional Registration
              </span>
              <span className="text-xs text-[#ADB6C4]">CivicResolve Autonomous Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FFEFD3]">
              Join the State R&amp;D Innovation Ecosystem
            </h1>
            <p className="text-xs sm:text-sm text-[#ADB6C4] mt-1">
              Onboard your accredited higher education institution or corporate CSR foundation to resolve grassroots challenges across Jharkhand.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 border-b border-[#294C60]/15 bg-[#FFEFD3]/40">
            <button
              type="button"
              onClick={() => {
                setRole("college");
                setErrorMsg("");
              }}
              className={`py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-colors border-b-2 ${
                role === "college"
                  ? "bg-white text-[#001B2E] border-[#FFC49B] shadow-xs"
                  : "text-[#294C60] border-transparent hover:bg-white/60"
              }`}
            >
              <GraduationCap className="w-5 h-5 text-[#294C60]" />
              <span>University / College</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("industry");
                setErrorMsg("");
              }}
              className={`py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-colors border-b-2 ${
                role === "industry"
                  ? "bg-white text-[#001B2E] border-[#FFC49B] shadow-xs"
                  : "text-[#294C60] border-transparent hover:bg-white/60"
              }`}
            >
              <Briefcase className="w-5 h-5 text-[#294C60]" />
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
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
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
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
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      District (Jharkhand) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B] bg-white"
                      >
                        {JHARKHAND_DISTRICTS.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name} ({d.division} Division)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      Academic Tier *
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as "L1" | "L2" | "L3R" | "L3G")}
                      className="w-full px-3 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B] bg-white font-medium"
                    >
                      <option value="L1">Tier L1 — Premier Research (IIT, NIT, BIT)</option>
                      <option value="L2">Tier L2 — State Technical Universities / Eng. Colleges</option>
                      <option value="L3R">Tier L3R — Regional Colleges (Lab &amp; Field Testing)</option>
                      <option value="L3G">Tier L3G — Local Polytechnic &amp; Ground Logistics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      Faculty Lead / Dean Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        required
                        value={facultyLeadName}
                        onChange={(e) => setFacultyLeadName(e.target.value)}
                        placeholder="Dr. Ananya Sen"
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      Lab Equipment &amp; Capabilities Tags (Type and press Enter)
                    </label>
                    <div className="relative">
                      <FlaskConical className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        value={labEquipmentInput}
                        onChange={(e) => setLabEquipmentInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="e.g. Gas Chromatography, Soil Nitrate Sensor, Drone Telemetry..."
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {labEquipmentTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFEFD3] text-[#001B2E] border border-[#FFC49B] text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-[#294C60] hover:text-red-700 font-bold"
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
                {/* Industry Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      Corporate / Foundation Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Tata Steel Foundation / Coal India CSR"
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      MCA CSR Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={csrRegistrationNo}
                      onChange={(e) => setCsrRegistrationNo(e.target.value)}
                      placeholder="CSR00012345"
                      className="w-full px-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      Corporate Contact Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-[#ADB6C4]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="csr.lead@corporation.com"
                        className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
                      Primary CSR Domain Focus
                    </label>
                    <select
                      value={csrDomainFocus}
                      onChange={(e) => setCsrDomainFocus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B] bg-white font-medium"
                    >
                      {ISSUE_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Password Credentials */}
            <div className="border-t border-[#294C60]/15 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
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
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#294C60] mb-1.5">
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
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#294C60]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#FFC49B]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#294C60] hover:text-[#001B2E] hover:underline flex items-center gap-1"
              >
                Already registered? Sign In &rarr;
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-7 py-3 bg-[#001B2E] hover:bg-[#294C60] text-[#FFEFD3] font-bold text-sm rounded shadow-md transition-all flex items-center justify-center gap-2 border border-[#FFC49B]/30 disabled:opacity-60"
              >
                {loading ? "Registering Institution..." : "Complete Registration"}
                <ArrowRight className="w-4 h-4 text-[#FFC49B]" />
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-[#294C60] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Verified under Government of Jharkhand Societal Innovation Platform Protocol</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#294C60]/20 py-3 text-center text-xs text-[#294C60]">
        &copy; 2026 Department of Higher &amp; Technical Education, Government of Jharkhand.
      </footer>
    </div>
  );
}
