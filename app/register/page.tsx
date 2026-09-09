"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  FlaskConical,
  Building2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { JHARKHAND_DISTRICTS } from "@/lib/data/districts";
import { ISSUE_DOMAINS } from "@/lib/constants/domains";

type RegisterRole = "college" | "industry" | "gov_ro" | "consultancy";

const CONSULTANCY_DOMAINS = [
  "Water Effluent & Hydrology",
  "Geotechnical & Mine Reclamation",
  "Public Health Labs & Assays",
  "Environmental Impact Assessment",
  "Infrastructure & Structural Audits",
  "Air Quality & Toxic Gas Telemetry",
  "Soil Remediation & Bio-Assays",
];

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

  // Gov RO form state
  const [roFullName, setRoFullName] = useState("");
  const [roDesignation, setRoDesignation] = useState("District Research Officer & Nodal Evaluator");
  const [roDistrict, setRoDistrict] = useState("Ranchi");
  const [roEmployeeId, setRoEmployeeId] = useState("");

  // Consultancy form state
  const [consultancyName, setConsultancyName] = useState("");
  const [consultancyAccreditation, setConsultancyAccreditation] = useState("NABET / QCI / NABL Accredited");
  const [consultancyAddress, setConsultancyAddress] = useState("");
  const [consultancyDistrict, setConsultancyDistrict] = useState("Ranchi");
  const [consultancyLeadName, setConsultancyLeadName] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    "Water Effluent & Hydrology",
    "Geotechnical & Mine Reclamation",
  ]);

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

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      if (selectedDomains.length > 1) {
        setSelectedDomains(selectedDomains.filter((d) => d !== domain));
      }
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
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
        // College
        institutionName: role === "college" ? institutionName.trim() : undefined,
        district:
          role === "college"
            ? district
            : role === "gov_ro"
            ? roDistrict
            : role === "consultancy"
            ? consultancyDistrict
            : undefined,
        facultyLeadName: role === "college" ? facultyLeadName.trim() : undefined,
        labEquipment: role === "college" ? labEquipmentTags : undefined,
        // Industry
        companyName: role === "industry" ? companyName.trim() : undefined,
        csrRegistrationNo: role === "industry" ? csrRegistrationNo.trim() : undefined,
        csrDomainFocus: role === "industry" ? csrDomainFocus : undefined,
        // Gov RO
        fullName: role === "gov_ro" ? roFullName.trim() : undefined,
        designation: role === "gov_ro" ? roDesignation.trim() : undefined,
        employeeId: role === "gov_ro" ? roEmployeeId.trim() : undefined,
        // Consultancy
        firmName: role === "consultancy" ? consultancyName.trim() : undefined,
        accreditation: role === "consultancy" ? consultancyAccreditation.trim() : undefined,
        address: role === "consultancy" ? consultancyAddress.trim() : undefined,
        contactPerson: role === "consultancy" ? consultancyLeadName.trim() : undefined,
        domainExpertise: role === "consultancy" ? selectedDomains : undefined,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      setSuccessMsg(data.message || "Registration successful! Redirecting...");
      setTimeout(() => {
        router.push(data.redirectUrl || "/login");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="group block">
            <span className="text-2xl font-serif font-bold text-civic-primary tracking-tight block leading-tight">
              CivicResolve
            </span>
            <span className="text-[11px] text-civic-textMuted block">
              Official Institutional, Corporate &amp; Evaluator Registration
            </span>
          </Link>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs text-civic-primary hover:text-civic-primaryHover font-bold"
            >
              Sign In Instead
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-xs text-civic-primary font-semibold px-3 py-1.5 border border-civic-border bg-civic-canvas hover:bg-slate-200/70 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 text-civic-secondary" />
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="inline-block text-[11px] font-semibold text-civic-primaryHover bg-civic-accent/25 border border-civic-accent px-2.5 py-0.5 uppercase tracking-wider mb-2 rounded-full">
            Stakeholder Empanellment
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-civic-textDark leading-tight">
            Register for CivicResolve
          </h1>
          <p className="text-xs sm:text-sm text-civic-textMuted mt-1">
            Empanel your university R&amp;D lab, corporate CSR unit, state research office, or technical consultancy firm.
          </p>
        </div>

        {/* 4 Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {/* College Tab */}
          <button
            type="button"
            onClick={() => setRole("college")}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
              role === "college"
                ? "bg-civic-primary text-white border-civic-primary shadow-sm ring-2 ring-civic-primary"
                : "bg-civic-surface text-civic-textDark border-civic-border hover:bg-slate-50"
            }`}
          >
            <GraduationCap className={`w-5 h-5 mb-1 ${role === "college" ? "text-amber-300" : "text-civic-primary"}`} />
            <span className="font-serif font-bold text-xs">University / HEI</span>
            <span className={`text-[10px] mt-0.5 ${role === "college" ? "text-slate-200" : "text-civic-textMuted"}`}>
              Lab &amp; Student Teams
            </span>
          </button>

          {/* Industry Tab */}
          <button
            type="button"
            onClick={() => setRole("industry")}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
              role === "industry"
                ? "bg-civic-primary text-white border-civic-primary shadow-sm ring-2 ring-civic-primary"
                : "bg-civic-surface text-civic-textDark border-civic-border hover:bg-slate-50"
            }`}
          >
            <Briefcase className={`w-5 h-5 mb-1 ${role === "industry" ? "text-amber-300" : "text-civic-primary"}`} />
            <span className="font-serif font-bold text-xs">Industry &amp; CSR</span>
            <span className={`text-[10px] mt-0.5 ${role === "industry" ? "text-slate-200" : "text-civic-textMuted"}`}>
              Corporate Sponsors
            </span>
          </button>

          {/* Gov RO Tab */}
          <button
            type="button"
            onClick={() => setRole("gov_ro")}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
              role === "gov_ro"
                ? "bg-civic-primary text-white border-civic-primary shadow-sm ring-2 ring-civic-primary"
                : "bg-civic-surface text-civic-textDark border-civic-border hover:bg-slate-50"
            }`}
          >
            <FlaskConical className={`w-5 h-5 mb-1 ${role === "gov_ro" ? "text-amber-300" : "text-civic-primary"}`} />
            <span className="font-serif font-bold text-xs">Gov Research Officer</span>
            <span className={`text-[10px] mt-0.5 ${role === "gov_ro" ? "text-slate-200" : "text-civic-textMuted"}`}>
              District Feasibility Desk
            </span>
          </button>

          {/* Consultancy Tab */}
          <button
            type="button"
            onClick={() => setRole("consultancy")}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
              role === "consultancy"
                ? "bg-civic-primary text-white border-civic-primary shadow-sm ring-2 ring-civic-primary"
                : "bg-civic-surface text-civic-textDark border-civic-border hover:bg-slate-50"
            }`}
          >
            <Building2 className={`w-5 h-5 mb-1 ${role === "consultancy" ? "text-amber-300" : "text-civic-primary"}`} />
            <span className="font-serif font-bold text-xs">Technical Consultancy</span>
            <span className={`text-[10px] mt-0.5 ${role === "consultancy" ? "text-slate-200" : "text-civic-textMuted"}`}>
              NABL / QCI Audit Firm
            </span>
          </button>
        </div>

        {/* Registration Form Card */}
        <div className="bg-civic-surface border border-civic-border rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-civic-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-civic-secondary" />
              <h2 className="font-serif font-bold text-civic-textDark text-sm sm:text-base">
                {role === "college" && "University R&D Cell Registration"}
                {role === "industry" && "Corporate CSR Partner Registration"}
                {role === "gov_ro" && "Government Research Officer (RO) Verification"}
                {role === "consultancy" && "Technical Consultancy Firm Empanellment"}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-civic-textMuted uppercase tracking-wider">
              {role.toUpperCase()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. College Specific Fields */}
            {role === "college" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Institution / College Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Birla Institute of Technology, Mesra"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Campus District (Jharkhand) *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    >
                      {JHARKHAND_DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.division} Division)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Faculty R&amp;D Lead / Dean Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Ananya Sen"
                      value={facultyLeadName}
                      onChange={(e) => setFacultyLeadName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Lab Facilities &amp; Equipment (Type &amp; Enter)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Soil pH Analyzer, Press Enter"
                      value={labEquipmentInput}
                      onChange={(e) => setLabEquipmentInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>
                </div>

                {labEquipmentTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {labEquipmentTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[11px] font-semibold bg-civic-accent/30 text-civic-primaryHover border border-civic-accent px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 hover:text-red-700 cursor-pointer font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Industry Specific Fields */}
            {role === "industry" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Corporate / Foundation Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Steel Foundation / Coal India CSR"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      MCA CSR-1 Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSR00012345"
                      value={csrRegistrationNo}
                      onChange={(e) => setCsrRegistrationNo(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-civic-textDark mb-1">
                    Primary CSR Co-funding Focus Domain
                  </label>
                  <select
                    value={csrDomainFocus}
                    onChange={(e) => setCsrDomainFocus(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                  >
                    {ISSUE_DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3. Gov RO Specific Fields */}
            {role === "gov_ro" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Officer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Birendra Mahato"
                      value={roFullName}
                      onChange={(e) => setRoFullName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Official Designation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. District Research Officer / State Technical Evaluator"
                      value={roDesignation}
                      onChange={(e) => setRoDesignation(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Assigned District Jurisdiction *
                    </label>
                    <select
                      value={roDistrict}
                      onChange={(e) => setRoDistrict(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    >
                      <option value="State Headquarters">State Headquarters (All 24 Districts)</option>
                      {JHARKHAND_DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.division} Division)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Government Employee ID / Officer Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. JH-RO-8842"
                      value={roEmployeeId}
                      onChange={(e) => setRoEmployeeId(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Technical Consultancy Specific Fields */}
            {role === "consultancy" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Firm / Agency Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Central Mine Planning & Design Institute (CMPDI)"
                      value={consultancyName}
                      onChange={(e) => setConsultancyName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Accreditation / Certification *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NABET / QCI / NABL Accredited"
                      value={consultancyAccreditation}
                      onChange={(e) => setConsultancyAccreditation(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Lead Consultant / Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Alok K. Mishra"
                      value={consultancyLeadName}
                      onChange={(e) => setConsultancyLeadName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-civic-textDark mb-1">
                      Registered Office District *
                    </label>
                    <select
                      value={consultancyDistrict}
                      onChange={(e) => setConsultancyDistrict(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                    >
                      {JHARKHAND_DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-civic-textDark mb-1">
                    Registered Office Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gondwana Place, Kanke Road, Ranchi, Jharkhand"
                    value={consultancyAddress}
                    onChange={(e) => setConsultancyAddress(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-civic-textDark mb-2">
                    Primary Domain Expertise (Select all applicable) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONSULTANCY_DOMAINS.map((dom) => {
                      const isChecked = selectedDomains.includes(dom);
                      return (
                        <button
                          type="button"
                          key={dom}
                          onClick={() => toggleDomain(dom)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
                            isChecked
                              ? "bg-blue-900 text-white border-blue-900 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>{isChecked ? "✓" : "+"}</span>
                          <span>{dom}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Shared Account Credentials */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-civic-primary">
                Portal Sign-In Credentials
              </h3>

              <div>
                <label className="block text-xs font-semibold text-civic-textDark mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder={
                    role === "college"
                      ? "rnd@bitmesra.ac.in"
                      : role === "industry"
                      ? "csr@tatasteel.com"
                      : role === "gov_ro"
                      ? "ro.evaluator@jharkhand.gov.in"
                      : "audit.lead@cmpdi.co.in"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-civic-textDark mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-civic-textDark mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-primary outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-civic-primary hover:bg-civic-primaryHover text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span>Registering Organization &amp; Generating Credentials...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Complete Empanellment &amp; Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-4 px-4 text-center text-xs text-civic-textMuted">
        <p>
          CivicResolve &bull; Department of Higher &amp; Technical Education &bull; Government of Jharkhand
        </p>
      </footer>
    </div>
  );
}
