"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
  Building2,
  Users,
  Check,
  X,
  Star,
  Send,
  Sparkles,
} from "lucide-react";
import { EvidenceMediaViewer } from "@/components/EvidenceMediaViewer";
import { VoiceAudioPlayer } from "@/components/VoiceAudioPlayer";
import { evaluateRoutingDestination } from "@/lib/triage/institutionalRouting";

export interface RoutingFactors {
  isSensitive: boolean;
  sensitivityLevel: string;
  existingGovtRO: boolean;
  hasDedicatedBudget: boolean;
  govtCapacityStatus: string;
  uniCapabilityScore: number;
  eligibleUniversities: string[];
}

export interface RoutingRecommendation {
  routingDecision: "GOVT_DEPT" | "GOVT_RO" | "UNIVERSITY_RESEARCH_ORG";
  confidenceScore: number;
  factors: RoutingFactors;
  rationale: string;
}

interface IssueItem {
  _id: string;
  trackingCode: string;
  title: string;
  description: string;
  domain: string;
  district: string;
  severityScore: number;
  isStarred?: boolean;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiAnalysisReason?: string;
  suggestedDepartment?: string;
  triageAction?: "pending_super_admin_review" | "accepted" | "rejected" | "assigned_to_govt_dept";
  assignedDepartment?: string;
  rejectionReason?: string;
  maintenanceNotes?: string;
  routingRecommendation?: RoutingRecommendation;
  status: string;
  citizenName: string;
  citizenPhone?: string;
  address?: string;
  mediaUrls?: string[];
  attachments?: { url: string; type: "photo" | "video" | "document" }[];
  audioUrl?: string;
  aiTags?: string[];
  reviewedBy?: string;
  createdAt: string;
}

interface DepartmentMatrixItem {
  id: string;
  name: string;
  head: string;
  email: string;
  categories: string[];
  activeTickets: number;
  slaHours: number;
  status: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  issueCode: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

interface UserRosterItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  district?: string;
  organizationName?: string;
}

