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
      <header className="bg-white border-b border-brand-slate/40 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/" className="group block">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-brand-prussian tracking-tight block leading-tight">
                CivicResolve
              </span>
              <span className="text-[11px] sm:text-xs text-brand-charcoal block mt-0.5 tracking-normal">
                Government of Jharkhand &middot; Department of Higher & Technical Education
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-brand-prussian text-brand-peach text-xs font-semibold border border-brand-peach/60 hover:bg-brand-charcoal transition-colors rounded-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-brand-peach" />
              Report an Issue
            </button>
            <Link
              href="/register"
              className="inline-flex items-center px-3.5 py-1.5 bg-brand-papaya text-brand-prussian text-xs font-semibold border border-brand-peach hover:bg-brand-peach/40 transition-colors rounded-xs"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-brand-prussian text-xs font-semibold border border-brand-slate/50 hover:bg-brand-papaya transition-colors rounded-xs"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-bg border-b border-slate-300 py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-navy bg-navy/5 border border-navy/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-gold" />
              <span>State Problem Sourcing & HEI Solution Bridge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy leading-tight mb-2">
              Report a civic problem in your district
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-normal">
              A state platform enabling citizens to log grassroots challenges across all 24 districts of Jharkhand for collaborative resolution by university research teams and industry partners.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2.5">
            <button
              id="report-issue-hero-btn"
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 bg-navy text-gold text-sm font-bold border border-gold hover:bg-navyLight flex items-center justify-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-gold" />
              Report an Issue
            </button>
            <a
              href="#heatmap-section"
              className="px-4 py-2.5 bg-white text-navy text-sm font-semibold border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-navy" />
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
      <section className="py-8 px-4 sm:px-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div id="heatmap-section" className="border border-slate-300 bg-white p-4 sm:p-6">
            <JharkhandMap />
          </div>
        </div>
      </section>

      {/* Plain Official Footer */}
      <footer className="bg-white border-t border-slate-300 py-4 px-4 sm:px-8 text-xs text-slate-600 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.
          </div>
          <div className="text-slate-500">
            CivicResolve Platform &bull; Public Transparency Portal
          </div>
        </div>
      </footer>
    </div>
  );
}
