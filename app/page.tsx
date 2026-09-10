"use client";

import React, { useState } from "react";
import Link from "next/link";
import JharkhandMap from "@/components/JharkhandMap";
import CitizenSubmissionWizard from "@/components/CitizenSubmissionWizard";
import { PlusCircle, ShieldCheck, MapPin } from "lucide-react";

export default function Home() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-civic-canvas text-civic-textDark flex flex-col font-sans">
      {/* Top Government Identifier Bar */}
      <div className="bg-civic-primary text-white text-xs py-1.5 px-4 sm:px-8 border-b border-civic-primaryHover flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            Government of Jharkhand
          </span>
          <span className="text-civic-accent">|</span>
          <span className="text-slate-200">
            CivicResolve Citizen Gateway
          </span>
        </div>
        <div className="text-slate-200 text-[11px] hidden md:block">
          State Grievance Resolution &amp; Collaborative Innovation Portal
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-civic-surface border-b border-civic-border py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/" suppressHydrationWarning={true} className="group block">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-civic-textDark tracking-tight block leading-tight">
                CivicResolve
              </span>
              <span className="text-[11px] sm:text-xs text-civic-textMuted block mt-0.5 tracking-normal">
                Government of Jharkhand &middot; Citizen Grievance &amp; Public Action System
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-civic-primary hover:bg-civic-primaryHover text-white text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-civic-accent" />
              Report an Issue
            </button>
            <Link
              href="/register"
              suppressHydrationWarning={true}
              className="inline-flex items-center px-4 py-2 bg-civic-surface text-civic-textDark hover:bg-civic-canvas text-xs font-medium border border-civic-border rounded-lg transition-colors shadow-xs"
            >
              Register
            </Link>
            <Link
              href="/login"
              suppressHydrationWarning={true}
              className="inline-flex items-center px-4 py-2 border border-civic-secondary text-civic-secondary hover:bg-civic-accent/20 text-xs font-medium rounded-lg transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-civic-canvas border-b border-civic-border py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-civic-primaryHover bg-civic-accent/25 border border-civic-accent px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider mb-3 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-civic-primary" />
              <span>State Problem Sourcing &amp; HEI Solution Bridge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-civic-textDark leading-tight mb-2">
              Report a civic problem in your district
            </h1>
            <p className="text-sm sm:text-base text-civic-textMuted leading-relaxed">
              A state platform enabling citizens to log grassroots challenges
              across all 24 districts of Jharkhand for collaborative resolution
              by university research teams and industry partners.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              id="report-issue-hero-btn"
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 bg-civic-primary hover:bg-civic-primaryHover text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-civic-accent" />
              Report an Issue
            </button>
            <a
              href="#heatmap-section"
              className="px-4 py-2.5 bg-civic-surface text-civic-textDark text-sm font-medium border border-civic-border hover:bg-civic-canvas rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MapPin className="w-4 h-4 text-civic-secondary" />
              View District Map
            </a>
          </div>
        </div>
      </section>

      {/* Modal / Embedded Citizen Submission Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-hidden">
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
      <section className="py-8 px-4 sm:px-8 flex-1 bg-civic-canvas">
        <div className="max-w-6xl mx-auto">
          <div
            id="heatmap-section"
            className="border border-civic-border bg-civic-surface p-4 sm:p-6 rounded-xl shadow-xs"
          >
            <JharkhandMap />
          </div>
        </div>
      </section>

      {/* Plain Official Footer */}
      <footer className="bg-civic-surface border-t border-civic-border py-4 px-4 sm:px-8 text-xs text-civic-textMuted mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher &amp; Technical Education,
            Government of Jharkhand.
          </div>
          <div className="text-civic-textMuted">
            CivicResolve Platform &bull; Flutter Enterprise Synchronized
          </div>
        </div>
      </footer>
    </div>
  );
}
