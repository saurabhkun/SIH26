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
} from "lucide-react";
import { ISSUE_DOMAINS } from "@/lib/constants/domains";

interface IssueItem {
  _id: string;
  trackingCode: string;
  title: string;
  description: string;
  domain: string;
  severityScore: number;
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
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Government Bar */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-8 border-b border-gold/40 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            Government of Jharkhand
          </span>
          <span className="text-gold">|</span>
          <span className="text-slate-300">
            Higher & Technical Education Department
          </span>
        </div>
        <div className="text-slate-300 text-[11px]">
          Public Transparency Dashboard &bull; PS 26043
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-300 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/" className="group block">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-navy tracking-tight block leading-tight">
                CivicResolve
              </span>
              <span className="text-[11px] sm:text-xs text-slate-600 block mt-0.5">
                District Problem Sourcing & HEI Solution Registry
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center text-xs text-navy font-semibold px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              State Overview
            </Link>
          </div>
        </div>
      </header>

      {/* District Banner */}
      <section className="bg-white border-b border-slate-300 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-block text-[11px] font-semibold text-navy bg-gold/15 border border-gold/40 px-2.5 py-0.5 uppercase tracking-wider mb-2">
                Administrative Division: {division}
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy leading-none">
                {districtName} District
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                District Headquarter: {headquarter} &bull; Public Transparency & Accountability Record
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Direct Citizen Data &bull; Live Synchronization</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Plain Stat Blocks (Bordered boxes without card shadows) */}
      <section className="py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-white border border-slate-300 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Challenges Sourced
                </span>
                <Clock className="w-4 h-4 text-navy" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-navy">
                {stats.totalIssues}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.inProgressCount} currently under active review/HEI action
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border border-slate-300 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  HEIs Deployed
                </span>
                <Building className="w-4 h-4 text-navy" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-navy">
                {stats.heisDeployed}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Participating university & polytechnic teams
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border border-slate-300 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Industry Capital
                </span>
                <Coins className="w-4 h-4 text-gold" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-navy">
                {formatCurrency(stats.fundsCommitted)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Committed via CSR & corporate pledges
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white border border-slate-300 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Resolution Rate
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-navy">
                {stats.resolutionRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.resolvedCount} challenges verified resolved
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filterable Issues Section */}
      <section className="pb-12 px-4 sm:px-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-300 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-serif font-bold text-navy">
                  District Challenges Log ({filteredIssues.length} of {initialIssues.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Public ledger of registered civic issues, technical domains, and resolution milestones
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-navy bg-slate-50"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 py-3 border-b border-slate-200 bg-slate-50/50 px-2 my-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1">
                <label htmlFor="status-filter" className="text-slate-500 text-[11px]">
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-white border border-slate-300 py-1 px-2 text-xs text-ink focus:outline-none focus:border-navy"
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
                <label htmlFor="domain-filter" className="text-slate-500 text-[11px]">
                  Domain:
                </label>
                <select
                  id="domain-filter"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-white border border-slate-300 py-1 px-2 text-xs text-ink focus:outline-none focus:border-navy"
                >
                  <option value="all">All Domains</option>
                  {ISSUE_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedStatus !== "all" || selectedDomain !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedStatus("all");
                    setSelectedDomain("all");
                    setSearchQuery("");
                  }}
                  className="text-xs text-navy underline hover:text-navyLight ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Issues List / Table */}
            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No issues found matching criteria</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your filter options or search term.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tracking Code</th>
                      <th className="py-2.5 px-3">Issue Title & Scope</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3 text-center">Severity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reported On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredIssues.map((issue) => {
                      const dateStr = new Date(issue.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

                      return (
                        <tr
                          key={issue._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-semibold text-navy whitespace-nowrap">
                            {issue.trackingCode}
                          </td>
                          <td className="py-3 px-3 max-w-md">
                            <div className="font-semibold text-slate-900 leading-snug">
                              {issue.title}
                            </div>
                            <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">
                              {issue.description}
                            </p>
                            {issue.assignedColleges && issue.assignedColleges.length > 0 && (
                              <div className="mt-1 text-[10.5px] text-navy font-medium flex items-center gap-1">
                                <Building className="w-3 h-3 text-gold" />
                                <span>
                                  Assigned HEI: {issue.assignedColleges.map((c) => c.name).join(", ")}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-[11px]">
                              {issue.domain}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block font-semibold text-[11px] px-1.5 py-0.5 border ${
                                issue.severityScore >= 4
                                  ? "text-red-700 bg-red-50 border-red-200"
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
                              className={`inline-block px-2 py-0.5 text-[11px] border font-medium ${getStatusBadge(
                                issue.status
                              )}`}
                            >
                              {issue.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
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
      <footer className="bg-white border-t border-slate-300 py-4 px-4 sm:px-8 text-xs text-slate-600 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.
          </div>
          <div className="text-slate-500">
            District Portal &bull; {districtName}
          </div>
        </div>
      </footer>
    </div>
  );
}
