"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
} from "lucide-react";
import { ProposalStanding } from "@/types/civic";

export interface ProposalCardData {
  id: string;
  collegeName: string;
  collegeTier: string;
  facultyLead: {
    name: string;
    specialization: string;
  };
  studentTeamSize: number;
  utilizedLabs: string[];
  estimatedCost: number;
  methodologySummary: string;
  aiEvaluation: {
    feasibilityScore: number;
    resourceMatchScore: number;
    trackRecordScore: number;
    noveltyScore: number;
    compositeScore: number;
    reasoningSummary: string;
  };
  currentStanding?: ProposalStanding;
}

interface HumanPanelDecisionMatrixProps {
  challengeTitle: string;
  proposals: ProposalCardData[];
  onConfirmDetermination: (payload: {
    winnerProposalId: string;
    runnerUp1ProposalId?: string;
    runnerUp2ProposalId?: string;
    panelRemarks: string;
  }) => void;
  isSubmitting?: boolean;
}

export default function HumanPanelDecisionMatrix({
  challengeTitle,
  proposals,
  onConfirmDetermination,
  isSubmitting = false,
}: HumanPanelDecisionMatrixProps) {
  // Automatically select the highest AI composite score as the default recommendation
  const sortedProposals = [...proposals].sort(
    (a, b) => b.aiEvaluation.compositeScore - a.aiEvaluation.compositeScore
  );

  const [winnerId, setWinnerId] = useState<string>(sortedProposals[0]?.id || "");
  const [runnerUp1Id, setRunnerUp1Id] = useState<string>(sortedProposals[1]?.id || "");
  const [runnerUp2Id, setRunnerUp2Id] = useState<string>(sortedProposals[2]?.id || "");
  const [panelRemarks, setPanelRemarks] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFinalize = () => {
    if (!winnerId) {
      setErrorMsg("Please select a Winning Research Organization.");
      return;
    }
    if (winnerId === runnerUp1Id || winnerId === runnerUp2Id || (runnerUp1Id && runnerUp1Id === runnerUp2Id)) {
      setErrorMsg("A college cannot hold multiple standings (Winner and Runner-Up must be distinct).");
      return;
    }
    if (!panelRemarks.trim()) {
      setErrorMsg("Government Nodal & Domain Expert panel remarks are mandatory.");
      return;
    }

    setErrorMsg("");
    onConfirmDetermination({
      winnerProposalId: winnerId,
      runnerUp1ProposalId: runnerUp1Id || undefined,
      runnerUp2ProposalId: runnerUp2Id || undefined,
      panelRemarks,
    });
  };

  return (
    <div className="w-full bg-white border border-slate-300 rounded-sm p-5 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-navy inline-block" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Double-Layer Evaluation System
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-navy mt-0.5">
            AI-Assisted Human Decision Panel Matrix
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Review AI composite pre-scores for &ldquo;{challengeTitle}&rdquo; and finalize the binding award with designated backup runners-up.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy/5 border border-navy/20 px-3 py-1.5 rounded-xs">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold text-navy">
            AI Co-Pilot: {proposals.length} Proposals Scored
          </span>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sortedProposals.map((prop) => {
          const isWinner = winnerId === prop.id;
          const isRunnerUp1 = runnerUp1Id === prop.id;
          const isRunnerUp2 = runnerUp2Id === prop.id;

          return (
            <div
              key={prop.id}
              className={`flex flex-col border rounded-sm p-4 transition-all ${
                isWinner
                  ? "border-2 border-green-700 bg-green-50/40 shadow-xs"
                  : isRunnerUp1
                  ? "border-2 border-blue-700 bg-blue-50/40"
                  : isRunnerUp2
                  ? "border-2 border-amber-700 bg-amber-50/40"
                  : "border-slate-300 bg-white"
              }`}
            >
              {/* Card Header & Tier Badge */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-navy text-white rounded-xs">
                    {prop.collegeTier} Institute
                  </span>
                  <h3 className="font-serif font-bold text-sm text-navy mt-1">
                    {prop.collegeName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-navy">
                    ₹{prop.estimatedCost.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-500">Budget Requested</div>
                </div>
              </div>

              {/* AI Score Breakdown Card */}
              <div className="bg-white border border-slate-200 p-2.5 rounded-xs my-2 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-navy flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    AI Composite Score:
                  </span>
                  <span className="text-sm font-bold text-navy bg-gold/20 px-2 py-0.5 rounded-2xs">
                    {prop.aiEvaluation.compositeScore} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Feasibility:</span>
                    <span className="font-semibold text-slate-800">
                      {prop.aiEvaluation.feasibilityScore}/30
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resource Match:</span>
                    <span className="font-semibold text-slate-800">
                      {prop.aiEvaluation.resourceMatchScore}/30
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Track Record:</span>
                    <span className="font-semibold text-slate-800">
                      {prop.aiEvaluation.trackRecordScore}/20
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tech Novelty:</span>
                    <span className="font-semibold text-slate-800">
                      {prop.aiEvaluation.noveltyScore}/20
                    </span>
                  </div>
                </div>

                <p className="text-[10.5px] italic text-slate-500 pt-1 border-t border-slate-100 line-clamp-2">
                  &ldquo;{prop.aiEvaluation.reasoningSummary}&rdquo;
                </p>
              </div>

              {/* Technical Scope & Team Summary */}
              <div className="text-xs text-slate-700 space-y-1.5 my-2 flex-1">
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  <span className="font-semibold text-slate-800">Methodology: </span>
                  {prop.methodologySummary}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lead: {prop.facultyLead.name} ({prop.studentTeamSize} Students)</span>
                </div>
                {prop.utilizedLabs.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Labs: {prop.utilizedLabs.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Standing Assignment Buttons */}
              <div className="pt-3 border-t border-slate-200 mt-auto space-y-1.5">
                <button
                  type="button"
                  onClick={() => setWinnerId(prop.id)}
                  className={`w-full py-1.5 px-2.5 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 transition-all ${
                    isWinner
                      ? "bg-green-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-green-100 hover:text-green-800 border border-slate-300"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {isWinner ? "Selected: Winning RO" : "Set as Winner"}
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRunnerUp1Id(prop.id)}
                    className={`py-1 px-2 text-[11px] font-semibold rounded-xs border transition-all ${
                      isRunnerUp1
                        ? "bg-blue-700 text-white border-blue-800"
                        : "bg-white text-slate-600 hover:bg-slate-50 border-slate-300"
                    }`}
                  >
                    {isRunnerUp1 ? "✓ Runner-Up #1" : "Runner-Up #1"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRunnerUp2Id(prop.id)}
                    className={`py-1 px-2 text-[11px] font-semibold rounded-xs border transition-all ${
                      isRunnerUp2
                        ? "bg-amber-700 text-white border-amber-800"
                        : "bg-white text-slate-600 hover:bg-slate-50 border-slate-300"
                    }`}
                  >
                    {isRunnerUp2 ? "✓ Runner-Up #2" : "Runner-Up #2"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Human Panel Determination Summary & Submission Form */}
      <div className="bg-slate-50 border border-slate-300 p-4 rounded-sm space-y-3">
        <h4 className="font-serif font-bold text-sm text-navy flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-green-700" />
          Final Human Panel Determination &amp; Rationale
        </h4>

        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 text-xs p-2.5 rounded-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Mandatory Panel Determination Remarks (Nodal Officer &amp; Domain Expert):
          </label>
          <textarea
            value={panelRemarks}
            onChange={(e) => setPanelRemarks(e.target.value)}
            placeholder="Document technical justification for selected Winner and designated Runner-Up order..."
            rows={3}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xs focus:ring-1 focus:ring-navy focus:outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <div className="text-[11px] text-slate-500">
            * In case of lead breach or dropout, custody will automatically cascade to Runner-Up #1.
          </div>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-navy text-gold text-xs font-bold border border-gold hover:bg-navyLight disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-gold" />
            <span>{isSubmitting ? "Finalizing Award..." : "Confirm & Award Custody"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