export default function SuperAdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<"triage" | "departments" | "audit" | "users">("triage");
  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentMatrixItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [users, setUsers] = useState<UserRosterItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalPipeline: 0,
    pendingSuperAdminReview: 0,
    acceptedForResearch: 0,
    assignedToGovtDepts: 0,
    rejectedComplaints: 0,
  });

  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [triageFilter, setTriageFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("Duplicate / already under maintenance");

  // Route to dept modal
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState("pwd-roads");
  const [deptNotes, setDeptNotes] = useState("");

  // Interactive Smart Routing Overrides & College Multi-Select
  const [triageSensOverride, setTriageSensOverride] = useState<boolean | null>(null);
  const [triageBudgetOverride, setTriageBudgetOverride] = useState<boolean | null>(null);
  const [triageCapacityOverride, setTriageCapacityOverride] = useState<"Available" | "High / Saturated" | null>(null);
  const [selectedCollegesForAllocation, setSelectedCollegesForAllocation] = useState<string[]>([]);

  useEffect(() => {
    if (selectedIssue?.routingRecommendation) {
      setTriageSensOverride(selectedIssue.routingRecommendation.factors.isSensitive);
      setTriageBudgetOverride(selectedIssue.routingRecommendation.factors.hasDedicatedBudget);
      setTriageCapacityOverride(
        selectedIssue.routingRecommendation.factors.govtCapacityStatus === "High / Saturated"
          ? "High / Saturated"
          : "Available"
      );
      setSelectedCollegesForAllocation(
        selectedIssue.routingRecommendation.factors.eligibleUniversities || []
      );
    } else {
      setTriageSensOverride(null);
      setTriageBudgetOverride(null);
      setTriageCapacityOverride(null);
      setSelectedCollegesForAllocation([]);
    }
  }, [selectedIssue]);

  const activeRoutingEval = selectedIssue
    ? evaluateRoutingDestination(
        {
          title: selectedIssue.title,
          description: selectedIssue.description,
          domain: selectedIssue.domain,
          severityScore: selectedIssue.severityScore,
          priority: selectedIssue.priority,
          aiTags: selectedIssue.aiTags,
          district: selectedIssue.district,
          sensitivityLevel: triageSensOverride ? "Policy Sensitive" : "Public",
          hasYearlyBudget: triageBudgetOverride ?? undefined,
        },
        {
          hasDedicatedBudget: triageBudgetOverride ?? undefined,
          govtROCapacity: triageCapacityOverride ?? undefined,
          sensitivityLevel: triageSensOverride ? "Policy Sensitive" : "Public",
        }
      )
    : null;

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/gov/super-admin");
      const json = await res.json();
      if (json.success && json.data) {
        setIssues(json.data.issues || []);
        setDepartments(json.data.departments || []);
        setAuditLogs(json.data.auditLogs || []);
        setUsers(json.data.users || []);
        if (json.data.metrics) setMetrics(json.data.metrics);
        if (!selectedIssue && json.data.issues?.length > 0) {
          setSelectedIssue(json.data.issues[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load Super Admin data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedIssue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleAccept = async (issueId: string, assignedColleges?: string[]) => {
    try {
      setActionInProgress(`accept-${issueId}`);
      const res = await fetch("/api/gov/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", issueId, assignedColleges }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        loadData();
      } else {
        showFeedback(data.error || "Accept action failed", "error");
      }
    } catch {
      showFeedback("Failed to accept issue", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      setActionInProgress(`reject-${selectedIssue._id}`);
      const res = await fetch("/api/gov/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          issueId: selectedIssue._id,
          reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        setRejectModalOpen(false);
        loadData();
      } else {
        showFeedback(data.error || "Reject action failed", "error");
      }
    } catch {
      showFeedback("Failed to reject issue", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      setActionInProgress(`route-${selectedIssue._id}`);
      const res = await fetch("/api/gov/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_dept",
          issueId: selectedIssue._id,
          departmentId: selectedDeptId,
          notes: deptNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        setRouteModalOpen(false);
        setDeptNotes("");
        loadData();
      } else {
        showFeedback(data.error || "Routing action failed", "error");
      }
    } catch {
      showFeedback("Failed to route issue", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      searchQuery === "" ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTriage =
      triageFilter === "all" ||
      (triageFilter === "pending" && (!i.triageAction || i.triageAction === "pending_super_admin_review")) ||
      i.triageAction === triageFilter;

    return matchesSearch && matchesTriage;
  });

  return (
    <div className="space-y-6">
      {/* Super Admin Apex Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#312E81] text-white p-6 shadow-md border border-slate-700">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cabinet Secretariat &bull; Chief Super Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
              State Master Triage &amp; Lifecycle Router
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl mt-1">
              Apex oversight over all citizen submissions across Jharkhand. Accept research-worthy challenges for <strong>Research Organizations</strong>, route standard municipal upkeep directly to <strong>Govt Maintenance Departments</strong>, or filter invalid submissions with logged audit trails.
            </p>
          </div>

          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium text-white transition-all shadow-xs backdrop-blur-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing Master Data..." : "Refresh Pipeline"}</span>
          </button>
        </div>

        {/* Master KPI Counters */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Global Pipeline</span>
            <strong className="text-xl font-bold text-white font-serif">{metrics.totalPipeline} Total</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-amber-400 block font-medium">Pending Super Admin</span>
            <strong className="text-xl font-bold text-amber-400 font-serif">{metrics.pendingSuperAdminReview} To Review</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-emerald-400 block font-medium">Accepted (Research Org)</span>
            <strong className="text-xl font-bold text-emerald-400 font-serif">{metrics.acceptedForResearch} Active</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-blue-300 block font-medium">Assigned to Depts</span>
            <strong className="text-xl font-bold text-blue-300 font-serif">{metrics.assignedToGovtDepts} In Field</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-rose-400 block font-medium">Rejected Complaints</span>
            <strong className="text-xl font-bold text-rose-400 font-serif">{metrics.rejectedComplaints} Filtered</strong>
          </div>
        </div>
      </div>

      {/* Real-time feedback alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-between shadow-xs animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-200"
              : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-200"
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
      <div className="flex border-b border-slate-200 dark:border-[#334155] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("triage")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === "triage"
              ? "border-blue-900 dark:border-amber-400 text-blue-900 dark:text-amber-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Global Master Triage ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === "departments"
              ? "border-blue-900 dark:border-amber-400 text-blue-900 dark:text-amber-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Directory &amp; Routing Matrix ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === "audit"
              ? "border-blue-900 dark:border-amber-400 text-blue-900 dark:text-amber-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>System Audit Logs &amp; Overrides</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === "users"
              ? "border-blue-900 dark:border-amber-400 text-blue-900 dark:text-amber-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User &amp; Officer Role Roster</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────
          TAB 1: Master Triage Queue
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "triage" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search master pipeline by tracking code, district, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#334155] rounded-lg outline-hidden text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Triage Filter:</span>
              <select
                value={triageFilter}
                onChange={(e) => setTriageFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 outline-hidden text-slate-800 dark:text-slate-100"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Super Admin Review</option>
                <option value="accepted">Accepted (Research Org)</option>
                <option value="assigned_to_govt_dept">Assigned to Govt Dept</option>
                <option value="rejected">Rejected Complaints</option>
              </select>
            </div>
          </div>

          {/* Master Triage Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Complaint Cards */}
            <div className="lg:col-span-5 space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {filteredIssues.length === 0 ? (
                <div className="bg-white dark:bg-[#1E293B] p-8 rounded-xl border border-slate-200 dark:border-[#334155] text-center text-xs text-slate-500">
                  No issues found matching the active filter.
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const isSelected = selectedIssue?._id === issue._id;
                  const isPending = !issue.triageAction || issue.triageAction === "pending_super_admin_review";

                  return (
                    <div
                      key={issue._id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-900 dark:border-blue-500 ring-2 ring-blue-900/30 shadow-sm"
                          : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {issue.trackingCode}
                        </span>

                        {(issue.isStarred || issue.priority === "CRITICAL") && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                            ★ AI Priority Flag
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPending
                              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                              : issue.triageAction === "accepted"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : issue.triageAction === "assigned_to_govt_dept"
                              ? "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {isPending
                            ? "Pending Super Admin"
                            : issue.triageAction === "accepted"
                            ? "Accepted (Research Org)"
                            : issue.triageAction === "assigned_to_govt_dept"
                            ? "Assigned Govt Dept"
                            : "Rejected"}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {issue.title}
                      </h3>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          {issue.district} &bull; {issue.domain}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {issue.citizenName}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Triage Inspection & Action Workspace */}
            <div className="lg:col-span-7">
              {selectedIssue ? (
                <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
                        {selectedIssue.trackingCode}
                      </span>
                      <span className="text-xs text-slate-500">
                        Submitted on: {new Date(selectedIssue.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedIssue.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Citizen: <strong>{selectedIssue.citizenName}</strong> &bull; District:{" "}
                      <strong>{selectedIssue.district}</strong> &bull; Domain: <strong>{selectedIssue.domain}</strong>
                    </p>
                  </div>

                  {/* AI Criticality & Rationale Banner */}
                  {(selectedIssue.isStarred || selectedIssue.aiAnalysisReason) && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>★ AI Priority Hazard Assessment ({selectedIssue.priority || "HIGH"})</span>
                          {selectedIssue.severityScore && (
                            <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800 rounded font-semibold text-[10px]">
                              Severity: {selectedIssue.severityScore}/5
                            </span>
                          )}
                        </div>
                        {selectedIssue.aiAnalysisReason && (
                          <p className="mt-1 text-[11.5px] leading-relaxed">
                            {selectedIssue.aiAnalysisReason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Full Citizen Description & Voice */}
                  <div className="p-4 bg-slate-50 dark:bg-[#0B0F17] rounded-xl border border-slate-200 dark:border-[#334155] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Citizen Statement
                      </span>
                      <VoiceAudioPlayer
                        textToRead={selectedIssue.description || selectedIssue.title}
                        audioUrl={selectedIssue.audioUrl}
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">
                      &ldquo;{selectedIssue.description}&rdquo;
                    </p>
                    {selectedIssue.address && (
                      <p className="text-[11px] text-slate-500">
                        Exact Location: {selectedIssue.address}
                      </p>
                    )}
                  </div>

                  {/* Citizen Photo Evidence */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Attached Media &amp; Field Photos
                    </span>
                    <EvidenceMediaViewer
                      mediaUrls={
                        selectedIssue.mediaUrls && selectedIssue.mediaUrls.length > 0
                          ? selectedIssue.mediaUrls
                          : selectedIssue.attachments?.map((a) => a.url) || []
                      }
                    />
                  </div>

                  {/* Smart Routing Matrix Decision Panel */}
                  {activeRoutingEval && (
                    <div className="p-4 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#334155] space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-serif font-bold text-slate-900 dark:text-slate-100">
                            Smart Routing Matrix
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {(activeRoutingEval.confidenceScore * 100).toFixed(0)}% Score
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                            activeRoutingEval.routingDecision === "UNIVERSITY_RESEARCH_ORG"
                              ? "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                              : activeRoutingEval.routingDecision === "GOVT_DEPT"
                              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {activeRoutingEval.routingDecision === "UNIVERSITY_RESEARCH_ORG"
                            ? "🎓 Academia / University Route"
                            : activeRoutingEval.routingDecision === "GOVT_DEPT"
                            ? "🏢 Government Department Route"
                            : "🔬 State Government RO Route"}
                        </span>
                      </div>

                      {/* 4 Interactive Toggle Chips / Scores */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Chip 1: Security/Policy Sensitive */}
                        <button
                          type="button"
                          onClick={() => setTriageSensOverride(!triageSensOverride)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                            triageSensOverride
                              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200"
                              : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 block">Security/Policy</span>
                          <span className="text-[11px] font-bold mt-0.5">
                            {triageSensOverride ? "Sensitive: Yes 🛑" : "Sensitive: No ✓"}
                          </span>
                        </button>

                        {/* Chip 2: Annual Scheme Budget */}
                        <button
                          type="button"
                          onClick={() => setTriageBudgetOverride(!triageBudgetOverride)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                            triageBudgetOverride
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
                              : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 block">Annual Budget</span>
                          <span className="text-[11px] font-bold mt-0.5">
                            {triageBudgetOverride ? "Allocated ✓" : "None / Grant ✕"}
                          </span>
                        </button>

                        {/* Chip 3: Govt Lab Capacity */}
                        <button
                          type="button"
                          onClick={() =>
                            setTriageCapacityOverride(
                              triageCapacityOverride === "High / Saturated" ? "Available" : "High / Saturated"
                            )
                          }
                          className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                            triageCapacityOverride === "High / Saturated"
                              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                              : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 block">Govt Lab Load</span>
                          <span className="text-[11px] font-bold mt-0.5">
                            {triageCapacityOverride === "High / Saturated" ? "Saturated ⚠️" : "Optimal ✓"}
                          </span>
                        </button>

                        {/* Chip 4: Capable University Labs */}
                        <div className="p-2 rounded-lg border bg-white dark:bg-[#1E293B] border-slate-200 dark:border-[#334155] flex flex-col justify-between">
                          <span className="text-[10px] text-slate-500 block">Capable Uni Labs</span>
                          <span
                            className={`text-[11px] font-bold mt-0.5 ${
                              activeRoutingEval.factors.eligibleUniversities.length > 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-400"
                            }`}
                          >
                            {activeRoutingEval.factors.eligibleUniversities.length > 0
                              ? `Found (${activeRoutingEval.factors.eligibleUniversities.length})`
                              : "None"}
                          </span>
                        </div>
                      </div>

                      {/* Rationale description */}
                      <div className="p-2.5 bg-white dark:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-[#334155] text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong className="text-slate-900 dark:text-slate-100">Decision Rationale:</strong>{" "}
                        {activeRoutingEval.rationale}
                      </div>

                      {/* Primary Suggested CTA Action Container */}
                      <div className="pt-2">
                        {activeRoutingEval.routingDecision === "UNIVERSITY_RESEARCH_ORG" ? (
                          <div className="space-y-2.5">
                            {activeRoutingEval.factors.eligibleUniversities.length > 0 && (
                              <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800">
                                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-1.5">
                                  Select Empaneled Universities for Allocation:
                                </span>
                                <div className="space-y-1.5">
                                  {activeRoutingEval.factors.eligibleUniversities.map((uni) => {
                                    const isChecked = selectedCollegesForAllocation.includes(uni);
                                    return (
                                      <label
                                        key={uni}
                                        className="flex items-center space-x-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            if (isChecked) {
                                              setSelectedCollegesForAllocation((prev) =>
                                                prev.filter((c) => c !== uni)
                                              );
                                            } else {
                                              setSelectedCollegesForAllocation((prev) => [...prev, uni]);
                                            }
                                          }}
                                          className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="font-medium text-[11.5px]">{uni}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAccept(selectedIssue._id, selectedCollegesForAllocation)}
                              disabled={actionInProgress !== null}
                              className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-4 h-4 text-purple-200" />
                              <span>
                                Allocate to Empaneled University / Research Org (
                                {selectedCollegesForAllocation.length} selected)
                              </span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRouteModalOpen(true)}
                            disabled={actionInProgress !== null}
                            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                          >
                            <Building2 className="w-4 h-4 text-emerald-200" />
                            <span>Confirm Dispatch to Govt Dept / State RO</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Super Admin Triage Action Bar */}
                  <div className="pt-4 border-t border-slate-200 dark:border-[#334155] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Super Admin Triage Decision
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Action 1: Accept */}
                      <button
                        type="button"
                        onClick={() => handleAccept(selectedIssue._id)}
                        disabled={actionInProgress !== null}
                        className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Issue (Research Org)</span>
                      </button>

                      {/* Action 2: Route to Govt Dept */}
                      <button
                        type="button"
                        onClick={() => setRouteModalOpen(true)}
                        disabled={actionInProgress !== null}
                        className="p-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Route to Govt Dept</span>
                      </button>

                      {/* Action 3: Reject */}
                      <button
                        type="button"
                        onClick={() => setRejectModalOpen(true)}
                        disabled={actionInProgress !== null}
                        className="p-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Complaint</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1E293B] p-12 rounded-xl border border-slate-200 dark:border-[#334155] text-center text-xs text-slate-500">
                  Select a submission from the triage queue to inspect.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB 2: Department Directory & Routing Matrix
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-[#334155] shadow-xs">
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              Government Department Maintenance Routing Directory
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configured state maintenance departments receiving direct field tickets for routine civic upkeep.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B0F17] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        {dept.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {dept.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div>Officer in Charge: <strong>{dept.head}</strong></div>
                      <div>Contact: {dept.email}</div>
                      <div>Target Resolution SLA: <strong>{dept.slaHours} Hours</strong></div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {dept.categories.map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-700 dark:text-slate-300"
                        >
                          #{cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Active Field Load:</span>
                    <strong className="text-blue-900 dark:text-blue-300 font-serif text-sm">
                      {dept.activeTickets} Tickets
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB 3: System Audit Logs & Overrides
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
            System Audit Trail &amp; Administrative Overrides Ledger
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Immutable log of Super Admin triage decisions, automated routing passes, and escalation activations.
          </p>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 dark:bg-[#0B0F17] rounded-xl border border-slate-200 dark:border-[#334155] text-xs flex flex-wrap items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    {log.issueCode !== "N/A" && (
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {log.issueCode}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                  <span className="text-[10.5px] text-slate-400">
                    By: {log.performedBy}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB 4: User & Officer Role Management
          ──────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
            Official Stakeholder &amp; Officer Role Roster
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Manage authenticated accounts across Super Administrators, Research Organizations, Govt Departments, Universities, and Consultancies.
          </p>

          <div className="border border-slate-200 dark:border-[#334155] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Official Email</th>
                  <th className="p-3">Role Designation</th>
                  <th className="p-3">Organization / District</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                    <td className="p-3 font-semibold">{u.name}</td>
                    <td className="p-3 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10.5px] uppercase font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.organizationName || u.district || "State Wide"}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Authorized</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          MODAL: Reject Issue
          ──────────────────────────────────────────────────────────── */}
      {rejectModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-[#334155] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                Reject Complaint: {selectedIssue.trackingCode}
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Rejection Reason *
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-300 dark:border-[#334155] rounded-lg outline-hidden text-slate-800 dark:text-slate-100"
                >
                  <option value="Duplicate / already under maintenance">Duplicate / already under active maintenance</option>
                  <option value="Out of administrative jurisdiction">Out of state / administrative jurisdiction</option>
                  <option value="Spam / invalid photographic evidence">Spam / fraudulent / invalid evidence</option>
                  <option value="Private property matter">Private property / non-public dispute</option>
                  <option value="Insufficient location details">Insufficient location / contact details</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress !== null}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          MODAL: Route to Govt Dept Maintenance
          ──────────────────────────────────────────────────────────── */}
      {routeModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-[#334155] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                Route to Maintenance Department
              </h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Government Department *
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-300 dark:border-[#334155] rounded-lg outline-hidden text-slate-800 dark:text-slate-100"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.slaHours}h SLA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maintenance Instructions / Field Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Inspect pothole on Ring Road km 14; complete resurfacing within 48h SLA..."
                  value={deptNotes}
                  onChange={(e) => setDeptNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-300 dark:border-[#334155] rounded-lg outline-hidden text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress !== null}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch to Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
