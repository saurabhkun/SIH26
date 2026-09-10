"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Search,
  Sparkles,
  Award,
  Check,
  X,
  FileText,
  RefreshCw,
  ChevronRight,
  Layers,
  Zap,
  AlertCircle,
  HelpCircle,
  Star,
} from "lucide-react";
import { EvidenceMediaViewer } from "@/components/EvidenceMediaViewer";
import { VoiceAudioPlayer } from "@/components/VoiceAudioPlayer";

interface Milestone {
  id?: string;
  title: string;
  description: string;
  targetDate?: string;
  dueDate?: string;
  status: "Pending" | "In_Progress" | "Completed" | "Delayed" | string;
  fundingReleaseAmount?: number;
  fundingReleased?: boolean;
  submissionRemarks?: string;
  completedAt?: string;
}

interface ProposalItem {
  _id: string;
  title: string;
  methodologySummary?: string;
  technicalScope?: string;
  budgetRequested: number;
  estimatedCost?: number;
  facultyMentor?: string;
  facultyLead?: {
    name: string;
    email: string;
    specialization: string;
    designation?: string;
  };
  studentTeamSize?: number;
  utilizedLabs?: string[];
  status: string;
  milestones: Milestone[];
  aiEvaluation?: {
    feasibilityScore?: number;
    resourceMatchScore?: number;
    trackRecordScore?: number;
    noveltyScore?: number;
    compositeScore?: number;
    reasoningSummary?: string;
  };
  humanPanelReview?: {
    reviewedBy?: string;
    comments?: string;
    verifiedAt?: string | Date;
    finalVerdict?: string;
  };
  issue?: {
    _id: string;
    title: string;
    description?: string;
    trackingCode: string;
    district: string;
    domain: string;
    severityScore: number;
    citizenName?: string;
    address?: string;
    mediaUrls?: string[];
    attachments?: { url: string; type: "photo" | "video" | "document" }[];
    audioUrl?: string;
  };
  college?: {
    _id: string;
    name: string;
    district: string;
    tier: string;
    capabilities?: string[];
    facilities?: string[];
  };
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
  urgencyTrack: string;
  status: string;
  escalationStage: number;
  targetTiers?: string[];
  biddingDeadline?: string;
  citizenName?: string;
  citizenPhone?: string;
  address?: string;
  attachments?: { url: string; type: "photo" | "video" | "document" }[];
  mediaUrls?: string[];
  audioUrl?: string;
  aiTags?: string[];
  triageRationale?: string;
  reviewedBy?: string;
  createdAt: string;
  assignedLeadCollege?: {
    _id: string;
    name: string;
    district: string;
    tier: string;
  };
}

