/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import HumanPanelDecisionMatrix, {
  ProposalCardData,
} from "@/components/panels/HumanPanelDecisionMatrix";
import ContingencyEscalationLadder from "@/components/panels/ContingencyEscalationLadder";
import { EvidenceMediaViewer } from "@/components/EvidenceMediaViewer";
import { VoiceAudioPlayer } from "@/components/VoiceAudioPlayer";

export default function GovProposalEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params?.id as string;

  const [issue, setIssue] = useState<any>(null);
  const [proposals, setProposals] = useState<ProposalCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!issueId) return;

    // Fetch issue details & proposals
    Promise.all([
      fetch(`/api/issues`).then((r) => r.json()),
      fetch(`/api/proposals`).then((r) => r.json()),
    ])
      .then(([issuesRes, proposalsRes]) => {
        const foundIssue = issuesRes?.data?.find(
          (i: any) => i._id === issueId || i.trackingCode === issueId,
        );
        setIssue(
          foundIssue || {
            title: "Water Heavy Metal Contamination Infiltration",
            district: "Dhanbad",
            escalationStage: 2,
          },
        );

        const rawProposals =
          proposalsRes?.data?.filter(
            (p: any) =>
              p.issueId === issueId || p.issue === issueId || !issueId,
          ) || [];

        if (rawProposals.length > 0) {
          const mapped: ProposalCardData[] = rawProposals.map((p: any) => ({
            id: p._id,
            collegeName:
              p.college?.name ||
              p.collegeName ||
              "Birla Institute of Technology (BIT Mesra)",
            collegeTier: p.college?.tier || "L1",
            facultyLead: {
              name:
                p.facultyMentor ||
                p.facultyLead?.name ||
                "Dr. Rajeshwar Sharma",
              specialization:
                p.facultyLead?.specialization || "Environmental Biotechnology",
            },
            studentTeamSize: p.team?.length || p.studentTeamSize || 5,
            utilizedLabs: [
              "Central Advanced Instrumentation Lab",
              "IoT Water Sensing Cell",
            ],
            estimatedCost: p.budgetRequested || p.estimatedCost || 185000,
            methodologySummary:
              p.technicalScope ||
              p.methodologySummary ||
              "Deploying multi-stage nano-filtration matrices coupled with continuous telemetry sensors.",
            aiEvaluation: p.aiEvaluation || {
              feasibilityScore: 27,
              resourceMatchScore: 28,
              trackRecordScore: 19,
              noveltyScore: 17,
              compositeScore: 91,
              reasoningSummary:
                "Exceptional alignment with regional heavy-metal testing apparatus and verified faculty publication track record in electro-flocculation.",
            },
          }));
          setProposals(mapped);
        } else {
          // Fallback realistic proposal cards for demonstration
          setProposals([
            {
              id: "prop_demo_1",
              collegeName: "Birla Institute of Technology (BIT Mesra)",
              collegeTier: "L1",
              facultyLead: {
                name: "Dr. Rajeshwar Sharma",
                specialization: "Environmental Chemical Engineering",
              },
              studentTeamSize: 6,
              utilizedLabs: [
                "Advanced Spectroscopy Lab",
                "Environmental Chemistry Cell",
              ],
              estimatedCost: 220000,
              methodologySummary:
                "Multi-stage granular activated carbon and magnetic iron-oxide nano-adsorbent filtration system with real-time turbidity telemetry.",
              aiEvaluation: {
                feasibilityScore: 28,
                resourceMatchScore: 29,
                trackRecordScore: 19,
                noveltyScore: 18,
                compositeScore: 94,
                reasoningSummary:
                  "Top scoring candidate: Existing lab equipment directly matched to water heavy metal remediation; 98% past on-time milestone delivery.",
              },
            },
            {
              id: "prop_demo_2",
              collegeName: "National Institute of Technology (NIT Jamshedpur)",
              collegeTier: "L1",
              facultyLead: {
                name: "Dr. Ananya Sen",
                specialization: "IoT Embedded Systems & Sensors",
              },
              studentTeamSize: 4,
              utilizedLabs: ["Micro-Sensors & Telemetry Lab"],
              estimatedCost: 195000,
              methodologySummary:
                "Solar-powered IoT sensor telemetry nodes for real-time pH and mineral anomaly alerts across 12 monitoring borewells.",
              aiEvaluation: {
                feasibilityScore: 26,
                resourceMatchScore: 25,
                trackRecordScore: 18,
                noveltyScore: 19,
                compositeScore: 88,
                reasoningSummary:
                  "Strong telemetry architecture; slightly lower chemical filtration capability compared to BIT Mesra.",
              },
            },
            {
              id: "prop_demo_3",
              collegeName: "Birsa Institute of Technology (BIT Sindri)",
              collegeTier: "L2",
              facultyLead: {
                name: "Prof. Alok Verma",
                specialization: "Hydrology & Chemical Technology",
              },
              studentTeamSize: 5,
              utilizedLabs: ["Regional Water Quality Cell"],
              estimatedCost: 160000,
              methodologySummary:
                "Low-cost vernacular clay-sand bio-sand filtration columns tailored for rapid rural village deployment.",
              aiEvaluation: {
                feasibilityScore: 24,
                resourceMatchScore: 24,
                trackRecordScore: 16,
                noveltyScore: 15,
                compositeScore: 79,
                reasoningSummary:
                  "High cost efficiency and localized deployment potential; lower technological novelty score.",
              },
            },
          ]);
        }
      })
      .finally(() => setIsLoading(false));
  }, [issueId]);

  const handleFinalizeDetermination = async (payload: {
    winnerProposalId: string;
    runnerUp1ProposalId?: string;
    runnerUp2ProposalId?: string;
    panelRemarks: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/proposals/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue?._id || issueId,
          ...payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner(
          data.message || "Stage 2 Human Determination finalized successfully!",
        );
        setTimeout(() => {
          router.push("/dashboard/gov");
        }, 3000);
      } else {
        alert(data.error || "Failed to record panel determination.");
      }
    } catch (err: any) {
      alert("Network failure: " + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-slate-900 pb-20">
      {/* Top Header */}
      <header className="bg-[#001B2E] text-white border-b border-[#294C60] px-6 py-4 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-[#FFC49B]">
              Government of Jharkhand &bull; Nodal Officer Determination Desk
            </span>
            <h1 className="text-xl font-serif font-bold text-[#FFEFD3] leading-tight">
              Bidding Window Stage 2: Multi-Criteria Panel Review
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300 font-mono">
              Challenge ID: <strong>{issue?.trackingCode || issueId}</strong>
            </span>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              State High-Level Evaluation Committee
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <Link
            href="/dashboard/gov"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#294C60] hover:text-[#001B2E] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Government Nodal Dashboard</span>
          </Link>
          <span className="text-xs text-slate-500 font-medium">
            Smart India Hackathon 2026 &bull; PS ID: 26043
          </span>
        </div>

        {/* Success Alert */}
        {successBanner && (
          <div className="bg-green-50 border-2 border-green-700 text-green-900 p-4 rounded-sm flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0" />
            <div className="text-xs font-semibold">{successBanner}</div>
          </div>
        )}

        {/* Contingency Escalation Ladder Progress */}
        <ContingencyEscalationLadder
          currentStage={issue?.escalationStage || 2}
          targetTiers={issue?.targetTiers || ["L1"]}
          hasSweeteners={issue?.sweeteners?.priorityFunding}
          isNodalOfficer={true}
        />

        {/* Citizen Sourced Problem Statement & Photo Evidence */}
        <div className="bg-white border border-slate-300 p-5 rounded-sm shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                {issue?.trackingCode || "CR-JH-2026"} &bull;{" "}
                {issue?.domain || "Civic Challenge"} &bull;{" "}
                {issue?.district || "Jharkhand"}
              </span>
              <h2 className="text-base font-serif font-bold text-slate-900 mt-1">
                {issue?.title || "Regional S&T Innovation Challenge"}
              </h2>
            </div>
            <VoiceAudioPlayer
              textToRead={issue?.description || issue?.title}
              audioUrl={issue?.audioUrl}
            />
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Verbatim Citizen Grievance Statement
            </p>
            <p className="text-xs text-slate-700 italic bg-slate-50 p-3 border border-slate-200 leading-relaxed rounded-xs">
              &ldquo;
              {issue?.description ||
                "Heavy toxic run-off and sediment accumulation affecting municipal drinking water reservoirs."}
              &rdquo;
            </p>
            {issue?.citizenName && (
              <p className="text-[11px] text-slate-500 mt-1">
                Reported by:{" "}
                <strong className="text-slate-700">{issue.citizenName}</strong>{" "}
                {issue?.address ? `• ${issue.address}` : ""}
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Citizen Photo Evidence
            </p>
            <EvidenceMediaViewer
              mediaUrls={
                issue?.mediaUrls && issue.mediaUrls.length > 0
                  ? issue.mediaUrls
                  : issue?.attachments?.map((a: any) => a.url) || []
              }
            />
          </div>
        </div>

        {/* Human Panel Shortlist Review & Award Matrix */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 border border-slate-300 bg-white">
            Loading AI candidate scoring and proposal submissions...
          </div>
        ) : (
          <HumanPanelDecisionMatrix
            challengeTitle={issue?.title || "Regional S&T Innovation Challenge"}
            proposals={proposals}
            onConfirmDetermination={handleFinalizeDetermination}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
