"use client";

import React, { useState, useEffect } from "react";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import {
  Coins,
  Search,
  CheckCircle,
  Filter,
  DollarSign,
  Building,
  CreditCard,
  Send,
  Award,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { ISSUE_DOMAINS } from "@/lib/constants/domains";

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
  milestones: Milestone[];
  issue?: {
    _id: string;
    title: string;
    trackingCode: string;
    district: string;
    domain: string;
    severityScore: number;
    citizenName: string;
  };
  college?: {
    _id: string;
    name: string;
    district: string;
    tier: string;
  };
  totalPledged: number;
  totalReleased: number;
  isFullyFunded: boolean;
  fundingGap: number;
  completedUnreleasedMilestonesCount: number;
}

interface PledgeItem {
  _id: string;
  proposal: {
    _id: string;
    title: string;
    budgetRequested: number;
    milestones: Milestone[];
    issue?: {
      title: string;
      trackingCode: string;
      district: string;
      domain: string;
    };
    college?: {
      name: string;
      district: string;
      tier: string;
    };
  };
  organizationName: string;
  contactEmail: string;
  isCSR: boolean;
  amountPledged: number;
  amountReleased: number;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  mentorshipOffered: boolean;
  mentorshipNotes?: string;
  createdAt: string;
}

export default function IndustryDashboardPage({
  initialTab = "curated",
}: {
  initialTab?: "curated" | "portfolio" | "releases";
}) {
  const [activeTab, setActiveTab] = useState<"curated" | "portfolio" | "releases">(initialTab);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [myPledges, setMyPledges] = useState<PledgeItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pledge modal state
  const [pledgeModalProposal, setPledgeModalProposal] = useState<ProposalItem | null>(null);
  const [orgName, setOrgName] = useState("Tata Steel Foundation");
  const [contactEmail, setContactEmail] = useState("csr.head@tatasteel.com");
  const [isCSR, setIsCSR] = useState(true);
  const [pledgeAmount, setPledgeAmount] = useState(150000);
  const [mentorshipNotes, setMentorshipNotes] = useState(
    "Tata Steel technical mentors and metallurgy lab access offered for field prototype validation."
  );

  // Razorpay Checkout Sandbox state
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [activePledgeId, setActivePledgeId] = useState<string | null>(null);
  const [testCardNumber, setTestCardNumber] = useState("4111 1111 1111 1111");
  const [testExpiry, setTestExpiry] = useState("12/28");
  const [testCvv, setTestCvv] = useState("123");
  const [testCardName, setTestCardName] = useState("Tata Steel CSR Escrow");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    paymentId: string;
    orderId: string;
    amount: number;
  } | null>(null);

  // Milestone fund release state
  const [releasingMilestone, setReleasingMilestone] = useState<string | null>(null);
  const [releaseFeedback, setReleaseFeedback] = useState<string | null>(null);

  // Fetch proposals and pledges
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Curated Fundable Proposals
      const resProps = await fetch("/api/proposals/fundable");
      const propsData = await resProps.json();
      if (propsData.success) {
        setProposals(propsData.data || []);
      }

      // 2. My Pledges
      const resPledges = await fetch("/api/pledges");
      const pledgesData = await resPledges.json();
      if (pledgesData.success) {
        setMyPledges(pledgesData.data || []);
      }
    } catch (err) {
      console.error("Failed to load industry dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Pledge Modal
  const handleOpenPledge = (proposal: ProposalItem) => {
    setPledgeModalProposal(proposal);
    setPledgeAmount(proposal.fundingGap > 0 ? proposal.fundingGap : proposal.budgetRequested);
  };

  // Step 1: Initiate Pledge & Open Razorpay Sandbox
  const handleInitiatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeModalProposal) return;

    try {
      // 1. Create Pledge record
      const resPledge = await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: pledgeModalProposal._id,
          organizationName: orgName,
          contactEmail: contactEmail,
          isCSR: isCSR,
          amountPledged: Number(pledgeAmount),
          mentorshipOffered: true,
          mentorshipNotes: mentorshipNotes,
        }),
      });

      const pledgeData = await resPledge.json();
      if (!pledgeData.success) {
        alert(pledgeData.error || "Failed to create pledge.");
        return;
      }

      const createdPledgeId = pledgeData.data._id;
      setActivePledgeId(createdPledgeId);

      // 2. Create Razorpay Sandbox Order
      const resOrder = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledgeId: createdPledgeId,
          amount: Number(pledgeAmount),
        }),
      });

      const orderData = await resOrder.json();
      if (orderData.success) {
        setPledgeModalProposal(null);
        setShowRazorpayModal(true);
      }
    } catch (err) {
      console.error("Initiate pledge error:", err);
    }
  };

  // Step 2: Authorize Sandbox Payment
  const handleAuthorizeSandboxPayment = async () => {
    if (!activePledgeId) return;

    setProcessingPayment(true);
    try {
      const randomPayId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const randomSig = `sig_test_sandbox_${Math.random().toString(36).substring(2, 10)}`;

      const resVerify = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledgeId: activePledgeId,
          razorpayPaymentId: randomPayId,
          razorpaySignature: randomSig,
        }),
      });

      const verifyData = await resVerify.json();
      if (verifyData.success) {
        setPaymentSuccessData({
          paymentId: verifyData.data.razorpayPaymentId,
          orderId: verifyData.data.razorpayOrderId,
          amount: verifyData.data.amountPledged,
        });

        // Reload data
        loadData();
      }
    } catch (err) {
      console.error("Sandbox payment error:", err);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Release Milestone Funds
  const handleReleaseMilestoneFunds = async (pledgeId: string, milestoneIndex: number) => {
    setReleasingMilestone(`${pledgeId}_${milestoneIndex}`);
    setReleaseFeedback(null);

    try {
      const res = await fetch(`/api/pledges/${pledgeId}/release-milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneIndex }),
      });

      const data = await res.json();
      if (data.success) {
        setReleaseFeedback(data.message);
        loadData();
        setTimeout(() => setReleaseFeedback(null), 5000);
      } else {
        setReleaseFeedback(data.error || "Failed to release funds.");
      }
    } catch {
      setReleaseFeedback("Connection error during fund release.");
    } finally {
      setReleasingMilestone(null);
    }
  };

  // Calculations
  const totalCapitalCommitted = myPledges
    .filter((p) => ["Funded", "Milestone_Released", "Completed"].includes(p.status))
    .reduce((sum, p) => sum + (p.amountPledged || 0), 0);

  const totalCapitalDisbursed = myPledges
    .filter((p) => ["Funded", "Milestone_Released", "Completed"].includes(p.status))
    .reduce((sum, p) => sum + (p.amountReleased || 0), 0);

  const activeProjectsSponsored = myPledges.filter((p) =>
    ["Funded", "Milestone_Released"].includes(p.status)
  ).length;

  // Filter curated proposals
  const filteredProposals = proposals.filter((p) => {
    const domainMatch =
      selectedDomain === "all" ||
      (p.issue?.domain && p.issue.domain.toLowerCase() === selectedDomain.toLowerCase());
    const searchMatch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.issue?.district && p.issue.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.college?.name && p.college.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return domainMatch && searchMatch;
  });

  const navItems: NavItem[] = [
    {
      label: "Curated Innovation Feed",
      href: "/dashboard/industry/feed",
      iconName: "search",
      active: activeTab === "curated",
      onClick: () => setActiveTab("curated"),
    },
    {
      label: "My CSR Portfolio",
      href: "/dashboard/industry/portfolio",
      iconName: "coins",
      active: activeTab === "portfolio",
      onClick: () => setActiveTab("portfolio"),
    },
    {
      label: "Milestone Fund Releases",
      href: "/dashboard/industry/escrow",
      iconName: "award",
      active: activeTab === "releases",
      onClick: () => setActiveTab("releases"),
    },
  ];

  return (
    <DashboardShell
      role="industry"
      roleTitle="Industry & CSR Investment Portal"
      userName="Sanjay Chatterjee"
      userEmail="csr.head@tatasteel.com"
      designation="Head of CSR & Sustainability"
      organizationOrCollege="Tata Steel Foundation"
      navItems={navItems}
    >
      <div className="space-y-6">
        {/* Sub-Navigation & Portfolio Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("curated")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "curated"
                  ? "bg-[#1A365D] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Search className="w-4 h-4 inline mr-2 text-[#C9A227]" />
              Curated Innovation Feed ({proposals.length})
            </button>
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "portfolio"
                  ? "bg-[#1A365D] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Coins className="w-4 h-4 inline mr-2 text-[#C9A227]" />
              CSR Portfolio & Pledges ({myPledges.length})
            </button>
            <button
              onClick={() => setActiveTab("releases")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "releases"
                  ? "bg-[#1A365D] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Award className="w-4 h-4 inline mr-2 text-[#C9A227]" />
              Milestone Release Desk
            </button>
          </div>

          {/* CSR KPI Stats */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-900">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Committed Capital
              </span>
              <strong className="text-sm font-serif text-[#1A365D]">
                ₹{totalCapitalCommitted.toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-900">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Disbursed to HEIs
              </span>
              <strong className="text-sm font-serif text-emerald-800">
                ₹{totalCapitalDisbursed.toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900 hidden sm:block">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Active Projects
              </span>
              <strong className="text-sm font-serif text-amber-800">
                {activeProjectsSponsored} Sponsored
              </strong>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CURATED INNOVATION FEED */}
        {/* ========================================================= */}
        {activeTab === "curated" && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search proposals, institutions, districts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-600">Domain:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                >
                  <option value="all">All Domains</option>
                  {ISSUE_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Proposals Grid */}
            {loading ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1A365D] mb-3" />
                <p className="text-sm text-slate-600">Loading curated CSR innovation feed...</p>
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <h3 className="font-bold text-slate-800">No proposals awaiting CSR funding</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Check back as Higher Education Institutions submit technical solution plans.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProposals.map((prop) => (
                  <div
                    key={prop._id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm p-5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Meta header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {prop.issue?.trackingCode || "CR-JH-2026"}
                          </span>
                          <span className="text-[11px] font-semibold text-[#1A365D] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {prop.issue?.domain || "Civic Innovation"}
                          </span>
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            📍 {prop.issue?.district || "Jharkhand"}
                          </span>
                        </div>

                        <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                          ₹{prop.budgetRequested.toLocaleString("en-IN")} Required
                        </span>
                      </div>

                      {/* Title & Institution */}
                      <h3 className="font-serif font-bold text-base text-slate-900 leading-snug mb-1.5">
                        {prop.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#1A365D] mb-3 flex items-center">
                        <Building className="w-3.5 h-3.5 mr-1 text-[#C9A227]" />
                        {prop.college?.name || "Higher Education Institution"} ({prop.college?.tier || "L1"})
                      </p>

                      {/* Technical Scope */}
                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {prop.technicalScope}
                      </p>

                      {/* Milestones Preview */}
                      <div className="mb-4">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Deliverable Milestones ({prop.milestones?.length || 0})
                        </h5>
                        <div className="space-y-1.5">
                          {prop.milestones?.slice(0, 3).map((m, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] flex justify-between items-center text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded"
                            >
                              <span className="truncate max-w-[200px]">{m.title}</span>
                              <span className="font-mono font-bold text-slate-800">
                                ₹{m.fundingReleaseAmount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        <span>Mentor: <strong>{prop.facultyMentor}</strong></span>
                      </div>

                      <button
                        onClick={() => handleOpenPledge(prop)}
                        className="py-2 px-4 bg-[#1A365D] hover:bg-[#132845] text-white rounded-md text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
                      >
                        <Coins className="w-3.5 h-3.5 text-[#C9A227]" />
                        <span>Pledge CSR Funding</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MY CSR PORTFOLIO & PLEDGES */}
        {/* ========================================================= */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900">
                    Corporate Social Responsibility Portfolio
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live capital deployment ledger, test sandbox transaction IDs, and milestone fulfillment records.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Portfolio</span>
                </button>
              </div>

              {myPledges.length === 0 ? (
                <div className="py-12 text-center">
                  <Coins className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <h4 className="font-bold text-slate-700">No CSR Pledges Recorded</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Browse the <strong>Curated Innovation Feed</strong> to allocate CSR capital to high-impact college engineering projects.
                  </p>
                  <button
                    onClick={() => setActiveTab("curated")}
                    className="mt-4 px-4 py-2 bg-[#1A365D] text-white text-xs font-bold rounded-md"
                  >
                    Explore Proposals
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPledges.map((pledge) => (
                    <div
                      key={pledge._id}
                      className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[11px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                              {pledge.proposal?.issue?.trackingCode || "CR-JH-PLEDGE"}
                            </span>
                            <span className="text-xs text-slate-500">
                              📍 {pledge.proposal?.issue?.district} | {pledge.proposal?.issue?.domain}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-base text-slate-900">
                            {pledge.proposal?.title}
                          </h3>
                          <p className="text-xs font-medium text-slate-600">
                            Executing HEI: <strong>{pledge.proposal?.college?.name}</strong>
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Pledged Amount</span>
                            <strong className="text-sm font-mono text-emerald-800">
                              ₹{pledge.amountPledged.toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              pledge.status === "Funded" || pledge.status === "Completed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {pledge.status}
                          </span>
                        </div>
                      </div>

                      {/* Sandbox transaction info */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Razorpay Order ID
                          </span>
                          <span className="font-mono text-slate-800">
                            {pledge.razorpayOrderId || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Payment ID (Sandbox)
                          </span>
                          <span className="font-mono text-emerald-700 font-bold">
                            {pledge.razorpayPaymentId || "Awaiting Payment"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Capital Disbursed
                          </span>
                          <span className="font-mono text-slate-800 font-bold">
                            ₹{(pledge.amountReleased || 0).toLocaleString("en-IN")} of ₹
                            {pledge.amountPledged.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {pledge.mentorshipNotes && (
                        <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded border border-amber-200/50">
                          <strong>Industry Advisory Commitment:</strong> {pledge.mentorshipNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MILESTONE FUND RELEASE DESK */}
        {/* ========================================================= */}
        {activeTab === "releases" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900">
                Milestone Fund Release Desk
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                When an assigned college completes a research or deployment milestone, verify deliverables and authorize the corresponding fund tranche release from your escrow.
              </p>
            </div>

            {releaseFeedback && (
              <div
                className={`p-3 rounded-md text-xs font-semibold ${
                  releaseFeedback.includes("Successfully")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {releaseFeedback}
              </div>
            )}

            {myPledges.filter((p) => p.status === "Funded" || p.status === "Milestone_Released").length === 0 ? (
              <div className="py-12 text-center">
                <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700">No Funded Projects with Active Milestones</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Fund a proposal from the <strong>Curated Innovation Feed</strong> first. When the college research team marks milestones completed, they will appear here for tranche release.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {myPledges
                  .filter((p) => ["Funded", "Milestone_Released", "Completed"].includes(p.status))
                  .map((pledge) => (
                    <div
                      key={pledge._id}
                      className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <div>
                          <h3 className="font-serif font-bold text-base text-slate-900">
                            {pledge.proposal?.title}
                          </h3>
                          <p className="text-xs text-slate-600">
                            Institution: <strong>{pledge.proposal?.college?.name}</strong> | Total Pledge:{" "}
                            <strong>₹{pledge.amountPledged.toLocaleString("en-IN")}</strong> | Released:{" "}
                            <strong className="text-emerald-700">
                              ₹{(pledge.amountReleased || 0).toLocaleString("en-IN")}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Milestones release checklist */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {pledge.proposal?.milestones?.map((m, mIdx) => {
                          const isCompleted = m.status === "Completed";
                          const isReleased = m.fundingReleased;
                          const isReleasePending = isCompleted && !isReleased;

                          return (
                            <div
                              key={mIdx}
                              className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                                isReleased
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                  : isReleasePending
                                  ? "bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300"
                                  : "bg-white border-slate-200 text-slate-600"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold">{m.title}</span>
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border">
                                    ₹{m.fundingReleaseAmount.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                                  {m.description}
                                </p>
                              </div>

                              <div className="border-t border-slate-200/60 pt-2 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span>
                                    College Progress:{" "}
                                    <strong
                                      className={
                                        isCompleted ? "text-emerald-700" : "text-slate-600"
                                      }
                                    >
                                      {m.status}
                                    </strong>
                                  </span>
                                </div>

                                {isReleased ? (
                                  <div className="w-full py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded text-center text-[11px] flex items-center justify-center space-x-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tranche Released</span>
                                  </div>
                                ) : isReleasePending ? (
                                  <button
                                    onClick={() => handleReleaseMilestoneFunds(pledge._id, mIdx)}
                                    disabled={releasingMilestone === `${pledge._id}_${mIdx}`}
                                    className="w-full py-2 bg-[#1A365D] hover:bg-[#132845] text-white font-bold rounded text-[11px] shadow-sm flex items-center justify-center space-x-1.5 transition-all"
                                  >
                                    <Send className="w-3 h-3 text-[#C9A227]" />
                                    <span>
                                      {releasingMilestone === `${pledge._id}_${mIdx}`
                                        ? "Releasing Tranche..."
                                        : `Authorize ₹${m.fundingReleaseAmount.toLocaleString("en-IN")} Release`}
                                    </span>
                                  </button>
                                ) : (
                                  <div className="w-full py-1.5 bg-slate-100 text-slate-400 rounded text-center text-[10px] font-medium">
                                    Awaiting Milestone Completion
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PLEDGE CONFIRMATION MODAL */}
        {/* ========================================================= */}
        {pledgeModalProposal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-[#1A365D] text-white p-5 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase block">
                    Corporate Social Responsibility (CSR) Pledge
                  </span>
                  <h3 className="font-serif font-bold text-lg leading-snug mt-0.5">
                    Pledge Capital to {pledgeModalProposal.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Executing HEI: {pledgeModalProposal.college?.name}
                  </p>
                </div>
                <button
                  onClick={() => setPledgeModalProposal(null)}
                  className="text-slate-300 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInitiatePledge} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Organization / Corporate Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      CSR Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Funding Amount (₹ INR) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        min="10000"
                        step="5000"
                        required
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* CSR 2% Checkbox */}
                <div className="flex items-center space-x-2 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="isCSRCheckbox"
                    checked={isCSR}
                    onChange={(e) => setIsCSR(e.target.checked)}
                    className="rounded border-slate-300 text-[#1A365D] focus:ring-[#1A365D] h-4 w-4"
                  />
                  <label htmlFor="isCSRCheckbox" className="text-xs text-blue-950 font-medium">
                    Allocate under <strong>Statutory Section 135 (2% CSR Mandate)</strong> for R&D &
                    Public Welfare.
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Industry Mentorship & Advisory Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={mentorshipNotes}
                    onChange={(e) => setMentorshipNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-700"
                  />
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setPledgeModalProposal(null)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#1A365D] hover:bg-[#132845] text-white text-xs font-bold rounded-md shadow transition-all flex items-center space-x-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Proceed to Razorpay Sandbox</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RAZORPAY SANDBOX CHECKOUT MODAL */}
        {/* ========================================================= */}
        {showRazorpayModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
              {/* Razorpay Brand Header */}
              <div className="bg-[#0c2340] text-white p-5 border-b border-blue-900">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#3395FF] rounded flex items-center justify-center font-bold text-xs text-white">
                      R
                    </div>
                    <span className="font-bold text-sm tracking-wide">Razorpay Trusted</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded text-[10px] font-bold tracking-wider uppercase">
                    Sandbox Mode
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-xs text-slate-300 block">Total Amount to Lock</span>
                  <h3 className="text-2xl font-bold font-mono text-white">
                    ₹{pledgeAmount.toLocaleString("en-IN")}.00
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Beneficiary: Government of Jharkhand CivicResolve CSR Escrow
                  </p>
                </div>
              </div>

              {/* Sandbox Disclaimer Banner */}
              <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center space-x-2 text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-medium text-[11px]">
                  <strong>Sandbox / Test Payment &mdash; No Real Money</strong>. Use test credentials below.
                </span>
              </div>

              {/* Test Card Form / Confirmation */}
              {paymentSuccessData ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-slate-900">
                      Test Payment Verified!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      CSR funding successfully locked into state escrow.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-left space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment ID:</span>
                      <strong className="text-emerald-700">{paymentSuccessData.paymentId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="text-slate-700">{paymentSuccessData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong>₹{paymentSuccessData.amount.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowRazorpayModal(false);
                      setPaymentSuccessData(null);
                      setActiveTab("portfolio");
                    }}
                    className="w-full py-2.5 bg-[#1A365D] hover:bg-[#132845] text-white text-xs font-bold rounded-lg shadow"
                  >
                    View in CSR Portfolio
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Test Card Number
                      </label>
                      <input
                        type="text"
                        value={testCardNumber}
                        onChange={(e) => setTestCardNumber(e.target.value)}
                        className="w-full font-mono text-xs px-3 py-2 border border-slate-300 rounded bg-slate-50 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={testExpiry}
                          onChange={(e) => setTestExpiry(e.target.value)}
                          className="w-full font-mono text-xs px-3 py-2 border border-slate-300 rounded bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          value={testCvv}
                          onChange={(e) => setTestCvv(e.target.value)}
                          className="w-full font-mono text-xs px-3 py-2 border border-slate-300 rounded bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={testCardName}
                        onChange={(e) => setTestCardName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowRazorpayModal(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAuthorizeSandboxPayment}
                      disabled={processingPayment}
                      className="px-5 py-2.5 bg-[#3395FF] hover:bg-[#2080ea] text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
                    >
                      {processingPayment ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing Simulation...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Authorize Test ₹{pledgeAmount.toLocaleString("en-IN")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
