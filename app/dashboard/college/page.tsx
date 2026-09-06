"use client";

import React, { useState, useEffect } from "react";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import {
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Send,
  Trash2,
  Filter,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Award,
  Sliders,
  Layers,
  CheckSquare,
} from "lucide-react";
import { ISSUE_DOMAINS, IssueDomain } from "@/lib/constants/domains";

interface IssueItem {
  _id: string;
  trackingCode: string;
  title: string;
  description: string;
  domain: IssueDomain;
  severityScore: number;
  district: string;
  address?: string;
  facingSince?: string;
  citizenName: string;
  status: string;
  isCapabilityMatch: boolean;
  matchingFacilityName?: string;
  isClaimedByThisCollege: boolean;
  existingProposal?: {
    _id: string;
    title: string;
    status: string;
  } | null;
}

interface TeamMember {
  name: string;
  role: string;
  discipline: string;
}

interface Milestone {
  title: string;
  description: string;
  dueDate: string;
  fundingReleaseAmount: number;
  status: "Pending" | "In_Progress" | "Completed" | "Delayed";
  fundingReleased?: boolean;
}

interface ProposalItem {
  _id: string;
  title: string;
  technicalScope: string;
  budgetRequested: number;
  facultyMentor: string;
  status: string;
  team: TeamMember[];
  milestones: Milestone[];
  issue: {
    _id: string;
    title: string;
    trackingCode: string;
    district: string;
    domain: string;
    severityScore: number;
  };
  createdAt: string;
}

interface Facility {
  name: string;
  description?: string;
  relatedDomains: IssueDomain[];
}

interface FacultyMember {
  name: string;
  department: string;
  specialization?: string;
  email: string;
}

interface CollegeProfile {
  _id: string;
  name: string;
  district: string;
  tier: string;
  capabilities: IssueDomain[];
  facilities: Facility[];
  faculty: FacultyMember[];
  contactPerson?: string;
  contactPhone?: string;
  maxConcurrentClaims: number;
  activeProposalsCount: number;
  isAtCap: boolean;
  remainingClaims: number;
}

