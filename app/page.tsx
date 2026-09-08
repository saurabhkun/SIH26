"use client";

import React, { useState } from "react";
import Link from "next/link";
import JharkhandMap from "@/components/JharkhandMap";
import CitizenSubmissionWizard from "@/components/CitizenSubmissionWizard";
import { PlusCircle, ShieldCheck, MapPin } from "lucide-react";

export default function Home() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Government Identifier Bar */}
      <div className="bg-brand-prussian text-white text-xs py-1.5 px-4 sm:px-8 border-b border-brand-peach/40 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            Government of Jharkhand
          </span>
          <span className="text-brand-peach">|</span>
          <span className="text-brand-slate">
            Higher & Technical Education Department
          </span>
        </div>
        <div className="text-brand-slate text-[11px] hidden md:block">
          Smart India Hackathon 2026 &bull; PS ID: 26043
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-[#001422] border-b border-[#294C60]/70 py-3.5 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/" className="group block">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight block leading-tight">
                CivicResolve
              </span>
              <span className="text-[11px] sm:text-xs text-[#ADB6C4] block mt-0.5 tracking-normal">
                Government of Jharkhand &middot; Department of Higher & Technical Education
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-[#FFC49B] text-[#001B2E] text-xs font-bold border border-[#FFC49B] hover:bg-[#FFC49B]/90 transition-colors rounded-xs shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-[#001B2E]" />
              Report an Issue
            </button>
            <Link
              href="/register"
              className="inline-flex items-center px-3.5 py-1.5 bg-[#294C60]/60 text-[#FFEFD3] text-xs font-semibold border border-[#294C60] hover:bg-[#294C60] transition-colors rounded-xs"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-1.5 bg-[#001B2E] text-[#FFEFD3] text-xs font-semibold border border-[#ADB6C4]/40 hover:bg-[#294C60]/40 transition-colors rounded-xs"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#001B2E] border-b border-[#294C60]/60 py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[#FFC49B] bg-[#294C60]/40 border border-[#FFC49B]/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider mb-3 rounded-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFC49B]" />
              <span>State Problem Sourcing & HEI Solution Bridge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-2">
              Report a civic problem in your district
            </h1>
            <p className="text-sm sm:text-base text-[#ADB6C4] leading-relaxed">
              A state platform enabling citizens to log grassroots challenges across all 24 districts of Jharkhand for collaborative resolution by university research teams and industry partners.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              id="report-issue-hero-btn"
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 bg-[#FFC49B] text-[#001B2E] text-sm font-bold border border-[#FFC49B] hover:bg-[#FFC49B]/90 flex items-center justify-center gap-2 shadow-md cursor-pointer rounded-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#001B2E]" />
              Report an Issue
            </button>
            <a
              href="#heatmap-section"
              className="px-4 py-2.5 bg-[#294C60]/40 text-[#FFEFD3] text-sm font-semibold border border-[#294C60] hover:bg-[#294C60] flex items-center justify-center gap-1.5 rounded-xs"
            >
              <MapPin className="w-4 h-4 text-[#FFC49B]" />
              View District Map
            </a>
          </div>
        </div>
      </section>

      {/* Modal / Embedded Citizen Submission Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
          <CitizenSubmissionWizard
            onClose={() => setIsWizardOpen(false)}
            onCancel={() => setIsWizardOpen(false)}
            onSuccess={() => {
              // Keep open on confirmation screen
            }}
          />
        </div>
      )}

      {/* Schematic Map Section */}
      <section className="py-8 px-4 sm:px-8 flex-1 bg-[#001625]">
        <div className="max-w-6xl mx-auto">
          <div id="heatmap-section" className="border border-[#294C60] bg-[#001B2E] p-4 sm:p-6 rounded-xs shadow-lg">
            <JharkhandMap />
          </div>
        </div>
      </section>

      {/* Plain Official Footer */}
      <footer className="bg-[#001422] border-t border-[#294C60]/70 py-4 px-4 sm:px-8 text-xs text-[#ADB6C4] mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.
          </div>
          <div className="text-[#ADB6C4]/80">
            CivicResolve Platform &bull; Public Transparency Portal
          </div>
        </div>
      </footer>
    </div>
  );
}
