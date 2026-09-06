"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Sparkles,
  FileText,
  X,
  Check,
} from "lucide-react";
import { JHARKHAND_DISTRICTS } from "@/lib/data/districts";
import { ISSUE_DOMAINS, IssueDomain, FACING_SINCE_OPTIONS, FacingSince } from "@/lib/constants/domains";
import { classifyIssueDescription } from "@/lib/classify";

interface CitizenSubmissionWizardProps {
  onSuccess?: (trackingCode: string, district: string) => void;
  onCancel?: () => void;
  defaultDistrict?: string;
}

interface MockFile {
  name: string;
  size: string;
  type: "photo" | "document" | "video";
}

export default function CitizenSubmissionWizard({
  onSuccess,
  onCancel,
  defaultDistrict = "Ranchi",
}: CitizenSubmissionWizardProps) {
  // Step state (1 = Description & Evidence, 2 = Spatiotemporal, 3 = Identity & Verification, 4 = Success)
  const [step, setStep] = useState<number>(1);

  // Step 1 Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<MockFile[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<IssueDomain>("Water Resources");
  const [selectedSeverity, setSelectedSeverity] = useState<number>(3);
  const [aiSuggestedDomain, setAiSuggestedDomain] = useState<IssueDomain>("Water Resources");
  const [aiSuggestedSeverity, setAiSuggestedSeverity] = useState<number>(3);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isAiOverridden, setIsAiOverridden] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number>(0);

  // Step 2 Form State
  const [district, setDistrict] = useState<string>(defaultDistrict);
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [facingSince, setFacingSince] = useState<FacingSince>("1-6 months");

  // Step 3 Form State
  const [citizenName, setCitizenName] = useState("");
  const [citizenMobile, setCitizenMobile] = useState("");
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Submission & Result State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionResult, setSubmissionResult] = useState<{
    trackingCode: string;
    isDuplicateFlagged: boolean;
    submissionIndexForMobile: number;
    district: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Run AI classification as citizen types description
  useEffect(() => {
    if (description.length >= 10) {
      const res = classifyIssueDescription(description, title);
      setAiSuggestedDomain(res.suggestedDomain);
      setAiSuggestedSeverity(res.suggestedSeverity);
      setAiTags(res.aiTags);
      setAiConfidence(res.confidence);

      if (!isAiOverridden) {
        setSelectedDomain(res.suggestedDomain);
        setSelectedSeverity(res.suggestedSeverity);
      }
    }
  }, [description, title, isAiOverridden]);

  // Handle Mock File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: MockFile[] = Array.from(e.target.files).map((f) => {
        const isDoc = f.name.endsWith(".pdf") || f.name.endsWith(".doc") || f.name.endsWith(".docx");
        const isVid = f.name.endsWith(".mp4") || f.name.endsWith(".mov");
        const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
        return {
          name: f.name,
          size: `${sizeMb} MB`,
          type: isDoc ? "document" : isVid ? "video" : "photo",
        };
      });
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 3: Trigger Mock OTP
  const handleSendOtp = () => {
    if (!citizenMobile || citizenMobile.length < 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpError("");
    const generated = "123456";
    setMockOtp(generated);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp === mockOtp || enteredOtp === "123456") {
      setMobileVerified(true);
      setOtpError("");
    } else {
      setOtpError("Incorrect OTP. Please enter 123456 (Demo Code).");
    }
  };

  // Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileVerified) {
      setSubmitError("Please verify your mobile number with OTP before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        domain: selectedDomain,
        severityScore: selectedSeverity,
        district,
        pincode: pincode.trim(),
        address: address.trim(),
        facingSince,
        citizenName: citizenName.trim(),
        citizenMobile: citizenMobile.trim(),
        aiTags,
        attachments: files.map((f) => ({
          url: `https://storage.civicresolve.gov.in/uploads/${encodeURIComponent(f.name)}`,
          type: f.type,
          filename: f.name,
        })),
      };

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit issue");
      }

      setSubmissionResult({
        trackingCode: data.trackingCode,
        isDuplicateFlagged: data.isDuplicateFlagged,
        submissionIndexForMobile: data.submissionIndexForMobile,
        district,
      });

      setStep(4);
      if (onSuccess) {
        onSuccess(data.trackingCode, district);
      }
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      const msg = err instanceof Error ? err.message : "An error occurred while submitting your challenge.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingCode = () => {
    if (submissionResult?.trackingCode) {
      navigator.clipboard.writeText(submissionResult.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-white border border-slate-300 p-6 max-w-3xl mx-auto rounded-xs">
      {/* Wizard Header */}
      <div className="border-b border-slate-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-navy bg-gold/15 px-2 py-0.5 border border-gold/40 inline-block mb-1">
              Government of Jharkhand &bull; Citizen Grievance Sourcing
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">
              Report a Grassroots Civic Challenge
            </h2>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-700 p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="grid grid-cols-3 gap-2 text-xs mt-4 pt-3 border-t border-slate-200">
            <div
              className={`py-1.5 px-2 border-b-2 font-medium ${
                step === 1
                  ? "border-navy text-navy font-bold"
                  : step > 1
                  ? "border-emerald-700 text-emerald-800"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              1. Evidence & Description
            </div>
            <div
              className={`py-1.5 px-2 border-b-2 font-medium ${
                step === 2
                  ? "border-navy text-navy font-bold"
                  : step > 2
                  ? "border-emerald-700 text-emerald-800"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              2. District & Duration
            </div>
            <div
              className={`py-1.5 px-2 border-b-2 font-medium ${
                step === 3
                  ? "border-navy text-navy font-bold"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              3. Identity & Verification
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: Evidence & Description */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Challenge Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. High Fluoride in Handpumps of Bhandra Panchayat"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              required
            />
          </div>

          {/* Problem Narrative Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-800">
                Detailed Problem Narrative <span className="text-red-600">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  description.length < 20 ? "text-amber-700" : "text-slate-500"
                }`}
              >
                {description.length}/20 min chars
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Describe the problem, affected community size, duration, and attempts made to resolve it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              required
            />
          </div>

          {/* Real-Time AI Suggestion Panel */}
          {description.length >= 10 && (
            <div className="p-3.5 bg-slate-50 border border-slate-300 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-navy font-semibold">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>Automated Technical Domain & Severity Suggestion</span>
                </div>
                {aiConfidence > 0 && (
                  <span className="text-[10.5px] bg-white border border-slate-300 px-1.5 py-0.5 text-slate-600">
                    Confidence: {aiConfidence}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="bg-white p-2.5 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Suggested Domain:</span>
                  <span className="font-semibold text-navy text-sm">{aiSuggestedDomain}</span>
                </div>
                <div className="bg-white p-2.5 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Suggested Severity:</span>
                  <span className="font-semibold text-navy text-sm">
                    Level {aiSuggestedSeverity}/5
                  </span>
                </div>
              </div>

              {/* Edit / Override toggle */}
              <div className="mt-3 pt-2 border-t border-slate-200">
                <label className="inline-flex items-center text-xs text-navy font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAiOverridden}
                    onChange={(e) => setIsAiOverridden(e.target.checked)}
                    className="mr-2 text-navy focus:ring-navy"
                  />
                  <span>Edit or manually override suggested domain / severity</span>
                </label>

                {isAiOverridden && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Select Correct Domain:
                      </label>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value as IssueDomain)}
                        className="w-full text-xs p-1.5 border border-slate-300 bg-white"
                      >
                        {ISSUE_DOMAINS.map((dom) => (
                          <option key={dom} value={dom}>
                            {dom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Select Severity (1 Low &ndash; 5 Critical):
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            type="button"
                            key={lvl}
                            onClick={() => setSelectedSeverity(lvl)}
                            className={`flex-1 py-1 text-xs font-semibold border ${
                              selectedSeverity === lvl
                                ? "bg-navy text-white border-navy"
                                : "bg-white text-slate-700 border-slate-300"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Multi-File Upload Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Upload Supporting Evidence (Photos, Water Quality Tests, Documents)
            </label>
            <div className="border-2 border-dashed border-slate-300 p-4 text-center bg-slate-50/50 hover:bg-slate-50">
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <label className="cursor-pointer text-xs font-semibold text-navy hover:underline block">
                Click to attach files
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, PDF up to 10MB per document
              </p>
            </div>

            {/* Attached files list */}
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-navy flex-shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">({file.type})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-red-700 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={!title.trim() || description.trim().length < 20}
              onClick={() => setStep(2)}
              className="inline-flex items-center px-5 py-2 bg-navy text-gold text-xs font-semibold border border-gold/40 hover:bg-navyLight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: District & Location
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Spatiotemporal Context */}
      {step === 2 && (
        <div className="space-y-5">
          {/* District Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Jharkhand District <span className="text-red-600">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy bg-white"
            >
              {JHARKHAND_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.division} Division)
                </option>
              ))}
            </select>
          </div>

          {/* Pincode & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Pincode
              </label>
              <input
                type="text"
                placeholder="e.g. 835302"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Specific Location / Panchayat / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Bhandra Gram Panchayat, Near Primary School Handpump"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          {/* Duration Pill Selector (Buttons, not dropdown) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              How long has this challenge been affecting your community? <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FACING_SINCE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setFacingSince(opt)}
                  className={`py-2 px-3 text-xs font-medium border text-center transition-colors ${
                    facingSince === opt
                      ? "bg-navy text-gold border-gold/70 font-semibold"
                      : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-xs font-medium border border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center px-5 py-2 bg-navy text-gold text-xs font-semibold border border-gold/40 hover:bg-navyLight"
            >
              Next: Verification
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Identity & Verification */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Citizen Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sushil Oraon"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Mobile Number (10 Digits) <span className="text-red-600">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 text-xs bg-slate-100 border border-r-0 border-slate-300 text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={citizenMobile}
                  onChange={(e) => setCitizenMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>
            </div>
          </div>

          {/* OTP Verification Block */}
          <div className="p-4 bg-slate-50 border border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">
                Citizen Mobile Verification (Anti-Spam OTP)
              </span>
              {mobileVerified ? (
                <span className="inline-flex items-center text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-medium">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={citizenMobile.length < 10}
                  className="text-xs text-navy font-semibold underline hover:text-navyLight disabled:opacity-50 disabled:no-underline"
                >
                  {mockOtp ? "Resend OTP" : "Send OTP"}
                </button>
              )}
            </div>

            {/* Simulation Toast / Banner */}
            {mockOtp && !mobileVerified && (
              <div className="bg-amber-50 border border-amber-300 p-2.5 text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">[DEMO MODE]</span> Verification OTP:{" "}
                  <span className="font-mono font-bold text-sm text-navy">{mockOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(mockOtp)}
                  className="text-[11px] text-navy underline font-medium"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {!mobileVerified && mockOtp && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 w-44 font-mono text-center tracking-widest focus:outline-none focus:border-navy"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="px-4 py-1.5 bg-navy text-gold text-xs font-semibold border border-gold/40 hover:bg-navyLight"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {otpError && <p className="text-xs text-red-600">{otpError}</p>}
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">
              {submitError}
            </div>
          )}

          {/* Submission Actions */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-xs font-medium border border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !citizenName.trim() || !mobileVerified}
              className="inline-flex items-center px-6 py-2 bg-navy text-gold text-xs font-bold border border-gold hover:bg-navyLight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting Challenge..." : "Submit Civic Challenge"}
              <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Confirmation Screen */}
      {step === 4 && submissionResult && (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
            <Check className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-xl font-serif font-bold text-navy">
              Challenge Successfully Registered
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Your civic report has been securely registered on the Government of Jharkhand CivicResolve portal.
            </p>
          </div>

          {/* Tracking Code Prominent Display */}
          <div className="bg-slate-50 border border-slate-300 p-4 max-w-md mx-auto">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
              Official Grievance Tracking Code:
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl font-mono font-bold text-navy tracking-tight">
                {submissionResult.trackingCode}
              </span>
              <button
                type="button"
                onClick={copyTrackingCode}
                className="p-1.5 text-navy hover:bg-slate-200 border border-slate-300 text-xs"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <p className="text-[11px] text-emerald-700 mt-1 font-medium">Tracking code copied to clipboard!</p>}
          </div>

          {/* Deduplication or Review Notice */}
          {submissionResult.isDuplicateFlagged && (
            <div className="bg-amber-50 border border-amber-300 p-3 max-w-md mx-auto text-left text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Similar Community Report Detected</span>
                Your issue has been linked to existing reports in {submissionResult.district} and queued for Nodal Review (Status: Under Review).
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 italic max-w-sm mx-auto">
            Please save this code to track your report progress or view resolution milestones.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-slate-200">
            <Link
              href={`/district/${encodeURIComponent(submissionResult.district)}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-navy text-gold text-xs font-semibold border border-gold/50 hover:bg-navyLight"
            >
              View {submissionResult.district} Dashboard &rarr;
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setTitle("");
                setDescription("");
                setFiles([]);
                setMobileVerified(false);
                setMockOtp(null);
                setEnteredOtp("");
                setSubmissionResult(null);
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-slate-700 text-xs font-medium border border-slate-300 hover:bg-slate-50"
            >
              Report Another Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
