"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Building,
  Coins,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Star,
} from "lucide-react";
import { ISSUE_DOMAINS } from "@/lib/constants/domains";

interface IssueItem {
  _id: string;
  trackingCode: string;
  title: string;
  description: string;
  domain: string;
  severityScore: number;
  isStarred?: boolean;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiAnalysisReason?: string;
  suggestedDepartment?: string;
  district: string;
  status: string;
  facingSince: string;
  citizenName: string;
  createdAt: string;
  assignedColleges?: Array<{ _id: string; name: string; tier: string }>;
}

interface DistrictDashboardViewProps {
  districtName: string;
  division: string;
  headquarter: string;
  stats: {
    totalIssues: number;
    resolvedCount: number;
    inProgressCount: number;
    heisDeployed: number;
    fundsCommitted: number;
    resolutionRate: number;
  };
  initialIssues: IssueItem[];
}

export default function DistrictDashboardView({
  districtName,
  division,
  headquarter,
  stats,
  initialIssues,
}: DistrictDashboardViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Status Badge Formatter (Plain colored text labels without glowing pill aesthetic)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Resolved":
        return "text-emerald-800 bg-emerald-50 border-emerald-300";
      case "Under_Review":
        return "text-amber-800 bg-amber-50 border-amber-300";
      case "Assigned_HEI":
        return "text-navy bg-slate-100 border-slate-300 font-semibold";
      case "Proposal_Submitted":
        return "text-blue-800 bg-blue-50 border-blue-300";
      case "Under_Prototyping":
        return "text-purple-800 bg-purple-50 border-purple-300";
      case "Industry_Funded":
        return "text-green-800 bg-green-50 border-green-300";
      case "Duplicate":
        return "text-orange-800 bg-orange-50 border-orange-300";
      case "Rejected":
        return "text-rose-800 bg-rose-50 border-rose-300";
      case "Reported":
      default:
        return "text-slate-800 bg-slate-100 border-slate-300";
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} Lakh`;
    return `₹ ${amount.toLocaleString("en-IN")}`;
  };

  const filteredIssues = useMemo(() => {
    return initialIssues.filter((issue) => {
      const matchesStatus =
        selectedStatus === "all" || issue.status === selectedStatus;
      const matchesDomain =
        selectedDomain === "all" || issue.domain === selectedDomain;
      const matchesSearch =
        !searchQuery ||
        issue.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesDomain && matchesSearch;
    });
  }, [initialIssues, selectedStatus, selectedDomain, searchQuery]);

  return (
    <div className="min-h-screen bg-civic-canvas text-civic-textDark flex flex-col">
      {/* Top Government Identifier Bar */}
      <div className="bg-civic-primary text-white text-xs py-2 px-4 sm:px-8 border-b border-civic-primaryHover flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px] text-white">
            Government of Jharkhand
          </span>
          <span className="text-civic-accent">|</span>
          <span className="text-slate-200">
            CivicResolve Public Transparency Portal
          </span>
        </div>
        <div className="text-civic-accent text-[11px] font-medium">
          District Problem Sourcing &amp; Resolution Framework
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-civic-surface border-b border-civic-border py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/" suppressHydrationWarning={true} className="group block">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-civic-primary tracking-tight block leading-tight">
                CivicResolve
              </span>
              <span className="text-[11px] sm:text-xs text-civic-textMuted block mt-0.5">
                District Problem Sourcing &amp; HEI Solution Registry
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              suppressHydrationWarning={true}
              className="inline-flex items-center text-xs text-civic-primary font-semibold px-3 py-1.5 border border-civic-border bg-civic-canvas hover:bg-slate-200/70 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 text-civic-secondary" />
              State Overview
            </Link>
          </div>
        </div>
      </header>

      {/* District Banner */}
      <section className="bg-civic-surface border-b border-civic-border py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-block text-[11px] font-semibold text-civic-primaryHover bg-civic-accent/25 border border-civic-accent px-2.5 py-0.5 uppercase tracking-wider mb-2 rounded-full">
                Administrative Division: {division}
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-civic-textDark leading-none">
                {districtName} District
              </h1>
              <p className="text-xs sm:text-sm text-civic-textMuted mt-1">
                District Headquarter: {headquarter} &bull; Public Transparency
                &amp; Accountability Record
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Citizen Data &bull; Live Synchronization</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Stat Blocks */}
      <section className="py-6 px-4 sm:px-8 bg-civic-canvas">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-civic-surface border border-civic-border p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-civic-textMuted mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Challenges Sourced
                </span>
                <Clock className="w-4 h-4 text-civic-secondary" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-civic-primary tracking-tight">
                {stats.totalIssues}
              </div>
              <div className="text-[11px] text-civic-textMuted mt-1">
                {stats.inProgressCount} under active review / HEI action
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-civic-surface border border-civic-border p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-civic-textMuted mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  HEIs Deployed
                </span>
                <Building className="w-4 h-4 text-civic-secondary" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-civic-primary tracking-tight">
                {stats.heisDeployed}
              </div>
              <div className="text-[11px] text-civic-textMuted mt-1">
                Participating university &amp; polytechnic teams
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-civic-surface border border-civic-border p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-civic-textMuted mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Industry Capital
                </span>
                <Coins className="w-4 h-4 text-civic-secondary" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-civic-primary tracking-tight">
                {formatCurrency(stats.fundsCommitted)}
              </div>
              <div className="text-[11px] text-civic-textMuted mt-1">
                Committed via CSR &amp; corporate pledges
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-civic-surface border border-civic-border p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-civic-textMuted mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Resolution Rate
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-civic-primary tracking-tight">
                {stats.resolutionRate}%
              </div>
              <div className="text-[11px] text-civic-textMuted mt-1">
                {stats.resolvedCount} challenges verified resolved
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filterable Issues Section */}
      <section className="pb-12 px-4 sm:px-8 flex-1 bg-civic-canvas">
        <div className="max-w-6xl mx-auto">
          <div className="bg-civic-surface border border-civic-border p-4 sm:p-6 rounded-xl shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-civic-border">
              <div>
                <h2 className="text-lg font-serif font-bold text-civic-textDark">
                  District Challenges Log ({filteredIssues.length} of{" "}
                  {initialIssues.length})
                </h2>
                <p className="text-xs text-civic-textMuted">
                  Public ledger of registered civic issues, technical domains,
                  and resolution milestones
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-civic-textMuted" />
                <input
                  type="text"
                  placeholder="Search code or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-civic-border text-civic-textDark placeholder-slate-400 focus:outline-none focus:border-civic-primary focus:ring-1 focus:ring-civic-primary rounded-lg"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 py-3 border-b border-slate-200 bg-slate-50 px-3 my-2 text-xs rounded-lg">
              <div className="flex items-center space-x-1.5 text-civic-textDark font-medium">
                <Filter className="w-3.5 h-3.5 text-civic-secondary" />
                <span>Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1">
                <label
                  htmlFor="status-filter"
                  className="text-civic-textMuted text-[11px]"
                >
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-white border border-civic-border py-1 px-2 text-xs text-civic-textDark focus:outline-none focus:border-civic-primary rounded-lg"
                >
                  <option value="all">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Under_Review">Under Review</option>
                  <option value="Assigned_HEI">Assigned HEI</option>
                  <option value="Proposal_Submitted">Proposal Submitted</option>
                  <option value="Under_Prototyping">Under Prototyping</option>
                  <option value="Industry_Funded">Industry Funded</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Domain Filter */}
              <div className="flex items-center space-x-1">
                <label
                  htmlFor="domain-filter"
                  className="text-civic-textMuted text-[11px]"
                >
                  Domain:
                </label>
                <select
                  id="domain-filter"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-white border border-civic-border py-1 px-2 text-xs text-civic-textDark focus:outline-none focus:border-civic-primary rounded-lg"
                >
                  <option value="all">All Domains</option>
                  {ISSUE_DOMAINS.map((domain) => (
                    <option
                      key={domain}
                      value={domain}
                      className="bg-white text-civic-textDark"
                    >
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedStatus !== "all" ||
                selectedDomain !== "all" ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedStatus("all");
                    setSelectedDomain("all");
                    setSearchQuery("");
                  }}
                  className="text-xs text-civic-primary hover:text-civic-primaryHover underline ml-auto font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Issues List / Table */}
            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center text-civic-textMuted">
                <AlertCircle className="w-8 h-8 mx-auto text-civic-textMuted mb-2" />
                <p className="text-sm font-semibold text-civic-textDark">
                  No issues found matching criteria
                </p>
                <p className="text-xs text-civic-textMuted mt-1">
                  Try adjusting your filter options or search term.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-civic-border bg-slate-50 text-[11px] font-semibold text-civic-textMuted uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tracking Code</th>
                      <th className="py-2.5 px-3">Issue Title &amp; Scope</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3 text-center">Severity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reported On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredIssues.map((issue) => {
                      const dateStr = new Date(
                        issue.createdAt,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

                      return (
                        <tr
                          key={issue._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-semibold text-civic-primary whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span>{issue.trackingCode}</span>
                              {issue.isStarred && (
                                <span
                                  title={
                                    issue.aiAnalysisReason ||
                                    "Flagged by automated AI Criticality Triage"
                                  }
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs text-[10px] font-bold w-fit"
                                >
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                                  <span>★ AI Star Flag</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 max-w-md">
                            <div className="font-semibold text-civic-textDark leading-snug">
                              {issue.title}
                            </div>
                            <p className="text-civic-textMuted text-[11px] line-clamp-2 mt-0.5">
                              {issue.description}
                            </p>
                            {issue.aiAnalysisReason && (
                              <div className="mt-1.5 p-1.5 bg-amber-50/80 border border-amber-200 rounded-md text-[10.5px] text-amber-900 font-medium flex items-start gap-1.5">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>AI Triage Rationale:</strong>{" "}
                                  {issue.aiAnalysisReason}
                                </span>
                              </div>
                            )}
                            {issue.assignedColleges &&
                              issue.assignedColleges.length > 0 && (
                                <div className="mt-1 text-[10.5px] text-civic-textDark font-medium flex items-center gap-1">
                                  <Building className="w-3 h-3 text-civic-secondary" />
                                  <span>
                                    Assigned HEI:{" "}
                                    {issue.assignedColleges
                                      .map((c) => c.name)
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-civic-textMuted">
                            <span className="inline-block px-2.5 py-0.5 bg-civic-accent/25 border border-civic-accent text-[11px] text-civic-primaryHover font-medium rounded-full">
                              {issue.domain}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block font-semibold text-[11px] px-2 py-0.5 border rounded-full ${
                                issue.severityScore >= 4
                                  ? "text-red-800 bg-red-50 border-red-200"
                                  : issue.severityScore === 3
                                    ? "text-amber-800 bg-amber-50 border-amber-200"
                                    : "text-emerald-800 bg-emerald-50 border-emerald-200"
                              }`}
                            >
                              Level {issue.severityScore}/5
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[11px] border font-medium rounded-full ${getStatusBadge(
                                issue.status,
                              )}`}
                            >
                              {issue.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-civic-textMuted text-[11px]">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-civic-textMuted" />
                              <span>{dateStr}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-4 px-4 sm:px-8 text-xs text-civic-textMuted mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher &amp; Technical Education,
            Government of Jharkhand.
          </div>
          <div className="text-civic-textMuted">
            District Portal &bull; {districtName}
          </div>
        </div>
      </footer>
    </div>
  );
}
