"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FlaskConical,
  Award,
  Check,
  X,
  Search,
  RefreshCw,
  ExternalLink,
  Layers,
  AlertCircle,
} from "lucide-react";
import { AuditProject } from "@/app/api/consultancy/audit/route";

export default function ConsultancyDashboardClient() {
  const [activeTab, setActiveTab] = useState<"assigned" | "inspect" | "certificates">("assigned");
  const [refreshing, setRefreshing] = useState(false);
  const [audits, setAudits] = useState<AuditProject[]>([]);
  const [firmName, setFirmName] = useState("Central Mine Planning & Design Institute (CMPDI)");
  const [accreditation, setAccreditation] = useState("NABET / QCI Accredited (Category A)");
  const [metrics, setMetrics] = useState({
    activeAudits: 0,
    pendingInspections: 0,
    completedCertifications: 0,
    totalDisbursementsUnlocked: 0,
  });

  // Selected project for inspection form
  const [selectedAudit, setSelectedAudit] = useState<AuditProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states
  const [inspectionVerdict, setInspectionVerdict] = useState<"APPROVED" | "DEFECTS_IDENTIFIED">("APPROVED");
  const [auditRemarks, setAuditRemarks] = useState("");
  const [customReportUrl, setCustomReportUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/consultancy/audit");
      const json = await res.json();
      if (json.success && json.data) {
        setAudits(json.data.audits || []);
        if (json.data.firmName) setFirmName(json.data.firmName);
        if (json.data.accreditation) setAccreditation(json.data.accreditation);
        if (json.data.metrics) setMetrics(json.data.metrics);
        if (!selectedAudit && json.data.audits?.length > 0) {
          setSelectedAudit(json.data.audits[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch consultancy audits:", err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedAudit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/consultancy/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId: selectedAudit.id,
          verdict: inspectionVerdict,
          remarks: auditRemarks,
          reportUrl: customReportUrl || "https://civicresolve.gov.in/reports/audit-cert-signed.pdf",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback(json.message, "success");
        setAuditRemarks("");
        loadData();
        setActiveTab("certificates");
      } else {
        showFeedback(json.error || "Inspection submission failed", "error");
      }
    } catch {
      showFeedback("Failed to submit inspection report", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAudits = audits.filter((a) => {
    const matchesSearch =
      searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1A365D] text-white p-6 shadow-md border border-slate-700">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Accredited Technical Audit &amp; Laboratory Assays Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
              {firmName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-slate-300">
              <span className="inline-flex items-center space-x-1 text-amber-300 font-semibold bg-amber-900/40 px-2 py-0.5 rounded border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{accreditation}</span>
              </span>
              <span>&bull;</span>
              <span>Third-Party Verification &amp; Statutory Compliance Desk</span>
            </div>
          </div>

          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium text-white transition-all shadow-xs backdrop-blur-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Projects"}</span>
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Assigned Active Audits</span>
            <strong className="text-xl font-bold text-amber-400 font-serif">{metrics.activeAudits} Projects</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Field Inspections In-Flight</span>
            <strong className="text-xl font-bold text-blue-400 font-serif">{metrics.pendingInspections} Inspections</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Approved Compliance Certs</span>
            <strong className="text-xl font-bold text-emerald-400 font-serif">{metrics.completedCertifications} Issued</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Milestone Escrow Unlocked</span>
            <strong className="text-xl font-bold text-purple-300 font-serif">₹{(metrics.totalDisbursementsUnlocked / 100000).toFixed(1)}L</strong>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-between shadow-xs animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "assigned"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Assigned Audit Projects ({audits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("inspect")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "inspect"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Milestone Inspection &amp; Lab Assay Form</span>
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === "certificates"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Statutory Compliance Certificates</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────
          TAB 1: Assigned Audit Projects List
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "assigned" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by tracking code, college, district, or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-hidden"
              >
                <option value="all">All Audits</option>
                <option value="Lab_Assay_In_Progress">Lab Assay In Progress</option>
                <option value="Field_Inspection_Scheduled">Field Inspection Scheduled</option>
                <option value="Report_Submitted">Report Submitted</option>
                <option value="Approved">Approved &amp; Certified</option>
              </select>
            </div>
          </div>

          {/* Audits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAudits.map((audit) => (
              <div
                key={audit.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-blue-950 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {audit.trackingCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        audit.status === "Approved"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : audit.status === "Lab_Assay_In_Progress"
                          ? "bg-purple-50 text-purple-800 border-purple-300 animate-pulse"
                          : "bg-blue-50 text-blue-800 border-blue-300"
                      }`}
                    >
                      {audit.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                    {audit.title}
                  </h3>

                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">HEI Innovator:</span>
                      <strong className="text-slate-800 truncate max-w-[180px]">{audit.collegeName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">CSR Sponsor:</span>
                      <span className="text-slate-800 font-semibold">{audit.sponsorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">District:</span>
                      <span className="text-slate-800 font-medium">{audit.district} ({audit.domain})</span>
                    </div>
                  </div>

                  {/* Current Active Milestone Box */}
                  <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{audit.currentMilestone.title}</span>
                      <span className="text-emerald-700 font-bold">₹{(audit.currentMilestone.fundingReleaseAmount / 1000).toFixed(0)}k Escrow</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {audit.currentMilestone.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Due: {audit.currentMilestone.targetDate}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAudit(audit);
                      setActiveTab("inspect");
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Inspect Milestone</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB 2: Milestone Inspection & Lab Certification Form
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "inspect" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Project Selector & Context */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-sm text-slate-900 mb-3">
                Select Project to Inspect
              </h3>
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {audits.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAudit(a)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                      selectedAudit?.id === a.id
                        ? "bg-blue-50 border-blue-900 ring-1 ring-blue-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-900">{a.trackingCode}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{a.district}</span>
                    </div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{a.title}</p>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{a.collegeName}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedAudit && (
              <div className="bg-blue-950 text-white p-5 rounded-xl shadow-md space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 font-semibold uppercase tracking-wider text-[10px]">
                    Inspection Criteria
                  </span>
                  <span className="bg-blue-800 px-2 py-0.5 rounded text-[10px] font-mono">
                    Tier {selectedAudit.tier} HEI
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-white">
                  {selectedAudit.currentMilestone.title}
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedAudit.currentMilestone.description}
                </p>
                <div className="pt-2 border-t border-blue-900 flex items-center justify-between text-amber-300 font-semibold">
                  <span>Authorized Milestone Escrow:</span>
                  <span className="text-base font-bold font-serif">₹{selectedAudit.currentMilestone.fundingReleaseAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Lab Testing & Sign-Off Form */}
          <div className="lg:col-span-2">
            {selectedAudit ? (
              <form onSubmit={handleInspectSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <div>
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                    Statutory Quality Audit
                  </span>
                  <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                    Field Assay Verification: {selectedAudit.trackingCode}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedAudit.title} &bull; <strong className="text-slate-700">{selectedAudit.collegeName}</strong>
                  </p>
                </div>

                {/* Lab Parameters Test Matrix */}
                <div>
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-700 mb-2.5">
                    Laboratory &amp; Field Test Results Matrix
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="p-2.5">Parameter Tested</th>
                          <th className="p-2.5">Statutory Standard</th>
                          <th className="p-2.5">Measured Field Value</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAudit.labParametersTested.map((param, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-semibold text-slate-800">{param.name}</td>
                            <td className="p-2.5 text-slate-600">{param.expectedStandard} {param.unit}</td>
                            <td className="p-2.5 font-mono font-bold text-blue-900">{param.measuredValue || "Tested Compliant"}</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>PASS</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Official Audit Document Attachment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uploaded Laboratory Assay Report / Certificate URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      placeholder="https://cmpdi.gov.in/assays/cert-jh-2026-wtr.pdf"
                      value={customReportUrl}
                      onChange={(e) => setCustomReportUrl(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomReportUrl("https://civicresolve.gov.in/reports/signed-lab-assay.pdf")}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                    >
                      Attach Sample PDF
                    </button>
                  </div>
                </div>

                {/* Technical Audit Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Auditor Technical Findings &amp; Chemical / Engineering Rationale *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detail spectroscopic readings, structural load resilience, field soil testing, and compliance with statutory JSPCB / CPCB guidelines..."
                    value={auditRemarks}
                    onChange={(e) => setAuditRemarks(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-hidden"
                  />
                </div>

                {/* Verdict Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Third-Party Inspection Decision Verdict *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                        inspectionVerdict === "APPROVED"
                          ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="verdict"
                        checked={inspectionVerdict === "APPROVED"}
                        onChange={() => setInspectionVerdict("APPROVED")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <strong className="block text-xs font-bold text-emerald-950">
                          Verification Approval (100% Compliant)
                        </strong>
                        <span className="text-[11px] text-emerald-800">
                          Issues statutory certificate &amp; authorizes CSR escrow release.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                        inspectionVerdict === "DEFECTS_IDENTIFIED"
                          ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="verdict"
                        checked={inspectionVerdict === "DEFECTS_IDENTIFIED"}
                        onChange={() => setInspectionVerdict("DEFECTS_IDENTIFIED")}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <strong className="block text-xs font-bold text-rose-950">
                          Defects Identified (Remediation Required)
                        </strong>
                        <span className="text-[11px] text-rose-800">
                          Holds escrow funds; triggers mandatory college revision window.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Submitting Audit &amp; Signing Compliance Certificate...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Sign &amp; Submit Statutory Third-Party Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Select an assigned project from the left panel to begin inspection.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB 3: Completed Audits & Certificates Archive
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "certificates" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
              Issued Technical Compliance Certificates Archive
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographically timestamped inspection certificates confirming third-party NABL/QCI verification for Jharkhand State Administration and CSR co-funders.
            </p>

            <div className="space-y-3">
              {audits
                .filter((a) => a.auditVerdict === "APPROVED" || a.status === "Approved")
                .map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                          {a.trackingCode}
                        </span>
                        <span className="text-xs font-semibold text-emerald-800">
                          {a.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <span>HEI: <strong>{a.collegeName}</strong></span>
                        <span>&bull;</span>
                        <span>CSR: <strong>{a.sponsorName}</strong></span>
                        <span>&bull;</span>
                        <span>District: <strong>{a.district}</strong></span>
                      </div>
                      {a.auditorRemarks && (
                        <p className="text-xs text-slate-600 italic mt-1">
                          &ldquo;{a.auditorRemarks}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={a.auditReportUrl || "https://civicresolve.gov.in/reports/signed-lab-assay.pdf"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Certificate PDF</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
