import React from "react";
import Link from "next/link";
import CitizenSubmissionWizard from "@/components/CitizenSubmissionWizard";
import { ArrowLeft } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Header */}
      <div className="bg-navy text-white text-xs py-1.5 px-4 sm:px-8 border-b border-gold/40 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            Government of Jharkhand
          </span>
          <span className="text-gold">|</span>
          <span className="text-slate-300">
            Citizen Grievance & Challenge Submission
          </span>
        </div>
        <Link href="/" className="text-gold hover:underline text-[11px]">
          &larr; Return to State Map
        </Link>
      </div>

      <header className="bg-white border-b border-slate-300 py-3.5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs text-navy font-semibold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Home
          </Link>
          <span className="text-xs text-slate-500 font-medium">Public Citizen Portal</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <CitizenSubmissionWizard />
      </main>

      <footer className="bg-white border-t border-slate-300 py-4 px-4 sm:px-8 text-xs text-slate-600 mt-auto">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>&copy; 2026 Department of Higher & Technical Education, Government of Jharkhand.</div>
          <div>CivicResolve Platform</div>
        </div>
      </footer>
    </div>
  );
}
