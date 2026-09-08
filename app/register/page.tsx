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
    <div className="min-h-screen bg-civic-canvas flex flex-col justify-between text-civic-textDark">
      {/* Top Banner */}
      <div className="bg-civic-primary text-white py-2 px-4 sm:px-8 border-b border-civic-primaryHover flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">Government of Jharkhand</span>
          <span className="text-civic-accent">|</span>
          <span className="text-slate-200">Higher &amp; Technical Education Department</span>
        </div>
        <Link href="/" className="text-civic-accent hover:text-white flex items-center gap-1 font-medium text-[11px] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
        </Link>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        <div className="bg-civic-surface border border-civic-border rounded-xl shadow-xs overflow-hidden">
          {/* Header */}
          <div className="bg-civic-surface p-6 sm:p-8 border-b border-civic-border">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-civic-accent/25 text-civic-primaryHover border border-civic-accent">
                Institutional Registration
              </span>
              <span className="text-xs text-civic-textMuted">CivicResolve Autonomous Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-civic-textDark">
              Join the State R&amp;D Innovation Ecosystem
            </h1>
            <p className="text-xs sm:text-sm text-civic-textMuted mt-1">
              Onboard your accredited higher education institution or corporate CSR foundation to resolve grassroots challenges across Jharkhand.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 border-b border-civic-border bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setRole("college");
                setErrorMsg("");
              }}
              className={`py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
                role === "college"
                  ? "bg-white text-civic-primary border-civic-primary font-bold shadow-xs"
                  : "text-civic-textMuted border-transparent hover:bg-slate-100 hover:text-civic-textDark"
              }`}
            >
              <GraduationCap className="w-5 h-5 text-civic-primary" />
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
                  ? "bg-white text-civic-primary border-civic-primary font-bold shadow-xs"
                  : "text-civic-textMuted border-transparent hover:bg-slate-100 hover:text-civic-textDark"
              }`}
            >
              <Briefcase className="w-5 h-5 text-civic-primary" />
              <span>Industry / CSR Partner</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {role === "college" ? (
              <>
                {/* University Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Institution Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <input
                        type="text"
                        required
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g. Birla Institute of Technology, Mesra / NIT Jamshedpur"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Official Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rnd.director@institution.ac.in"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      District (Jharkhand) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      >
                        {JHARKHAND_DISTRICTS.map((d) => (
                          <option key={d.name} value={d.name} className="bg-white text-civic-textDark">
                            {d.name} ({d.division})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Primary Faculty Lead / Dean of R&amp;D *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <input
                        type="text"
                        required
                        value={facultyLeadName}
                        onChange={(e) => setFacultyLeadName(e.target.value)}
                        placeholder="e.g. Dr. Sudhanshu Shekhar"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Available Specialized Lab Equipment &amp; R&amp;D Facilities
                    </label>
                    <div className="relative mb-2">
                      <FlaskConical className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <input
                        type="text"
                        value={labEquipmentInput}
                        onChange={(e) => setLabEquipmentInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Type equipment name and press Enter or comma (e.g. Water Quality Spectrophotometer)"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      />
                    </div>
                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1.5">
                      {labEquipmentTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-civic-accent/25 text-civic-primaryHover border border-civic-accent rounded-full text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-civic-primary hover:text-civic-primaryHover font-bold ml-1 cursor-pointer"
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Company / Foundation Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Tata Steel Foundation / Jindal CSR Wing"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Corporate / CSR Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="csr.lead@company.com"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      MCA CSR-1 Registration No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={csrRegistrationNo}
                      onChange={(e) => setCsrRegistrationNo(e.target.value)}
                      placeholder="e.g. CSR00012345"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                      Primary CSR Mandate / Societal Domain *
                    </label>
                    <select
                      value={csrDomainFocus}
                      onChange={(e) => setCsrDomainFocus(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                    >
                      {ISSUE_DOMAINS.map((domain) => (
                        <option key={domain} value={domain} className="bg-white text-civic-textDark">
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Password Credentials */}
            <div className="border-t border-civic-border pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-civic-textMuted" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-primary focus:border-civic-primary"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/login"
                className="text-xs font-semibold text-civic-primary hover:text-civic-primaryHover hover:underline flex items-center gap-1"
              >
                Already registered? Sign In &rarr;
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-7 py-2.5 bg-civic-primary hover:bg-civic-primaryHover text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Registering Institution..." : "Complete Registration"}
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-civic-textMuted flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified under Government of Jharkhand Societal Innovation Platform Protocol</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-4 text-center text-xs text-civic-textMuted">
        &copy; 2026 Department of Higher &amp; Technical Education, Government of Jharkhand.
      </footer>
    </div>
  );
}