export default function CollegeDashboardPage() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "tracker" | "profile">("marketplace");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CollegeProfile | null>(null);
  const [marketplaceIssues, setMarketplaceIssues] = useState<IssueItem[]>([]);
  const [myProposals, setMyProposals] = useState<ProposalItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Proposal modal state
  const [claimModalIssue, setClaimModalIssue] = useState<IssueItem | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalScope, setProposalScope] = useState("");
  const [proposalBudget, setProposalBudget] = useState(150000);
  const [proposalMentor, setProposalMentor] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "Aditya Kumar", role: "Student Team Lead", discipline: "Environmental Engineering" },
    { name: "Pooja Soren", role: "Field Data Analyst", discipline: "Computer Science" },
  ]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      title: "Phase 1: Lab Validation & Sensor Calibration",
      description: "Site sample testing and IoT hardware prototype assembly",
      dueDate: "2026-10-15",
      fundingReleaseAmount: 60000,
      status: "Pending",
    },
    {
      title: "Phase 2: Pilot Deployment & Village Testing",
      description: "Field installation of modular unit with real-time telemetry",
      dueDate: "2026-11-20",
      fundingReleaseAmount: 60000,
      status: "Pending",
    },
    {
      title: "Phase 3: Certification & Nodal Handover",
      description: "Final performance metrics submission to District Administration",
      dueDate: "2026-12-30",
      fundingReleaseAmount: 30000,
      status: "Pending",
    },
  ]);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Profile Edit State
  const [savingProfile, setSavingProfile] = useState(false);
  const [editCapabilities, setEditCapabilities] = useState<IssueDomain[]>([]);
  const [editFacilities, setEditFacilities] = useState<Facility[]>([]);
  const [editFaculty, setEditFaculty] = useState<FacultyMember[]>([]);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Load all initial data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Load College Profile
      const resProfile = await fetch("/api/colleges/me");
      const profileData = await resProfile.json();
      if (profileData.success && profileData.data) {
        setProfile(profileData.data);
        setEditCapabilities(profileData.data.capabilities || []);
        setEditFacilities(profileData.data.facilities || []);
        setEditFaculty(profileData.data.faculty || []);
        if (profileData.data.faculty?.length > 0 && !proposalMentor) {
          setProposalMentor(profileData.data.faculty[0].name);
        }
      }

      // 2. Load Marketplace
      const resMarket = await fetch("/api/issues/marketplace");
      const marketData = await resMarket.json();
      if (marketData.success) {
        setMarketplaceIssues(marketData.data || []);
      }

      // 3. Load My Proposals
      const resProps = await fetch("/api/proposals?college=me");
      const propsData = await resProps.json();
      if (propsData.success) {
        setMyProposals(propsData.data || []);
      }
    } catch (err) {
      console.error("Failed to load college dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open Claim Modal
  const handleOpenClaim = (issue: IssueItem) => {
    setClaimModalIssue(issue);
    setProposalTitle(`Techno-Solution Plan for ${issue.title}`);
    setProposalScope(
      `Our team will deploy an engineered resolution for ${issue.title} located at ${issue.district}. The solution leverages our departmental laboratory capabilities to deliver localized, measurable community impact with continuous telemetry.`
    );
    setFormFeedback(null);
  };

  // Add team member row
  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", role: "Researcher", discipline: "Engineering" }]);
  };

  // Remove team member row
  const removeTeamMember = (idx: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  // Add milestone row
  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Phase ${milestones.length + 1}: Implementation Stage`,
        description: "Milestone execution and verifiable deliverable",
        dueDate: "2026-12-31",
        fundingReleaseAmount: 40000,
        status: "Pending",
      },
    ]);
  };

  // Remove milestone row
  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  // Submit Proposal Handler
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimModalIssue) return;

    if (!proposalTitle || !proposalScope || !proposalMentor) {
      setFormFeedback({
        type: "error",
        msg: "Please fill in all mandatory fields (Title, Scope, and Faculty Mentor).",
      });
      return;
    }

    setSubmittingProposal(true);
    setFormFeedback(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: claimModalIssue._id,
          title: proposalTitle,
          technicalScope: proposalScope,
          budgetRequested: Number(proposalBudget),
          facultyMentor: proposalMentor,
          team: teamMembers,
          milestones: milestones,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormFeedback({
          type: "error",
          msg: data.error || "Failed to submit proposal due to server error.",
        });
        setSubmittingProposal(false);
        return;
      }

      setFormFeedback({
        type: "success",
        msg: `Proposal successfully submitted! Challenge #${claimModalIssue.trackingCode} is now in 'Proposal Submitted' status.`,
      });

      // Reload dashboard data after short delay
      setTimeout(() => {
        setClaimModalIssue(null);
        setActiveTab("tracker");
        loadDashboardData();
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Submission failed";
      setFormFeedback({ type: "error", msg: errorMsg });
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Toggle milestone status
  const handleUpdateMilestone = async (
    proposalId: string,
    milestoneIndex: number,
    newStatus: string
  ) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneIndex, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh proposals
        setMyProposals((prev) =>
          prev.map((p) => (p._id === proposalId ? data.data : p))
        );
      }
    } catch (err) {
      console.error("Failed to update milestone status:", err);
    }
  };

  // Save Self-Reported Institutional Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const res = await fetch("/api/colleges/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilities: editCapabilities,
          facilities: editFacilities,
          faculty: editFaculty,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfileFeedback("Institutional profile and self-reported capabilities successfully updated!");
        loadDashboardData();
        setTimeout(() => setProfileFeedback(null), 4000);
      } else {
        setProfileFeedback(data.error || "Failed to update profile.");
      }
    } catch {
      setProfileFeedback("Failed to connect to server.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Filter marketplace issues
  const filteredIssues = marketplaceIssues.filter((issue) => {
    const matchesDomain =
      selectedDomain === "all" || issue.domain.toLowerCase() === selectedDomain.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.trackingCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const navItems: NavItem[] = [
    {
      label: "Challenge Marketplace",
      href: "#marketplace",
      iconName: "search",
      active: activeTab === "marketplace",
    },
    {
      label: "Project Tracker",
      href: "#tracker",
      iconName: "todo",
      active: activeTab === "tracker",
    },
    {
      label: "Institutional Profile",
      href: "#profile",
      iconName: "code",
      active: activeTab === "profile",
    },
  ];

  return (
    <DashboardShell
      role="college"
      roleTitle="University & College Innovation Portal"
      userName="Dr. Ananya Sen"
      userEmail="rnd.director@bitmesra.ac.in"
      designation="Dean of Research & Innovation"
      organizationOrCollege={profile?.name || "Birla Institute of Technology, Mesra"}
      navItems={navItems}
    >
      <div className="space-y-6">
        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "marketplace"
                  ? "bg-[#1A365D] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Search className="w-4 h-4 inline mr-2 text-[#C9A227]" />
              Challenge Marketplace ({marketplaceIssues.length})
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "tracker"
                  ? "bg-[#1A365D] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-2 text-[#C9A227]" />
              Project Tracker & Milestones ({myProposals.length})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "profile"
                  ? "bg-[#1A365D] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4 inline mr-2 text-[#C9A227]" />
              Institutional Capabilities (Self-Report)
            </button>
          </div>

          {/* Institutional Fairness Quota Status */}
          {profile && (
            <div className="flex items-center space-x-3 mt-3 md:mt-0">
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-2 ${
                  profile.isAtCap
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <Award className="w-4 h-4 text-[#C9A227]" />
                <span>
                  Active Claims: <strong>{profile.activeProposalsCount}</strong> /{" "}
                  <strong>{profile.maxConcurrentClaims}</strong> Cap
                </span>
                {profile.isAtCap ? (
                  <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    CAP REACHED
                  </span>
                ) : (
                  <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {profile.remainingClaims} REMAINING
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CHALLENGE MARKETPLACE */}
        {/* ========================================================= */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">
            {/* Fairness Rule Warning Banner if at Cap */}
            {profile?.isAtCap && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start space-x-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-bold">Fairness Rule Enforcement Active</h4>
                  <p className="mt-1 text-amber-800">
                    Your institution has reached its allocation cap of{" "}
                    <strong>{profile.maxConcurrentClaims} active projects</strong>. To ensure
                    equitable distribution of state R&D resources across all Jharkhand HEIs, you
                    must complete milestones on your existing projects in the{" "}
                    <strong>Project Tracker</strong> before claiming new civic challenges.
                  </p>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search challenges, tracking codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-600 flex-shrink-0">Domain:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                >
                  <option value="all">All Domains ({marketplaceIssues.length})</option>
                  {ISSUE_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Marketplace Challenges Grid */}
            {loading ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1A365D] mb-3" />
                <p className="text-sm text-slate-600">Loading civic challenge marketplace...</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <h3 className="font-bold text-slate-800">No matching challenges found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Try clearing your search query or selecting a different civic domain.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue._id}
                    className={`bg-white rounded-xl border transition-all p-5 flex flex-col justify-between ${
                      issue.isCapabilityMatch
                        ? "border-[#C9A227] shadow-md ring-1 ring-[#C9A227]/30"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div>
                      {/* Match Badge & Meta Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {issue.trackingCode}
                          </span>
                          <span className="text-[11px] font-semibold text-[#1A365D] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {issue.domain}
                          </span>
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            📍 {issue.district}
                          </span>
                        </div>

                        {/* Severity Score Indicator */}
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200 text-xs font-bold flex-shrink-0">
                          <span>Sev: {issue.severityScore}/5</span>
                        </div>
                      </div>

                      {/* Capability Match Highlight Banner */}
                      {issue.isCapabilityMatch && (
                        <div className="mb-3 px-3 py-1.5 bg-[#FFF9E6] border border-[#E6C65A] rounded-md flex items-center justify-between text-xs text-[#8A6700]">
                          <span className="flex items-center font-bold">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#C9A227]" />
                            AI Capability Match
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {issue.matchingFacilityName || "Declared R&D Strength"}
                          </span>
                        </div>
                      )}

                      {/* Challenge Title */}
                      <h3 className="font-serif font-bold text-base text-slate-900 leading-snug mb-2">
                        {issue.title}
                      </h3>

                      {/* Problem Description */}
                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {issue.description}
                      </p>

                      {/* Citizen / Context Footer */}
                      <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex justify-between items-center mb-4">
                        <span>Reported by: <strong>{issue.citizenName}</strong></span>
                        <span className="capitalize">
                          Status:{" "}
                          <strong
                            className={
                              issue.status === "Proposal_Submitted"
                                ? "text-blue-700"
                                : "text-amber-700"
                            }
                          >
                            {issue.status.replace(/_/g, " ")}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-2">
                      {issue.isClaimedByThisCollege ? (
                        <div className="w-full py-2 px-3 bg-blue-50 border border-blue-200 rounded-md text-center text-xs font-semibold text-blue-800 flex items-center justify-center space-x-1.5">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Proposal Submitted by BIT Mesra</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenClaim(issue)}
                          disabled={profile?.isAtCap}
                          className={`w-full py-2.5 px-4 rounded-md text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                            profile?.isAtCap
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-[#1A365D] hover:bg-[#132845] text-white shadow-sm"
                          }`}
                        >
                          <Send className="w-3.5 h-3.5 text-[#C9A227]" />
                          <span>
                            {profile?.isAtCap
                              ? "Claim Locked (Allocation Cap Reached)"
                              : "Claim Challenge & Submit Proposal"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROJECT TRACKER & MILESTONES */}
        {/* ========================================================= */}
        {activeTab === "tracker" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900">
                    Active Institutional Proposals & Projects
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track solution delivery, team rosters, and update milestone execution milestones for government and industry review.
                  </p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Proposals</span>
                </button>
              </div>

              {myProposals.length === 0 ? (
                <div className="py-12 text-center">
                  <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <h4 className="font-bold text-slate-700">No active proposals yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Visit the <strong>Challenge Marketplace</strong> tab to claim state civic challenges and submit technical R&D proposals.
                  </p>
                  <button
                    onClick={() => setActiveTab("marketplace")}
                    className="mt-4 px-4 py-2 bg-[#1A365D] text-white text-xs font-bold rounded-md"
                  >
                    Browse Challenges
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myProposals.map((prop) => (
                    <div
                      key={prop._id}
                      className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-all space-y-4"
                    >
                      {/* Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[11px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                              {prop.issue?.trackingCode || "CR-JH-PROPOSAL"}
                            </span>
                            <span className="text-xs text-slate-500">
                              📍 {prop.issue?.district} | {prop.issue?.domain}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-base text-slate-900">
                            {prop.title}
                          </h3>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full">
                            ₹{prop.budgetRequested.toLocaleString("en-IN")} Budget
                          </span>
                          <span className="px-3 py-1 bg-[#1A365D] text-white text-xs font-bold rounded-full">
                            Status: {prop.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* Scope Summary & Mentor */}
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                        <strong>Technical Abstract:</strong> {prop.technicalScope}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                        <div>
                          <strong>Faculty Mentor:</strong> {prop.facultyMentor}
                        </div>
                        <div>
                          <strong>Team Members ({prop.team?.length || 0}):</strong>{" "}
                          {prop.team?.map((m) => `${m.name} (${m.role})`).join(", ")}
                        </div>
                      </div>

                      {/* Milestones Checklist & Status Updaters */}
                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
                          <CheckCircle className="w-3.5 h-3.5 text-[#C9A227] mr-1.5" />
                          Milestone Execution & Fund Release Milestones
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {prop.milestones?.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                                m.status === "Completed"
                                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                                  : m.status === "In_Progress"
                                  ? "bg-blue-50/70 border-blue-300 text-blue-900"
                                  : m.status === "Delayed"
                                  ? "bg-red-50/70 border-red-300 text-red-900"
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="font-bold">{m.title}</span>
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border">
                                    ₹{m.fundingReleaseAmount?.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                                  {m.description}
                                </p>
                              </div>

                              <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-500">
                                  Due: {new Date(m.dueDate).toLocaleDateString("en-IN")}
                                </span>

                                {/* Status Selector Dropdown */}
                                <select
                                  value={m.status}
                                  onChange={(e) =>
                                    handleUpdateMilestone(prop._id, mIdx, e.target.value)
                                  }
                                  className="text-[11px] font-bold py-1 px-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#1A365D]"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In_Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Delayed">Delayed</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: INSTITUTIONAL PROFILE & SELF-REPORTED CAPABILITIES */}
        {/* ========================================================= */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900">
                Institutional Capabilities & Faculty Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Self-report your institution&apos;s core technical competencies, advanced laboratory equipment, and certified faculty mentors. The state AI engine uses these to match relevant civic challenges.
              </p>
            </div>

            {profileFeedback && (
              <div
                className={`p-3 rounded-md text-xs font-semibold ${
                  profileFeedback.includes("successfully")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {profileFeedback}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Domain Capabilities Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  1. Core Civic Domain Strengths (Capabilities)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {ISSUE_DOMAINS.map((dom) => {
                    const isChecked = editCapabilities.includes(dom);
                    return (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setEditCapabilities(editCapabilities.filter((c) => c !== dom));
                          } else {
                            setEditCapabilities([...editCapabilities, dom]);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-blue-50 border-[#1A365D] text-[#1A365D] font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{dom}</span>
                        {isChecked && <CheckCircle className="w-3.5 h-3.5 text-[#1A365D]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Research Facilities / Labs */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Specialized Facilities & Testing Laboratories
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditFacilities([
                        ...editFacilities,
                        {
                          name: "New Research Lab",
                          description: "Laboratory capability description",
                          relatedDomains: ["Water Resources"],
                        },
                      ])
                    }
                    className="px-2.5 py-1 text-xs font-bold text-[#1A365D] bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                  >
                    + Add Facility
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editFacilities.map((fac, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row gap-3 items-start md:items-center justify-between"
                    >
                      <div className="space-y-1 w-full md:w-2/3">
                        <input
                          type="text"
                          value={fac.name}
                          onChange={(e) => {
                            const copy = [...editFacilities];
                            copy[idx].name = e.target.value;
                            setEditFacilities(copy);
                          }}
                          placeholder="Facility Name (e.g. Water Quality Spectrometry Lab)"
                          className="w-full text-xs font-bold border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                        />
                        <input
                          type="text"
                          value={fac.description || ""}
                          onChange={(e) => {
                            const copy = [...editFacilities];
                            copy[idx].description = e.target.value;
                            setEditFacilities(copy);
                          }}
                          placeholder="Short description of apparatus or test capabilities"
                          className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setEditFacilities(editFacilities.filter((_, i) => i !== idx))
                        }
                        className="text-red-600 hover:text-red-800 text-xs font-semibold p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Roster */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Faculty Mentors & Principal Investigators
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditFaculty([
                        ...editFaculty,
                        {
                          name: "Dr. New Mentor",
                          department: "Engineering Department",
                          specialization: "Applied Research",
                          email: "mentor@bitmesra.ac.in",
                        },
                      ])
                    }
                    className="px-2.5 py-1 text-xs font-bold text-[#1A365D] bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                  >
                    + Add Faculty Member
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editFaculty.map((fac, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center"
                    >
                      <input
                        type="text"
                        value={fac.name}
                        onChange={(e) => {
                          const copy = [...editFaculty];
                          copy[idx].name = e.target.value;
                          setEditFaculty(copy);
                        }}
                        placeholder="Faculty Name"
                        className="text-xs font-bold border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                      />
                      <input
                        type="text"
                        value={fac.department}
                        onChange={(e) => {
                          const copy = [...editFaculty];
                          copy[idx].department = e.target.value;
                          setEditFaculty(copy);
                        }}
                        placeholder="Department"
                        className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                      />
                      <input
                        type="text"
                        value={fac.specialization || ""}
                        onChange={(e) => {
                          const copy = [...editFaculty];
                          copy[idx].specialization = e.target.value;
                          setEditFaculty(copy);
                        }}
                        placeholder="Research Specialization"
                        className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-600"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={fac.email}
                          onChange={(e) => {
                            const copy = [...editFaculty];
                            copy[idx].email = e.target.value;
                            setEditFaculty(copy);
                          }}
                          placeholder="Official Email"
                          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditFaculty(editFaculty.filter((_, i) => i !== idx))
                          }
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Profile Button */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-[#1A365D] hover:bg-[#132845] text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-2"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Capabilities...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                      <span>Save & Update Institutional Capabilities</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SOLUTION PROPOSAL SUBMISSION MODAL */}
        {/* ========================================================= */}
        {claimModalIssue && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-[#1A365D] text-white p-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-amber-300 mb-1">
                    <span>CHALLENGE CLAIM #{claimModalIssue.trackingCode}</span>
                    <span>•</span>
                    <span>{claimModalIssue.district}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg leading-snug">
                    Submit Solution Proposal
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                    Target Issue: {claimModalIssue.title}
                  </p>
                </div>
                <button
                  onClick={() => setClaimModalIssue(null)}
                  className="text-slate-300 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmitProposal} className="p-6 overflow-y-auto space-y-5">
                {formFeedback && (
                  <div
                    className={`p-3 rounded-md text-xs font-semibold ${
                      formFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {formFeedback.msg}
                  </div>
                )}

                {/* Proposal Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Solution Proposal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                  />
                </div>

                {/* Technical Scope */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Technical Scope & Problem Resolution Methodology *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={proposalScope}
                    onChange={(e) => setProposalScope(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#1A365D] leading-relaxed"
                  />
                </div>

                {/* Budget & Faculty Mentor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Budget Requested (₹ INR) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        min="10000"
                        step="5000"
                        required
                        value={proposalBudget}
                        onChange={(e) => setProposalBudget(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Faculty Mentor (PI) *
                    </label>
                    <select
                      value={proposalMentor}
                      onChange={(e) => setProposalMentor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                    >
                      {editFaculty.map((f, i) => (
                        <option key={i} value={f.name}>
                          {f.name} ({f.department})
                        </option>
                      ))}
                      <option value="Dr. Ananya Sen (Civil & Environmental Engg)">
                        Dr. Ananya Sen (Civil & Environmental Engg)
                      </option>
                      <option value="Prof. Rajesh Verma (Computer Science)">
                        Prof. Rajesh Verma (Computer Science)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Team Members Builder */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Student & Researcher Team Members
                    </label>
                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="text-xs font-bold text-[#1A365D] hover:underline"
                    >
                      + Add Member
                    </button>
                  </div>

                  <div className="space-y-2">
                    {teamMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs items-center"
                      >
                        <input
                          type="text"
                          placeholder="Student Name"
                          value={m.name}
                          onChange={(e) => {
                            const copy = [...teamMembers];
                            copy[idx].name = e.target.value;
                            setTeamMembers(copy);
                          }}
                          className="px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Lead Developer)"
                          value={m.role}
                          onChange={(e) => {
                            const copy = [...teamMembers];
                            copy[idx].role = e.target.value;
                            setTeamMembers(copy);
                          }}
                          className="px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            placeholder="Discipline"
                            value={m.discipline}
                            onChange={(e) => {
                              const copy = [...teamMembers];
                              copy[idx].discipline = e.target.value;
                              setTeamMembers(copy);
                            }}
                            className="px-2 py-1 border border-slate-300 rounded bg-white flex-1"
                          />
                          {teamMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTeamMember(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Milestones */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Deliverable Milestones & Fund Allocation
                    </label>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="text-xs font-bold text-[#1A365D] hover:underline"
                    >
                      + Add Milestone
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <input
                            type="text"
                            placeholder="Milestone Title"
                            value={m.title}
                            onChange={(e) => {
                              const copy = [...milestones];
                              copy[idx].title = e.target.value;
                              setMilestones(copy);
                            }}
                            className="font-bold border border-slate-300 rounded px-2 py-1 bg-white w-2/3"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-slate-500 font-semibold">₹</span>
                            <input
                              type="number"
                              placeholder="Tranche"
                              value={m.fundingReleaseAmount}
                              onChange={(e) => {
                                const copy = [...milestones];
                                copy[idx].fundingReleaseAmount = Number(e.target.value);
                                setMilestones(copy);
                              }}
                              className="w-24 font-mono font-bold border border-slate-300 rounded px-2 py-1 bg-white"
                            />
                            {milestones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMilestone(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Milestone description and verification criteria"
                          value={m.description}
                          onChange={(e) => {
                            const copy = [...milestones];
                            copy[idx].description = e.target.value;
                            setMilestones(copy);
                          }}
                          className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-slate-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setClaimModalIssue(null)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="px-6 py-2 bg-[#1A365D] hover:bg-[#132845] text-white text-xs font-bold rounded-md shadow transition-all flex items-center space-x-1.5"
                  >
                    {submittingProposal ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Proposal...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-[#C9A227]" />
                        <span>Submit Solution Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