export default function RODashboardClient() {
  const [activeTab, setActiveTab] = useState<"feasibility" | "proposals" | "escalations">("feasibility");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [feasibilityIssues, setFeasibilityIssues] = useState<IssueItem[]>([]);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [escalationIssues, setEscalationIssues] = useState<IssueItem[]>([]);
  const [metrics, setMetrics] = useState({
    pendingFeasibility: 0,
    proposalsAwaitingBadge: 0,
    activeMilestonesInFlight: 0,
    escalationsRequiringAction: 0,
  });

  // Filters & selection
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);

  // Action modals & states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadgeType, setSelectedBadgeType] = useState("Govt Nodal R&D Certified");

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/gov/ro");
      const json = await res.json();
      if (json.success && json.data) {
        setFeasibilityIssues(json.data.feasibilityIssues || []);
        setProposals(json.data.heiProposals || []);
        setEscalationIssues(json.data.escalationIssues || []);
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
        if (!selectedIssue && json.data.feasibilityIssues?.length > 0) {
          setSelectedIssue(json.data.feasibilityIssues[0]);
        }
        if (!selectedProposal && json.data.heiProposals?.length > 0) {
          setSelectedProposal(json.data.heiProposals[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load RO dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedIssue, selectedProposal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  // Handler: Feasibility Actions
  const handleFeasibilityAction = async (action: "approve_feasibility" | "request_field_verification" | "reject_administrative", issueId: string) => {
    try {
      setActionInProgress(action);
      const res = await fetch("/api/gov/ro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, issueId, remarks: remarksInput }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        setRemarksInput("");
        loadData();
      } else {
        showFeedback(data.error || "Action failed", "error");
      }
    } catch {
      showFeedback("Failed to perform action", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handler: Milestone Sign-off
  const handleMilestoneSignOff = async (proposalId: string, milestoneIndex: number) => {
    try {
      setActionInProgress(`milestone-${milestoneIndex}`);
      const res = await fetch("/api/gov/ro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_off_milestone", proposalId, milestoneIndex }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        loadData();
      } else {
        showFeedback(data.error || "Milestone sign-off failed", "error");
      }
    } catch {
      showFeedback("Failed to update milestone", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handler: Issue Nodal Badge
  const handleIssueBadge = async () => {
    if (!selectedProposal) return;
    try {
      setActionInProgress("issue-badge");
      const res = await fetch("/api/gov/ro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue_nodal_badge",
          proposalId: selectedProposal._id,
          badgeType: selectedBadgeType,
          remarks: remarksInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        setBadgeModalOpen(false);
        setRemarksInput("");
        loadData();
      } else {
        showFeedback(data.error || "Failed to issue badge", "error");
      }
    } catch {
      showFeedback("Failed to issue nodal badge", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handler: Stage Escalation
  const handleStageEscalation = async (issueId: string, nextStage: number) => {
    try {
      setActionInProgress(`escalate-${issueId}`);
      const res = await fetch("/api/gov/ro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_stage_escalation", issueId, nextStage }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message, "success");
        loadData();
      } else {
        showFeedback(data.error || "Failed to trigger escalation", "error");
      }
    } catch {
      showFeedback("Failed to trigger escalation", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter feasibility issues
  const filteredFeasibility = feasibilityIssues.filter((i) => {
    const matchesDomain = domainFilter === "all" || i.domain?.toLowerCase() === domainFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  // Filter proposals
  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.college?.name && p.college.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.issue?.title && p.issue.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.issue?.district && p.issue.district.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner with Gradient & RO Badge */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white p-6 shadow-md border border-slate-700">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>State Research Organization (RO) Decision Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
              Urban Planning &amp; R&amp;D Feasibility Desk
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Review accepted civic intelligence reports for pattern study, urban planning analysis, and academic innovation. Audit university prototype milestones and endorse for Industry CSR co-funding.
            </p>
          </div>

          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium text-white transition-all shadow-xs backdrop-blur-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Queue"}</span>
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Pending Feasibility Review</span>
            <strong className="text-xl font-bold text-amber-400">{metrics.pendingFeasibility} Issues</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Awaiting Nodal Badge</span>
            <strong className="text-xl font-bold text-blue-400">{metrics.proposalsAwaitingBadge} Proposals</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Active Milestones In Flight</span>
            <strong className="text-xl font-bold text-emerald-400">{metrics.activeMilestonesInFlight} Phases</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block font-medium">Escalations Requiring Action</span>
            <strong className="text-xl font-bold text-rose-400">{metrics.escalationsRequiringAction} Challenges</strong>
          </div>
        </div>
      </div>

      {/* Real-Time Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between shadow-xs transition-all animate-fadeIn ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("feasibility")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === "feasibility"
                ? "bg-[#1E3A8A] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span>Technical Feasibility Queue ({feasibilityIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("proposals")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === "proposals"
                ? "bg-[#1E3A8A] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span>HEI Proposal & Milestones ({proposals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("escalations")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === "escalations"
                ? "bg-[#1E3A8A] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Stage Escalation Controls ({escalationIssues.length})</span>
          </button>
        </div>

        {/* Global Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tracking code, district, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
          />
        </div>
      </div>

      {/* TAB 1: Technical Feasibility Assessment Queue */}
      {activeTab === "feasibility" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Issues */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Filter by Civic Domain:</span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 outline-hidden"
              >
                <option value="all">All Domains</option>
                <option value="water">Water & Effluents</option>
                <option value="agriculture">Agriculture & Bio-Tech</option>
                <option value="mining">Mining & Geotechnical</option>
                <option value="health">Public Health</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="energy">Clean Energy & Microgrid</option>
              </select>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Loading Feasibility Queue...
              </div>
            ) : filteredFeasibility.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                No problem submissions pending review matching filters.
              </div>
            ) : (
              <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                {filteredFeasibility.map((issue) => {
                  const isSelected = selectedIssue?._id === issue._id;
                  return (
                    <div
                      key={issue._id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                            {issue.trackingCode}
                          </span>
                          {issue.isStarred && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                              <span>★ AI Priority Flag</span>
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            issue.priority === "CRITICAL" || issue.severityScore >= 80 || issue.severityScore >= 4
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : issue.severityScore >= 60 || issue.severityScore === 3
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {issue.priority ? `${issue.priority} Priority` : `Severity ${issue.severityScore}/5`}
                        </span>
                      </div>

                      <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 mb-1">{issue.title}</h4>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-2.5">{issue.description}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span className="font-medium text-slate-700 capitalize">{issue.domain} • {issue.district}</span>
                        <span className="inline-flex items-center text-blue-600 font-semibold">
                          View R&D Fit <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Problem Detail & RO Action Desk */}
          <div className="lg:col-span-7">
            {selectedIssue ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                {/* Header & Meta */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-mono text-xs font-bold">
                        {selectedIssue.trackingCode}
                      </span>
                      {selectedIssue.isStarred && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          <span>★ AI Critical Star Priority</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold capitalize">
                        {selectedIssue.domain}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        📍 {selectedIssue.district}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-serif text-slate-900">{selectedIssue.title}</h2>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Current Status</span>
                    <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg mt-0.5">
                      {selectedIssue.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* AI Criticality Analysis Rationale Callout Banner */}
                {selectedIssue.aiAnalysisReason && (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 space-y-1.5 text-xs shadow-2xs">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
                      <span>Automated AI Criticality Triage Rationale</span>
                    </div>
                    <p className="text-amber-950 leading-relaxed font-medium">
                      {selectedIssue.aiAnalysisReason}
                    </p>
                    {selectedIssue.suggestedDepartment && (
                      <div className="text-[11px] text-amber-900/80 pt-0.5">
                        Suggested Department Routing: <strong>{selectedIssue.suggestedDepartment}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Problem Description & Citizen Grievance */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Citizen Grievance Description</h4>
                  <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedIssue.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Submitted by: <strong>{selectedIssue.citizenName || "Concerned Resident"}</strong> ({selectedIssue.district})</span>
                    <span>Reported on: {new Date(selectedIssue.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                {/* Audio & Media Evidence if present */}
                {(selectedIssue.audioUrl || (selectedIssue.attachments && selectedIssue.attachments.length > 0) || (selectedIssue.mediaUrls && selectedIssue.mediaUrls.length > 0)) && (
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Citizen Ground Evidence & Telemetry</span>
                    </h4>

                    {selectedIssue.audioUrl && (
                      <div className="mt-2">
                        <span className="text-[11px] font-semibold text-slate-600 block mb-1">Citizen Voice Recording:</span>
                        <VoiceAudioPlayer
                          audioUrl={selectedIssue.audioUrl}
                          textToRead={selectedIssue.description || selectedIssue.title}
                        />
                      </div>
                    )}

                    <EvidenceMediaViewer
                      mediaUrls={
                        selectedIssue.mediaUrls?.length
                          ? selectedIssue.mediaUrls
                          : selectedIssue.attachments?.map((a) => a.url) || []
                      }
                      domain={selectedIssue.domain}
                    />
                  </div>
                )}

                {/* AI Feasibility Assessment & Lab Matching Matrix */}
                <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>AI R&D Feasibility Assessment</span>
                    </h4>
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                      High Academic Innovation Match
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">R&D Novelty Score</span>
                      <strong className="text-base font-bold text-blue-900">88/100</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Local Lab Match</span>
                      <strong className="text-base font-bold text-emerald-800">Tier L1/L2 High</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Pilot Turnaround</span>
                      <strong className="text-base font-bold text-indigo-900">30-45 Days</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded-lg border border-blue-100">
                    &ldquo;{selectedIssue.triageRationale || "Problem exhibits distinct laboratory testing, sensor telemetry, or chemical filtration requirements suitable for premier state universities (BIT Mesra, IIT ISM Dhanbad, NIT Jamshedpur)."}&rdquo;
                  </p>
                </div>

                {/* RO Decision Controls */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    State Research Officer Assessment & Action
                  </h4>

                  <textarea
                    rows={2}
                    placeholder="Enter official RO review notes or technical directives (optional)..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {/* Action 1: Approve for Open Bidding */}
                    <button
                      onClick={() => handleFeasibilityAction("approve_feasibility", selectedIssue._id)}
                      disabled={actionInProgress !== null}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve for Open Bidding</span>
                    </button>

                    {/* Action 2: Request Field Verification */}
                    <button
                      onClick={() => handleFeasibilityAction("request_field_verification", selectedIssue._id)}
                      disabled={actionInProgress !== null}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Request Field Sampling</span>
                    </button>

                    {/* Action 3: Reject / Mark Administrative */}
                    <button
                      onClick={() => handleFeasibilityAction("reject_administrative", selectedIssue._id)}
                      disabled={actionInProgress !== null}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject / Route to ULB</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-base">Select a civic issue to perform technical evaluation</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Evaluate incoming grievances for scientific research capability, prototype suitability, and multi-tier HEI assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HEI Proposal Evaluation & Milestone Sign-off */}
      {activeTab === "proposals" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposals List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center justify-between font-semibold">
              <span>Submitted Academic Proposals ({filteredProposals.length})</span>
              <span className="text-[11px] text-blue-600">Click to evaluate</span>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Loading Academic Proposals...
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                No academic proposals found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                {filteredProposals.map((prop) => {
                  const isSelected = selectedProposal?._id === prop._id;
                  const hasNodalBadge = Boolean(prop.humanPanelReview?.verifiedAt);
                  return (
                    <div
                      key={prop._id}
                      onClick={() => setSelectedProposal(prop)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#1E3A8A] flex items-center space-x-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">{prop.college?.name || "State University"}</span>
                        </span>
                        {hasNodalBadge ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Nodal Verified</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            Pending Badge
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 mb-1">{prop.title}</h4>

                      <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                        Target Problem: {prop.issue?.title || "Civic Challenge"}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Budget: <strong>₹{(prop.budgetRequested || prop.estimatedCost || 150000).toLocaleString("en-IN")}</strong></span>
                        <span className="font-semibold text-blue-700">
                          {prop.milestones?.filter((m) => m.status === "Completed").length || 0}/{prop.milestones?.length || 3} Milestones Done
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Proposal Deep-Dive, Milestone Checklist & Nodal Badging */}
          <div className="lg:col-span-7">
            {selectedProposal ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                {/* Proposal Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-semibold text-xs flex items-center space-x-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                        <span>{selectedProposal.college?.name || "Institution"}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        Tier {selectedProposal.college?.tier || "L1"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-serif text-slate-900">{selectedProposal.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Linked Issue: <strong>{selectedProposal.issue?.title || "Civic Grievance"}</strong> ({selectedProposal.issue?.trackingCode})
                    </p>
                  </div>

                  {/* Nodal Verification Status Pill */}
                  <div>
                    {selectedProposal.humanPanelReview?.verifiedAt ? (
                      <div className="text-right">
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg shadow-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Nodal Certified</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Signed by {selectedProposal.humanPanelReview.reviewedBy || "State RO"}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setBadgeModalOpen(true)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#C9A227] hover:bg-[#b08d1f] text-slate-900 text-xs font-bold rounded-lg shadow-xs transition-all"
                      >
                        <Award className="w-4 h-4" />
                        <span>Issue Nodal Verification Badge</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Technical Methodology & Investigator info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Faculty Lead / Principal Investigator
                    </span>
                    <strong className="text-sm font-semibold text-slate-900 block">
                      {selectedProposal.facultyLead?.name || selectedProposal.facultyMentor || "Prof. Department Head"}
                    </strong>
                    <span className="text-slate-600 block mt-0.5">
                      {selectedProposal.facultyLead?.specialization || "Applied Research & Materials Engineering"}
                    </span>
                    <span className="text-slate-500 block text-[11px] mt-1">
                      Student Team Size: {selectedProposal.studentTeamSize || 4} Members
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Budget & Laboratory Allocation
                    </span>
                    <strong className="text-sm font-semibold text-emerald-700 block">
                      ₹{(selectedProposal.budgetRequested || selectedProposal.estimatedCost || 150000).toLocaleString("en-IN")}
                    </strong>
                    <span className="text-slate-600 block mt-0.5">
                      Laboratories: {selectedProposal.utilizedLabs?.join(", ") || "Environmental & Instrumentation Lab"}
                    </span>
                    <span className="text-slate-500 block text-[11px] mt-1">
                      AI Composite Feasibility: <strong>{selectedProposal.aiEvaluation?.compositeScore || 86}/100</strong>
                    </span>
                  </div>
                </div>

                {/* Technical Scope & Methodology Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Technical Scope & Deployment Plan</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedProposal.technicalScope || selectedProposal.methodologySummary || "Custom low-cost telemetry and multi-layer filtration system designed for rural district deployment."}
                  </p>
                </div>

                {/* Milestone Validation Checklist */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Milestone Validation Checklist (Lab Testing → Field Pilot → Certification)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">RO Sign-Off Control</span>
                  </div>

                  {(!selectedProposal.milestones || selectedProposal.milestones.length === 0) ? (
                    <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                      Standard default 3-stage validation pipeline assigned: Lab Testing, Field Pilot, Final Certification.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedProposal.milestones.map((m, idx) => {
                        const isCompleted = m.status === "Completed";
                        const isSigningThis = actionInProgress === `milestone-${idx}`;
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              isCompleted
                                ? "bg-emerald-50/70 border-emerald-200"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900">{m.title}</h5>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.2 rounded-md ${
                                    isCompleted
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isCompleted ? "Verified & Completed" : "In Progress"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 pl-7">{m.description}</p>
                              {m.completedAt && (
                                <span className="text-[10px] text-slate-400 pl-7 block">
                                  Signed off on: {new Date(m.completedAt).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </div>

                            {/* Sign-off Toggle Button */}
                            <button
                              onClick={() => handleMilestoneSignOff(selectedProposal._id, idx)}
                              disabled={isSigningThis}
                              className={`self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                isCompleted
                                  ? "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-[#1E3A8A] text-white hover:bg-blue-800"
                              }`}
                            >
                              {isSigningThis ? (
                                "Updating..."
                              ) : isCompleted ? (
                                <span className="inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Signed Off (Toggle)</span>
                                </span>
                              ) : (
                                "Sign-off Milestone"
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Nodal Badge Preview & Stamp Banner */}
                {selectedProposal.humanPanelReview?.verifiedAt && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Official State Nodal Verification Seal Active
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {selectedProposal.humanPanelReview.comments || "Technical feasibility, lab capacity, and milestone schedule certified by Government Research Officer. Proposal is prioritized in Industry CSR Escrow funding feed."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-base">Select a university proposal to audit milestones</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Verify academic milestone completion and issue official Nodal Verification Badges prior to Industry CSR investment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Stage Escalation Controls */}
      {activeTab === "escalations" && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>Contingency Escalation Ladder (Anti-Stall Failover System)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                When university bidding or milestones stall past statutory deadlines, trigger tier expansion, direct nomination with sweeteners, or State Public Works egress.
              </p>
            </div>
            <span className="text-xs font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-200">
              {escalationIssues.length} Challenges Monitored
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalationIssues.map((issue) => {
              const deadline = issue.biddingDeadline ? new Date(issue.biddingDeadline) : null;
              const isOverdue = deadline ? deadline < new Date() : false;
              const stage = issue.escalationStage || 1;

              return (
                <div
                  key={issue._id}
                  className={`p-5 rounded-2xl border bg-white shadow-xs space-y-4 flex flex-col justify-between ${
                    isOverdue ? "border-rose-300 ring-1 ring-rose-300" : "border-slate-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {issue.trackingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          stage === 1
                            ? "bg-blue-100 text-blue-800"
                            : stage === 2
                            ? "bg-amber-100 text-amber-800"
                            : stage === 3
                            ? "bg-purple-100 text-purple-800"
                            : stage === 4
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-800 text-white"
                        }`}
                      >
                        Stage {stage}/5 Escalation
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{issue.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{issue.description}</p>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>District: <strong>{issue.district}</strong></span>
                        <span>Domain: <strong className="capitalize">{issue.domain}</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Bidding Deadline:</span>
                        <strong className={isOverdue ? "text-rose-600" : "text-slate-700"}>
                          {deadline ? deadline.toLocaleDateString("en-IN") : "Active"} {isOverdue && "(OVERDUE)"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Escalation Stage Progression */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Escalation Ladder</span>
                      <span>Next: Stage {Math.min(5, stage + 1)}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-bold">
                      <div className={`py-1 rounded-xs ${stage >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>L1</div>
                      <div className={`py-1 rounded-xs ${stage >= 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400"}`}>L2</div>
                      <div className={`py-1 rounded-xs ${stage >= 3 ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"}`}>Direct</div>
                      <div className={`py-1 rounded-xs ${stage >= 4 ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400"}`}>Emerg</div>
                      <div className={`py-1 rounded-xs ${stage >= 5 ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"}`}>Works</div>
                    </div>

                    {/* Trigger Next Escalation Action */}
                    {stage < 5 ? (
                      <button
                        onClick={() => handleStageEscalation(issue._id, stage + 1)}
                        disabled={actionInProgress === `escalate-${issue._id}`}
                        className="w-full py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {actionInProgress === `escalate-${issue._id}`
                            ? "Escalating..."
                            : stage === 1
                            ? "Trigger Tier L2 Escalation (+10 Pts)"
                            : stage === 2
                            ? "Issue Direct Institutional Nomination"
                            : stage === 3
                            ? "Trigger Emergency Allocation"
                            : "Trigger Stage 5 Public Works Egress"}
                        </span>
                      </button>
                    ) : (
                      <div className="p-2 text-center bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                        Transferred to Public Works (Egress Complete)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Issue Official Nodal Verification Badge */}
      {badgeModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg text-[#1E3A8A]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">Issue Official Nodal Badge</h3>
                  <p className="text-xs text-slate-500">Certify proposal for Industry CSR funding feed</p>
                </div>
              </div>
              <button
                onClick={() => setBadgeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Proposal Title:</span>
                <strong className="text-sm text-slate-900 block mt-0.5">{selectedProposal.title}</strong>
                <span className="text-blue-700 font-semibold">{selectedProposal.college?.name}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Select Nodal Certification Seal:</label>
                <div className="space-y-2">
                  {[
                    {
                      id: "Govt Nodal R&D Certified",
                      desc: "Official state stamp certifying technical feasibility, lab readiness & faculty competency.",
                    },
                    {
                      id: "Tech-Feasibility Validated",
                      desc: "Validates sensor accuracy, chemical assay protocol & local district deployment readiness.",
                    },
                    {
                      id: "Ready for Industry CSR Escrow",
                      desc: "Authorizes corporate CSR heads to pledge and release escrow milestone capital directly.",
                    },
                    {
                      id: "Environmental & Field Compliant",
                      desc: "Audited for Jharkhand state pollution control & environmental safety standards.",
                    },
                  ].map((badge) => (
                    <label
                      key={badge.id}
                      onClick={() => setSelectedBadgeType(badge.id)}
                      className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                        selectedBadgeType === badge.id
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="badgeType"
                        checked={selectedBadgeType === badge.id}
                        onChange={() => setSelectedBadgeType(badge.id)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <strong className="text-slate-900 block font-semibold">{badge.id}</strong>
                        <span className="text-slate-500 text-[11px] block mt-0.5">{badge.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official RO Review Directive (Optional):</label>
                <textarea
                  rows={2}
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  placeholder="Enter endorsement remarks or specific testing stipulations..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setBadgeModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueBadge}
                disabled={actionInProgress === "issue-badge"}
                className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>{actionInProgress === "issue-badge" ? "Sealing Badge..." : "Confirm & Issue Nodal Badge"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
