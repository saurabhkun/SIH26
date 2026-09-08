"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  FunnelChart,
  Funnel,
  Cell,
} from "recharts";
import {
  CheckCircle,
  AlertTriangle,
  Building2,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  ChevronsUpDown,
  ShieldAlert,
  GraduationCap,
  AlertCircle,
  FileText,
  CheckCircle2,
  Info,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { EvidenceMediaViewer } from "@/components/EvidenceMediaViewer";
import { VoiceAudioPlayer } from "@/components/VoiceAudioPlayer";

const JharkhandMap = dynamic(() => import("@/components/JharkhandMap"), { ssr: false });

/* ────────────────────────────────────────
   Tiny reusable primitives
   ──────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-civic-surface border ${
        accent ? "border-civic-secondary border-t-4 border-t-civic-secondary" : "border-civic-border border-t-4 border-t-civic-primary"
      } rounded-xl shadow-xs p-5 min-w-[150px]`}
    >
      <div className="text-3xl font-black font-serif text-civic-primary tracking-tight leading-none">
        {value}
      </div>
      <div className="text-xs font-bold text-civic-textDark mt-1.5">{label}</div>
      {sub && <div className="text-[11px] text-civic-textMuted mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-base font-bold text-civic-textDark border-b-2 border-civic-secondary pb-1.5 mb-4">
      {children}
    </h3>
  );
}

/* ────────────────────────────────────────
   Review Queue Component
   ──────────────────────────────────────── */
function ReviewQueue() {
  const [issues, setIssues] = useState<GovIssue[]>([]);
  const [selected, setSelected] = useState<GovIssue | null>(null);
  const [action, setAction] = useState<"mark_duplicate" | "confirm_distinct" | "">("");
  const [duplicateOf, setDuplicateOf] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  interface SimilarIssue {
    _id: string;
    trackingCode: string;
    title: string;
    domain: string;
    district: string;
    status: string;
  }

  interface GovIssue {
    _id: string;
    trackingCode: string;
    title: string;
    domain: string;
    district: string;
    status: string;
    description: string;
    citizenName?: string;
    address?: string;
    mediaUrls?: string[];
    attachments?: { url: string; type: "photo" | "video" | "document" }[];
    audioUrl?: string;
    similarIssueIds?: SimilarIssue[];
  }

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gov/review-queue");
      if (res.ok) {
        const d = await res.json();
        setIssues(d.issues || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleSubmit = async () => {
    if (!selected || !action) return;
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/gov/review-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: selected._id,
          action,
          duplicateOf: action === "mark_duplicate" ? duplicateOf : undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg(`✓ Issue updated to "${d.status}"`);
        setSelected(null);
        setAction("");
        setDuplicateOf("");
        fetchQueue();
      } else {
        setMsg(`Error: ${d.error}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    Under_Review: "#b45309",
    Duplicate: "#7c3aed",
    Assigned_HEI: "#065f46",
    Reported: "#1e40af",
  };

  return (
    <div>
      <SectionTitle>Review Queue — Flagged &amp; Pending Issues</SectionTitle>
      {loading && <p style={{ fontSize: 13, color: "#64748b" }}>Loading queue…</p>}
      {!loading && issues.length === 0 && (
        <p style={{ fontSize: 13, color: "#64748b", padding: "12px 0" }}>
          No issues currently pending review. ✓
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* Issue list */}
        <div style={{ overflowY: "auto", maxHeight: 480 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Code", "Title", "Domain", "District", "Status", "Flags", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "6px 8px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#374151",
                      borderBottom: "1px solid #e2e8f0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue._id}
                  style={{
                    background: selected?._id === issue._id ? "#eff6ff" : "#fff",
                    borderBottom: "1px solid #f0f2f5",
                  }}
                >
                  <td style={{ padding: "6px 8px", color: "#1a2e4a", fontWeight: 600 }}>
                    {issue.trackingCode}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {issue.title}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#374151" }}>{issue.domain}</td>
                  <td style={{ padding: "6px 8px", color: "#374151" }}>{issue.district}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: `${statusColor[issue.status] || "#475569"}22`,
                        color: statusColor[issue.status] || "#475569",
                        border: `1px solid ${statusColor[issue.status] || "#475569"}44`,
                      }}
                    >
                      {issue.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px", color: "#7c3aed" }}>
                    {(issue.similarIssueIds?.length || 0) > 0
                      ? `${issue.similarIssueIds!.length} similar`
                      : "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <button
                      onClick={() => {
                        setSelected(issue);
                        setAction("");
                        setDuplicateOf("");
                        setMsg("");
                      }}
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        background: "#1a2e4a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Side-by-side comparison panel */}
        {selected && (
          <div
            style={{
              border: "1px solid #c9a84c",
              borderRadius: 8,
              padding: 16,
              background: "#fffdf5",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h4 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 14, color: "#1a2e4a" }}>
                Reviewing: {selected.trackingCode}
              </h4>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#1a2e4a", fontSize: 13 }}>
                  {selected.title}
                </p>
                <VoiceAudioPlayer
                  textToRead={selected.description || selected.title}
                  audioUrl={selected.audioUrl}
                />
              </div>
              <p
                style={{
                  margin: "0 0 8px",
                  color: "#374151",
                  lineHeight: 1.5,
                  fontSize: 12,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{selected.description || "No description provided."}&rdquo;
              </p>

              <div style={{ margin: "8px 0" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Citizen Photo Evidence
                </span>
                <EvidenceMediaViewer
                  mediaUrls={
                    selected.mediaUrls && selected.mediaUrls.length > 0
                      ? selected.mediaUrls
                      : selected.attachments?.map((a) => a.url) || []
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  fontSize: 11,
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 6,
                }}
              >
                <span style={{ color: "#64748b" }}>
                  Domain: <b>{selected.domain}</b>
                </span>
                <span style={{ color: "#64748b" }}>
                  District: <b>{selected.district}</b>
                </span>
                <span style={{ color: "#64748b" }}>
                  Status: <b>{selected.status}</b>
                </span>
                {selected.citizenName && (
                  <span style={{ color: "#64748b" }}>
                    Citizen: <b>{selected.citizenName}</b>
                  </span>
                )}
              </div>
            </div>

            {selected.similarIssueIds && selected.similarIssueIds.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>
                  ⚠ Similar Issues Flagged by AI:
                </p>
                {selected.similarIssueIds.map((sim) => (
                  <div
                    key={sim._id}
                    style={{
                      background: "#f5f3ff",
                      border: "1px solid #c4b5fd",
                      borderRadius: 6,
                      padding: "8px 10px",
                      marginBottom: 6,
                      fontSize: 12,
                    }}
                  >
                    <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#6d28d9" }}>
                      {sim.trackingCode} — {sim.title}
                    </p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>
                      {sim.domain} | {sim.district} | {sim.status}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Decision */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                Officer Decision:
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  onClick={() => setAction("confirm_distinct")}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: action === "confirm_distinct" ? "#065f46" : "#f0fdf4",
                    color: action === "confirm_distinct" ? "#fff" : "#065f46",
                    border: "1px solid #065f46",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✓ Distinct — Assign to HEI
                </button>
                <button
                  onClick={() => setAction("mark_duplicate")}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: action === "mark_duplicate" ? "#7c3aed" : "#faf5ff",
                    color: action === "mark_duplicate" ? "#fff" : "#7c3aed",
                    border: "1px solid #7c3aed",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ⊗ Mark as Duplicate
                </button>
              </div>

              {action === "mark_duplicate" && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                    Duplicate of (Issue ObjectId or Tracking Code):
                  </label>
                  <input
                    value={duplicateOf}
                    onChange={(e) => setDuplicateOf(e.target.value)}
                    placeholder="e.g. 685abc123..."
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: 4,
                      padding: "7px 10px",
                      fontSize: 12,
                      border: "1px solid #c4b5fd",
                      borderRadius: 5,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              {action && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (action === "mark_duplicate" && !duplicateOf)}
                  style={{
                    width: "100%",
                    padding: "9px 0",
                    background: "#1a2e4a",
                    color: "#c9a84c",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Saving…" : "Confirm Decision"}
                </button>
              )}

              {msg && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: msg.startsWith("✓") ? "#065f46" : "#b91c1c",
                    fontWeight: 600,
                  }}
                >
                  {msg}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Allocation Override Component (Searchable Comboboxes & Administrative Metadata)
   ──────────────────────────────────────── */
interface OverrideIssueOption {
  _id: string;
  trackingCode: string;
  title: string;
  domain: string;
  district: string;
  status: string;
  severityScore?: number;
  escalationStage?: number;
  urgencyTrack?: string;
}

interface OverrideCollegeOption {
  _id: string;
  name: string;
  code?: string;
  tier?: string;
  district: string;
  verified?: boolean;
  capabilities?: string[];
  facilities?: Array<{ name: string; equipment?: string[] } | string>;
  researchSpecializations?: string[];
  reputationScore?: number;
}

const OVERRIDE_JUSTIFICATION_OPTIONS = [
  {
    id: "Stage 4: Escalation Direct Nomination",
    title: "Stage 4: Escalation Direct Nomination",
    description: "Standard open-bidding window expired with 0 qualifying proposals. Activating mandatory direct allocation ladder to prevent grievance abandonment.",
    badge: "Escalation Policy",
    icon: Zap,
  },
  {
    id: "Disaster / Public Safety Immediate Directive",
    title: "Disaster / Public Safety Immediate Directive",
    description: "Urgent public health, toxic contamination, structural collapse, or environmental emergency requiring immediate institutional mobilization.",
    badge: "Circuit-Breaker Emergency",
    icon: ShieldAlert,
  },
  {
    id: "Nodal Discretionary Assignment",
    title: "Nodal Discretionary Assignment",
    description: "Departmental directive assigning the issue based on verified specialized laboratory facilities, patent expertise, or district proximity.",
    badge: "Discretionary Mandate",
    icon: Building2,
  },
];

function AllocationOverride() {
  const [issues, setIssues] = useState<OverrideIssueOption[]>([]);
  const [colleges, setColleges] = useState<OverrideCollegeOption[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form selections
  const [selectedIssue, setSelectedIssue] = useState<OverrideIssueOption | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<OverrideCollegeOption | null>(null);
  const [reason, setReason] = useState<string>("Stage 4: Escalation Direct Nomination");
  const [remarks, setRemarks] = useState<string>("");

  // Search filter query state
  const [issueSearch, setIssueSearch] = useState<string>("");
  const [collegeSearch, setCollegeSearch] = useState<string>("");
  const [isIssueOpen, setIsIssueOpen] = useState<boolean>(false);
  const [isCollegeOpen, setIsCollegeOpen] = useState<boolean>(false);

  // Submission & feedback state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    details?: { trackingCode: string; collegeName: string; reason: string };
  } | null>(null);

  const issueDropdownRef = useRef<HTMLDivElement>(null);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // Load data from endpoint
  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await fetch("/api/gov/override-allocation");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIssues(data.issues || []);
          setColleges(data.colleges || []);
          return;
        }
      }

      // Fallback endpoints
      const [issuesRes, collegesRes] = await Promise.all([
        fetch("/api/issues?status=all"),
        fetch("/api/colleges"),
      ]);
      const iData = await issuesRes.json();
      const cData = await collegesRes.json();
      setIssues(iData.data || []);
      setColleges(cData.colleges || []);
    } catch (err) {
      console.warn("Failed to fetch override allocation metadata:", err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target as Node)) {
        setIsIssueOpen(false);
      }
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(e.target as Node)) {
        setIsCollegeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered issues list
  const filteredIssues = issues.filter((i) => {
    if (!issueSearch.trim()) return true;
    const q = issueSearch.toLowerCase();
    return (
      i.trackingCode?.toLowerCase().includes(q) ||
      i.title?.toLowerCase().includes(q) ||
      i.district?.toLowerCase().includes(q) ||
      i.domain?.toLowerCase().includes(q)
    );
  });

  // Filtered colleges list
  const filteredColleges = colleges.filter((c) => {
    if (!collegeSearch.trim()) return true;
    const q = collegeSearch.toLowerCase();
    const facilityText = (c.facilities || [])
      .map((f) => (typeof f === "string" ? f : f.name))
      .join(" ")
      .toLowerCase();
    const capText = (c.capabilities || []).join(" ").toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      facilityText.includes(q) ||
      capText.includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) {
      setFeedback({ type: "error", message: "Please select a target civic challenge from the dropdown." });
      return;
    }
    if (!selectedCollege) {
      setFeedback({ type: "error", message: "Please select an accredited academic institution." });
      return;
    }
    if (!reason.trim()) {
      setFeedback({ type: "error", message: "Please select an administrative override justification." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/gov/override-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: selectedIssue._id,
          collegeId: selectedCollege._id,
          reason,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to execute institutional override allocation.");
      }

      setFeedback({
        type: "success",
        message: data.message || `Successfully allocated ${selectedIssue.trackingCode} to ${selectedCollege.name}.`,
        details: {
          trackingCode: selectedIssue.trackingCode,
          collegeName: selectedCollege.name,
          reason,
        },
      });

      // Reset form
      setSelectedIssue(null);
      setSelectedCollege(null);
      setRemarks("");
      setIssueSearch("");
      setCollegeSearch("");

      // Refetch
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFeedback({ type: "error", message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Institutional Allocation Override</SectionTitle>
        <p className="text-xs text-civic-textMuted -mt-2">
          Statutory executive mechanism to bypass open marketplace bidding and directly allocate grassroots grievances to accredited HEIs under disaster directives or escalation triggers.
        </p>
      </div>

      {/* Success / Error Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm">
              {feedback.type === "success" ? "Allocation Override Executed Successfully" : "Action Required"}
            </div>
            <p className="mt-0.5 leading-relaxed">{feedback.message}</p>
            {feedback.details && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-mono font-bold bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                  {feedback.details.trackingCode}
                </span>
                <span>&rarr; Assigned to</span>
                <span className="font-bold text-emerald-950">{feedback.details.collegeName}</span>
                <span className="text-emerald-700">({feedback.details.reason})</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-civic-surface border border-civic-border rounded-xl shadow-xs p-6 space-y-6">
        {/* Step 1 & Step 2: Two Column Searchable Comboboxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COMBOBOX 1: TARGET ISSUE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-civic-textDark flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-civic-secondary" />
                <span>1. Target Civic Grievance / Challenge</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-civic-textMuted font-medium">
                {issues.length} open issues
              </span>
            </div>

            {/* Dropdown Combobox Container */}
            <div ref={issueDropdownRef} className="relative">
              <div
                onClick={() => {
                  setIsIssueOpen(!isIssueOpen);
                  setIsCollegeOpen(false);
                }}
                className={`w-full min-h-[44px] px-3 py-2 bg-white border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                  isIssueOpen
                    ? "border-civic-primary ring-1 ring-civic-primary shadow-xs"
                    : selectedIssue
                    ? "border-civic-secondary bg-civic-accent/10"
                    : "border-civic-border hover:border-slate-400"
                }`}
              >
                {selectedIssue ? (
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono font-bold text-xs bg-civic-primary text-white px-2 py-0.5 rounded shrink-0">
                      {selectedIssue.trackingCode}
                    </span>
                    <span className="text-xs font-semibold text-civic-textDark truncate">
                      {selectedIssue.title}
                    </span>
                    <span className="text-[11px] text-civic-textMuted shrink-0">
                      ({selectedIssue.district})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {loadingData ? "Loading open issues..." : "Select or search open grievance..."}
                  </span>
                )}
                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  {selectedIssue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIssue(null);
                        setIssueSearch("");
                      }}
                      className="p-1 hover:text-slate-700"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronsUpDown className="w-4 h-4" />
                </div>
              </div>

              {/* Flyout Search Menu */}
              {isIssueOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-civic-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-civic-textMuted shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by code, title, district, or domain..."
                      value={issueSearch}
                      onChange={(e) => setIssueSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-xs bg-transparent border-none focus:outline-none text-civic-textDark placeholder-slate-400"
                      autoFocus
                    />
                    {issueSearch && (
                      <button
                        type="button"
                        onClick={() => setIssueSearch("")}
                        className="text-slate-400 hover:text-slate-700 text-xs px-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {filteredIssues.length === 0 ? (
                      <div className="p-4 text-center text-xs text-civic-textMuted">
                        No matching open issues found.
                      </div>
                    ) : (
                      filteredIssues.map((issue) => {
                        const isSelected = selectedIssue?._id === issue._id;
                        const isDisaster = issue.urgencyTrack === "DISASTER_FAST_TRACK";

                        return (
                          <div
                            key={issue._id}
                            onClick={() => {
                              setSelectedIssue(issue);
                              setIsIssueOpen(false);
                            }}
                            className={`p-3 text-left cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                              isSelected
                                ? "bg-civic-accent/20"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono font-bold text-[11px] bg-civic-accent/30 text-civic-primaryHover px-1.5 py-0.5 rounded border border-civic-accent">
                                  {issue.trackingCode}
                                </span>
                                <span className="text-[10.5px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                  {issue.domain}
                                </span>
                                <span className="text-[11px] font-semibold text-civic-textDark">
                                  {issue.district}
                                </span>
                                {isDisaster && (
                                  <span className="text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-300 px-1.5 py-0.5 rounded uppercase">
                                    Disaster Urgent
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-civic-textDark leading-snug line-clamp-2">
                                {issue.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10.5px] text-civic-textMuted">
                                <span>Stage {issue.escalationStage || 1} • {issue.status.replace(/_/g, " ")}</span>
                                {issue.severityScore && (
                                  <span>• Severity {issue.severityScore}/5</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-civic-primary shrink-0 mt-1" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Issue Preview Card */}
            {selectedIssue && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-civic-primary font-mono">{selectedIssue.trackingCode}</span>
                  <span className="text-[10px] font-bold uppercase bg-civic-accent/30 text-civic-primaryHover px-2 py-0.5 rounded-full">
                    {selectedIssue.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="font-medium text-civic-textDark leading-tight">{selectedIssue.title}</p>
                <div className="flex items-center gap-3 text-[11px] text-civic-textMuted pt-1 border-t border-slate-200/60">
                  <span>District: <strong className="text-civic-textDark">{selectedIssue.district}</strong></span>
                  <span>Domain: <strong className="text-civic-textDark">{selectedIssue.domain}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* COMBOBOX 2: TARGET INSTITUTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-civic-textDark flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-civic-secondary" />
                <span>2. Target Academic Institution (HEI / RO)</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-civic-textMuted font-medium">
                {colleges.length} institutions
              </span>
            </div>

            {/* Dropdown Combobox Container */}
            <div ref={collegeDropdownRef} className="relative">
              <div
                onClick={() => {
                  setIsCollegeOpen(!isCollegeOpen);
                  setIsIssueOpen(false);
                }}
                className={`w-full min-h-[44px] px-3 py-2 bg-white border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                  isCollegeOpen
                    ? "border-civic-primary ring-1 ring-civic-primary shadow-xs"
                    : selectedCollege
                    ? "border-civic-secondary bg-civic-accent/10"
                    : "border-civic-border hover:border-slate-400"
                }`}
              >
                {selectedCollege ? (
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-xs font-bold text-civic-primary truncate">
                      {selectedCollege.name}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                      Tier {selectedCollege.tier || "L2"}
                    </span>
                    <span className="text-[11px] text-civic-textMuted shrink-0">
                      ({selectedCollege.district})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {loadingData ? "Loading institutions..." : "Select or search accredited university / college..."}
                  </span>
                )}
                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  {selectedCollege && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollege(null);
                        setCollegeSearch("");
                      }}
                      className="p-1 hover:text-slate-700"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronsUpDown className="w-4 h-4" />
                </div>
              </div>

              {/* Flyout Search Menu */}
              {isCollegeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-civic-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-civic-textMuted shrink-0" />
                    <input
                      type="text"
                      placeholder="Search institution name, district, or lab facility..."
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-xs bg-transparent border-none focus:outline-none text-civic-textDark placeholder-slate-400"
                      autoFocus
                    />
                    {collegeSearch && (
                      <button
                        type="button"
                        onClick={() => setCollegeSearch("")}
                        className="text-slate-400 hover:text-slate-700 text-xs px-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {filteredColleges.length === 0 ? (
                      <div className="p-4 text-center text-xs text-civic-textMuted">
                        No matching institutions found.
                      </div>
                    ) : (
                      filteredColleges.map((college) => {
                        const isSelected = selectedCollege?._id === college._id;
                        const facilitiesList = (college.facilities || []).map((f) =>
                          typeof f === "string" ? f : f.name
                        );

                        return (
                          <div
                            key={college._id}
                            onClick={() => {
                              setSelectedCollege(college);
                              setIsCollegeOpen(false);
                            }}
                            className={`p-3 text-left cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                              isSelected
                                ? "bg-civic-accent/20"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-bold text-civic-textDark">
                                  {college.name}
                                </span>
                                <span className="text-[10px] font-bold bg-civic-primary text-white px-1.5 py-0.2 rounded">
                                  Tier {college.tier || "L2"}
                                </span>
                                <span className="text-[11px] text-civic-textMuted">
                                  {college.district}
                                </span>
                              </div>

                              {facilitiesList.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {facilitiesList.slice(0, 3).map((fac, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 line-clamp-1"
                                    >
                                      {fac}
                                    </span>
                                  ))}
                                  {facilitiesList.length > 3 && (
                                    <span className="text-[10px] text-civic-textMuted self-center">
                                      +{facilitiesList.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-civic-primary shrink-0 mt-1" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected College Preview Card */}
            {selectedCollege && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-civic-textDark">{selectedCollege.name}</span>
                  <span className="text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Tier {selectedCollege.tier || "L2"} &bull; Verified
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-civic-textMuted pt-1 border-t border-slate-200/60">
                  <span>District: <strong className="text-civic-textDark">{selectedCollege.district}</strong></span>
                  {selectedCollege.reputationScore && (
                    <span>Rating: <strong className="text-civic-textDark">{selectedCollege.reputationScore}/5.0</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Administrative Metadata */}
        <div className="border-t border-civic-border pt-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-civic-textDark flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-civic-secondary" />
              <span>3. Override Justification &amp; Policy Trigger</span>
              <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {OVERRIDE_JUSTIFICATION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = reason === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setReason(opt.id)}
                    className={`text-left p-3.5 border rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-civic-primary ring-2 ring-civic-primary bg-civic-accent/15 shadow-xs"
                        : "border-civic-border bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`p-1.5 rounded-lg border ${
                            isSelected
                              ? "bg-civic-primary text-white border-civic-primary"
                              : "bg-slate-100 text-civic-textMuted border-slate-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-civic-primary text-white"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-civic-textDark leading-tight mb-1">
                        {opt.title}
                      </h4>
                      <p className="text-[11px] text-civic-textMuted leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-civic-textMuted">
                        {isSelected ? "Selected Justification" : "Click to select"}
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-civic-primary bg-civic-primary"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Directives / Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-civic-textDark mb-1.5">
              Nodal Officer Directives &amp; Special Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Mandatory field deployment within 14 calendar days. Fast-track prototype grant allocation authorized under Departmental Emergency Fund."
              className="w-full px-3.5 py-2 text-xs bg-white border border-civic-border rounded-lg text-civic-textDark placeholder-slate-400 focus:outline-none focus:border-civic-primary focus:ring-1 focus:ring-civic-primary"
            />
          </div>
        </div>

        {/* Action & Submission Footer */}
        <div className="border-t border-civic-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-civic-textMuted flex items-center gap-1.5">
            <Info className="w-4 h-4 text-civic-secondary shrink-0" />
            <span>
              Executing override immediately updates issue status to <strong className="text-civic-textDark">DIRECTLY_ALLOCATED</strong> and dispatches high-priority dispatch notifications.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedIssue || !selectedCollege}
            className="w-full sm:w-auto px-7 py-2.5 bg-civic-primary hover:bg-civic-primaryHover text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Override...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-civic-accent" />
                <span>Override &amp; Assign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ────────────────────────────────────────
   College Verification Component
   ──────────────────────────────────────── */
function CollegeVerification() {
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  interface CollegeItem {
    _id: string;
    name: string;
    verified: boolean;
    tier: string;
    district: string;
  }

  useEffect(() => {
    fetch("/api/colleges")
      .then((r) => r.json())
      .then((d) => setColleges(d.colleges || []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    setToggling(id);
    const res = await fetch(`/api/gov/colleges/${id}/verify`, { method: "PATCH" });
    if (res.ok) {
      const d = await res.json();
      setColleges((prev) =>
        prev.map((c) => (c._id === id ? { ...c, verified: d.verified } : c))
      );
    }
    setToggling(null);
  };

  return (
    <div>
      <SectionTitle>College Verification Registry</SectionTitle>
      {loading && <p style={{ fontSize: 13, color: "#64748b" }}>Loading colleges…</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Institution Name", "Tier", "District", "Verified", "Action"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#374151",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colleges.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1a2e4a" }}>{c.name}</td>
                <td style={{ padding: "7px 10px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      background: "#f0f4ff",
                      color: "#1a2e4a",
                      border: "1px solid #c7d2e7",
                      borderRadius: 3,
                    }}
                  >
                    {c.tier}
                  </span>
                </td>
                <td style={{ padding: "7px 10px", color: "#374151" }}>{c.district}</td>
                <td style={{ padding: "7px 10px" }}>
                  {c.verified ? (
                    <span style={{ color: "#065f46", fontWeight: 700, fontSize: 11 }}>✓ Verified</span>
                  ) : (
                    <span style={{ color: "#b91c1c", fontWeight: 700, fontSize: 11 }}>✗ Unverified</span>
                  )}
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <button
                    onClick={() => toggle(c._id)}
                    disabled={toggling === c._id}
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      background: c.verified ? "#fef2f2" : "#f0fdf4",
                      color: c.verified ? "#b91c1c" : "#065f46",
                      border: `1px solid ${c.verified ? "#fca5a5" : "#86efac"}`,
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {toggling === c._id ? "…" : c.verified ? "Revoke" : "Verify"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Analytics Charts Component
   ──────────────────────────────────────── */
interface AnalyticsData {
  summary: { totalIssues: number; totalResolved: number; totalProposals: number; totalFunded: number };
  issuesByDomain: { domain: string; count: number }[];
  issuesByDistrict: { district: string; issues: number; capital: number }[];
  resolutionOverTime: { label: string; total: number; resolved: number; rate: number }[];
  capitalByDistrict: { district: string; capital: number }[];
  proposalFunnel: { status: string; count: number }[];
}

const FUNNEL_COLORS = ["#1a2e4a", "#2d4a73", "#4a7298", "#c9a84c", "#e6c55a", "#f59e0b", "#d97706"];

function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gov/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ fontSize: 13, color: "#64748b" }}>Loading analytics…</p>;
  if (!data) return <p style={{ fontSize: 13, color: "#b91c1c" }}>Failed to load analytics.</p>;

  return (
    <div>
      <SectionTitle>Macro Analytics &amp; State Overview</SectionTitle>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Total Issues Reported" value={data.summary.totalIssues} />
        <StatCard label="Issues Resolved" value={data.summary.totalResolved} accent />
        <StatCard
          label="Resolution Rate"
          value={
            data.summary.totalIssues
              ? `${Math.round((data.summary.totalResolved / data.summary.totalIssues) * 100)}%`
              : "—"
          }
        />
        <StatCard label="Active Proposals" value={data.summary.totalProposals} />
        <StatCard label="Industry Pledges Funded" value={data.summary.totalFunded} accent />
      </div>

      {/* Row 1: Domain bar + Resolution line */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Issues by Domain */}
        <div style={{ border: "1px solid #dde2ea", padding: 16, background: "#fff" }}>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#1a2e4a",
              margin: "0 0 12px",
            }}
          >
            Issues by Domain
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.issuesByDomain} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis
                dataKey="domain"
                tick={{ fontSize: 9, fill: "#374151" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: "#374151" }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a2e4a" name="Issues" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Rate Over Time */}
        <div style={{ border: "1px solid #dde2ea", padding: 16, background: "#fff" }}>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#1a2e4a",
              margin: "0 0 12px",
            }}
          >
            Resolution Rate Over Time (%)
          </p>
          {data.resolutionOverTime.length === 0 ? (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", paddingTop: 80 }}>
              No time-series data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={data.resolutionOverTime}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#374151" }} />
                <YAxis tick={{ fontSize: 10, fill: "#374151" }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${String(v)}%`, "Resolution Rate"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#c9a84c"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#c9a84c" }}
                  name="Rate (%)"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#1a2e4a"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Total Issues"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: District map + Capital bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Jharkhand District Map */}
        <div style={{ border: "1px solid #dde2ea", padding: 16, background: "#fff" }}>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#1a2e4a",
              margin: "0 0 12px",
            }}
          >
            Issue Density by District
          </p>
          <div className="w-full flex justify-center py-2">
            <JharkhandMap
              compact={true}
              districtData={Object.fromEntries(
                data.issuesByDistrict
                  .filter((d) => d.issues > 0)
                  .map((d) => [d.district, { count: d.issues, density: Math.min(100, d.issues * 4) }])
              )}
            />
          </div>
        </div>

        {/* Industry Capital by District */}
        <div style={{ border: "1px solid #dde2ea", padding: 16, background: "#fff" }}>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#1a2e4a",
              margin: "0 0 12px",
            }}
          >
            Industry Capital Committed by District (₹)
          </p>
          {data.capitalByDistrict.length === 0 ? (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", paddingTop: 80 }}>
              No funded pledges yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.capitalByDistrict}
                margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis
                  dataKey="district"
                  tick={{ fontSize: 9, fill: "#374151" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#374151" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Capital"]} />
                <Bar dataKey="capital" fill="#c9a84c" name="Capital (₹)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Proposal Status Funnel */}
      <div style={{ border: "1px solid #dde2ea", padding: 16, background: "#fff" }}>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#1a2e4a",
            margin: "0 0 12px",
          }}
        >
          Proposal Pipeline Funnel
        </p>
        {data.proposalFunnel.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", paddingTop: 40 }}>
            No proposals submitted yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <FunnelChart>
              <Tooltip formatter={(v) => [Number(v), "Proposals"]} />
              <Funnel
                dataKey="count"
                data={data.proposalFunnel.map((p, i) => ({
                  ...p,
                  name: p.status.replace(/_/g, " "),
                  fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                }))}
                isAnimationActive
              >
                {data.proposalFunnel.map((_, i) => (
                  <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Main Gov Dashboard Page
   ──────────────────────────────────────── */
export type TabId = "analytics" | "review" | "allocate" | "colleges";

export default function GovDashboardClient({ initialTab = "analytics" }: { initialTab?: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "analytics", label: "Analytics Dashboard", icon: <CheckCircle size={14} /> },
    { id: "review", label: "Review Queue", icon: <AlertTriangle size={14} /> },
    { id: "allocate", label: "Allocation Override", icon: <Building2 size={14} /> },
    { id: "colleges", label: "College Verification", icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#1a2e4a",
            margin: "0 0 4px",
          }}
        >
          Government Department Portal
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          State Nodal Review Office — Jharkhand Higher &amp; Technical Education
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "2px solid #e2e8f0",
          marginBottom: 20,
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: activeTab === t.id ? "#1a2e4a" : "#64748b",
              borderBottom: activeTab === t.id ? "2px solid #c9a84c" : "2px solid transparent",
              marginBottom: -2,
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <RefreshCw
            size={14}
            style={{ color: "#94a3b8", cursor: "pointer" }}
            onClick={() => window.location.reload()}
            aria-label="Refresh page"
          />
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "analytics" && <AnalyticsDashboard />}
      {activeTab === "review" && <ReviewQueue />}
      {activeTab === "allocate" && <AllocationOverride />}
      {activeTab === "colleges" && <CollegeVerification />}
    </div>
  );
}
