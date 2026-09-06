"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { CheckCircle, AlertTriangle, Building2, ShieldCheck, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

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
      style={{
        border: `1px solid ${accent ? "#c9a84c" : "#dde2ea"}`,
        borderTop: `3px solid ${accent ? "#c9a84c" : "#1a2e4a"}`,
        background: "#fff",
        padding: "16px 20px",
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "Georgia, serif",
          color: accent ? "#c9a84c" : "#1a2e4a",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "Georgia, serif",
        fontSize: 16,
        fontWeight: 700,
        color: "#1a2e4a",
        borderBottom: "2px solid #c9a84c",
        paddingBottom: 6,
        marginBottom: 16,
      }}
    >
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
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#1a2e4a" }}>{selected.title}</p>
              <p style={{ margin: "0 0 6px", color: "#374151", lineHeight: 1.5, fontSize: 12 }}>
                {selected.description || "No description provided."}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
                <span style={{ color: "#64748b" }}>Domain: <b>{selected.domain}</b></span>
                <span style={{ color: "#64748b" }}>District: <b>{selected.district}</b></span>
                <span style={{ color: "#64748b" }}>Status: <b>{selected.status}</b></span>
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
   Allocation Override Component
   ──────────────────────────────────────── */
function AllocationOverride() {
  const [issueId, setIssueId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!issueId.trim() || !collegeId.trim()) {
      setMsg("Both Issue ID and College ID are required.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/gov/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId: issueId.trim(), collegeId: collegeId.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg(`✓ Issue assigned to "${d.college}" (${d.issueStatus}).`);
        setIssueId("");
        setCollegeId("");
      } else {
        setMsg(`Error: ${d.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionTitle>Institutional Allocation Override</SectionTitle>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
        Manually assign a college to an issue, bypassing the marketplace claim. Enter MongoDB Object IDs.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
            Issue Object ID
          </label>
          <input
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="e.g. 685..."
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 12,
              border: "1px solid #cbd5e1",
              borderRadius: 5,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
            College Object ID
          </label>
          <input
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            placeholder="e.g. 685..."
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 12,
              border: "1px solid #cbd5e1",
              borderRadius: 5,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "8px 20px",
            background: "#1a2e4a",
            color: "#c9a84c",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Saving…" : "Override & Assign"}
        </button>
      </div>
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
          <div style={{ height: 280 }}>
            <JharkhandMap
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
type TabId = "analytics" | "review" | "allocate" | "colleges";

export default function GovDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>("analytics");

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
