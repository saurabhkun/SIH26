"use client";

import React from "react";
import {
  Radio,
  Clock,
  Sparkles,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { EscalationStage } from "@/types/civic";

interface ContingencyEscalationLadderProps {
  currentStage: EscalationStage;
  targetTiers?: string[];
  biddingDeadline?: Date | string;
  hasSweeteners?: boolean;
  nominatedCollegeName?: string;
  onTriggerEscalation?: (targetStage: EscalationStage) => void;
  isNodalOfficer?: boolean;
}

export default function ContingencyEscalationLadder({
  currentStage,
  targetTiers = ["L1"],
  hasSweeteners = false,
  nominatedCollegeName,
  onTriggerEscalation,
  isNodalOfficer = false,
}: ContingencyEscalationLadderProps) {
  const STAGES = [
    {
      stage: 1 as EscalationStage,
      title: "Stage 1: Tier Broadcast",
      badge: "Targeted Pool",
      icon: Radio,
      desc: "Open bidding targeted to initial eligible tier (e.g. L1 Premier Institutes).",
      activeColor: "border-blue-600 bg-blue-50/70 text-blue-900",
    },
    {
      stage: 2 as EscalationStage,
      title: "Stage 2: Window Evaluation",
      badge: "Deadline Verification",
      icon: Clock,
      desc: "Countdown closes. Verified bid count checked; triggers evaluation if bids > 0.",
      activeColor: "border-indigo-600 bg-indigo-50/70 text-indigo-900",
    },
    {
      stage: 3 as EscalationStage,
      title: "Stage 3: Spectrum Expansion",
      badge: "Sweeteners Active",
      icon: Sparkles,
      desc: "Widened eligibility (L1 + L2) with +15 State Points & Priority CSR Funding tags.",
      activeColor: "border-amber-600 bg-amber-50/70 text-amber-900",
    },
    {
      stage: 4 as EscalationStage,
      title: "Stage 4: Direct Nomination",
      badge: "Consent Loop",
      icon: UserCheck,
      desc: "State Domain Expert directly nominates top matched RO with binding Accept/Decline.",
      activeColor: "border-purple-600 bg-purple-50/70 text-purple-900",
    },
    {
      stage: 5 as EscalationStage,
      title: "Stage 5: Pipeline Egress",
      badge: "Public Works",
      icon: Building2,
      desc: "Exits Academic RO pipeline; transferred to State Public Works Department for civil works.",
      activeColor: "border-red-600 bg-red-50/70 text-red-900",
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-300 rounded-sm p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-navy inline-block" />
            <h3 className="font-serif font-bold text-navy text-base">
              5-Stage Contingency Escalation Ladder
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated challenge lifecycle progression for unclaimed or
            high-urgency state issues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-navy text-gold border border-gold/40 rounded-xs">
            Active: Stage {currentStage}
          </span>
          {hasSweeteners && (
            <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-700" />
              Sweeteners Attached
            </span>
          )}
        </div>
      </div>

      {/* Stepper Progression Track */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const isPassed = currentStage > s.stage;
          const isCurrent = currentStage === s.stage;

          return (
            <div
              key={s.stage}
              className={`relative flex flex-col p-3.5 rounded-xs border transition-all ${
                isCurrent
                  ? `${s.activeColor} border-2 shadow-xs`
                  : isPassed
                    ? "bg-slate-50 border-slate-300 opacity-85"
                    : "bg-white border-slate-200 text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? "bg-navy text-gold"
                      : isPassed
                        ? "bg-green-700 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.stage}
                </div>
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-2xs ${
                    isCurrent
                      ? "bg-white/80 text-navy font-semibold border border-navy/20"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {s.badge}
                </span>
              </div>

              <div className="font-semibold text-xs text-navy flex items-center gap-1 mb-1">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{s.title}</span>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-600 flex-1">
                {s.desc}
              </p>

              {/* Specific Stage Live Metadata */}
              {isCurrent && s.stage === 1 && (
                <div className="mt-2.5 pt-2 border-t border-blue-200 text-[10px] text-blue-900 font-medium">
                  Eligible Tiers: {targetTiers.join(", ")}
                </div>
              )}
              {isCurrent && s.stage === 3 && (
                <div className="mt-2.5 pt-2 border-t border-amber-200 text-[10px] text-amber-900 font-medium">
                  Tiers Widened: L1 + L2 (+15 Pts)
                </div>
              )}
              {isCurrent && s.stage === 4 && nominatedCollegeName && (
                <div className="mt-2.5 pt-2 border-t border-purple-200 text-[10px] text-purple-900 font-medium truncate">
                  Nominee: {nominatedCollegeName}
                </div>
              )}
              {isCurrent && s.stage === 5 && (
                <div className="mt-2.5 pt-2 border-t border-red-200 text-[10px] text-red-900 font-medium">
                  Action: Direct Civil Works Tender
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nodal Officer Override Actions */}
      {isNodalOfficer && currentStage < 5 && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 bg-slate-50 p-2.5 rounded-xs">
          <div className="text-xs text-slate-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Nodal Authority:</span>
            <span>
              Advance challenge to next escalation stage if bidding thresholds
              are breached.
            </span>
          </div>
          {onTriggerEscalation && (
            <button
              onClick={() =>
                onTriggerEscalation((currentStage + 1) as EscalationStage)
              }
              className="px-3 py-1.5 bg-navy text-gold text-xs font-semibold hover:bg-navyLight border border-gold/40 flex items-center gap-1 shadow-2xs"
            >
              <span>Escalate to Stage {currentStage + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
