"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplets,
  Sprout,
  Pickaxe,
  HeartPulse,
  GraduationCap,
  Trees,
  Baby,
  Tractor,
  Mic,
  Plus,
  Languages,
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
import {
  ISSUE_DOMAINS,
  IssueDomain,
  FACING_SINCE_OPTIONS,
  FacingSince,
} from "@/lib/constants/domains";
import {
  VISUAL_CHALLENGES,
  VisualChallengeOption,
} from "@/lib/constants/challenges";
import { getContextualMediaUrl } from "@/lib/constants/civicMedia";
import { classifyIssueDescription } from "@/lib/classify";

interface CitizenSubmissionWizardProps {
  onSuccess?: (trackingCode: string, district: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  defaultDistrict?: string;
}

interface MockFile {
  name: string;
  size: string;
  type: "photo" | "document" | "video";
  dataUrl?: string;
}

// Global declaration for Web Speech Recognition API
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export default function CitizenSubmissionWizard({
  onSuccess,
  onCancel,
  onClose,
  defaultDistrict = "Ranchi",
}: CitizenSubmissionWizardProps) {
  const router = useRouter();
  const handleClose = onClose || onCancel;

  // Step state (1 = Challenge Selection & Description, 2 = Spatiotemporal, 3 = Identity & Verification, 4 = Success)
  const [step, setStep] = useState<number>(1);

  // Selected Visual Challenge Option (Defaults to null to force intentional selection)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Step 1 Form State
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<MockFile[]>([]);
  const [selectedDomain, setSelectedDomain] =
    useState<IssueDomain>("Water Resources");
  const [selectedSeverity, setSelectedSeverity] = useState<number>(4);
  const [aiSuggestedDomain, setAiSuggestedDomain] =
    useState<IssueDomain>("Water Resources");
  const [aiSuggestedSeverity, setAiSuggestedSeverity] = useState<number>(3);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isAiOverridden, setIsAiOverridden] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number>(0);

  // Speech to Text States
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

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

  // File input ref for the embedded "+" button
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice speech-to-text is not supported on your browser. Please type directly into the description box or use Google Chrome / Microsoft Edge.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    // Save baseline text before recording starts
    const baseText = description;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let spokenText = "";
        let currentInterim = "";

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          spokenText += transcript + " ";
          if (!item.isFinal) {
            currentInterim += transcript + " ";
          }
        }

        const trimmedSpoken = spokenText.trim();
        if (trimmedSpoken) {
          const combined = baseText
            ? `${baseText.trim()} ${trimmedSpoken}`
            : trimmedSpoken;
          setDescription(combined);

          if (!headline) {
            const firstWords = trimmedSpoken.split(" ").slice(0, 7).join(" ");
            if (firstWords.length > 4) {
              setHeadline(firstWords);
            }
          }
        }

        setInterimTranscript(currentInterim.trim());
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition notice:", err);
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech Recognition Error:", err);
      setIsListening(false);
    }
  };

  // Run AI classification as citizen types or speaks description
  useEffect(() => {
    if (description.length >= 10) {
      const res = classifyIssueDescription(description, headline);
      setAiSuggestedDomain(res.suggestedDomain);
      setAiSuggestedSeverity(res.suggestedSeverity);
      setAiTags(res.aiTags);
      setAiConfidence(res.confidence);

      if (!isAiOverridden && !selectedCategory) {
        setSelectedDomain(res.suggestedDomain);
        setSelectedSeverity(res.suggestedSeverity);
      }
    }
  }, [description, headline, isAiOverridden, selectedCategory]);

  // Handle Category Card Selection (Directly wire category title to headline input)
  const handleCategorySelect = (cat: VisualChallengeOption) => {
    setSelectedCategory(cat.id);
    setSelectedDomain(cat.domain);
    setSelectedSeverity(cat.defaultSeverity);
    // Overwrite headline with the selected category title
    setHeadline(cat.title);
  };

  // Handle File Upload & Convert to Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach((f) => {
        const isDoc =
          f.name.endsWith(".pdf") ||
          f.name.endsWith(".doc") ||
          f.name.endsWith(".docx");
        const isVid = f.name.endsWith(".mp4") || f.name.endsWith(".mov");
        const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
        const fileType: "photo" | "document" | "video" = isDoc
          ? "document"
          : isVid
          ? "video"
          : "photo";

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          setFiles((prev) => [
            ...prev,
            {
              name: f.name,
              size: `${sizeMb} MB`,
              type: fileType,
              dataUrl: base64Url || "",
            },
          ]);
        };
        reader.readAsDataURL(f);
      });
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
      setSubmitError(
        "Please verify your mobile number with OTP before submitting.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const realUserMediaUrls = files
        .filter((f) => f.dataUrl && f.dataUrl.length > 0)
        .map((f) => f.dataUrl as string);

      const payload = {
        title:
          headline.trim() ||
          VISUAL_CHALLENGES.find((c) => c.id === selectedCategory)?.title ||
          "Grassroots Civic Issue",
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
        mediaUrls: realUserMediaUrls,
        attachments: files.map((f, idx) => ({
          url: f.dataUrl || getContextualMediaUrl(selectedDomain, idx),
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

      // Refresh client router to update district pages immediately
      router.refresh();

      setStep(4);
      if (onSuccess) {
        onSuccess(data.trackingCode, district);
      }
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while submitting your challenge.";
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

  // Icon renderer for the 8 challenge categories
  const renderChallengeIcon = (iconName: string, color: string) => {
    const props = {
      className: "w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0",
      style: { color },
    };
    switch (iconName) {
      case "droplets":
        return <Droplets {...props} />;
      case "sprout":
        return <Sprout {...props} />;
      case "pickaxe":
        return <Pickaxe {...props} />;
      case "heart-pulse":
        return <HeartPulse {...props} />;
      case "graduation-cap":
        return <GraduationCap {...props} />;
      case "trees":
        return <Trees {...props} />;
      case "baby":
        return <Baby {...props} />;
      case "tractor":
        return <Tractor {...props} />;
      default:
        return <Droplets {...props} />;
    }
  };

  return (
    <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Pinned Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-civic-textMuted">
            Government of Jharkhand • Grievance Portal
          </span>
          <h2 className="text-xl font-bold text-civic-primary">
            Report a Grassroots Challenge / Grievance
          </h2>
        </div>
        {handleClose && (
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div
              className={`py-1.5 px-2 border-b-2 font-medium flex items-center gap-1.5 ${
                step === 1
                  ? "border-civic-primary text-civic-primary font-bold"
                  : step > 1
                    ? "border-emerald-700 text-emerald-800"
                    : "border-slate-200 text-slate-400"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-civic-accent/30 text-civic-primary inline-flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span className="truncate">1. Problem &amp; Voice / Text</span>
            </div>
            <div
              className={`py-1.5 px-2 border-b-2 font-medium flex items-center gap-1.5 ${
                step === 2
                  ? "border-civic-primary text-civic-primary font-bold"
                  : step > 2
                    ? "border-emerald-700 text-emerald-800"
                    : "border-slate-200 text-slate-400"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-civic-accent/30 text-civic-primary inline-flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <span className="truncate">2. District &amp; Duration</span>
            </div>
            <div
              className={`py-1.5 px-2 border-b-2 font-medium flex items-center gap-1.5 ${
                step === 3
                  ? "border-civic-primary text-civic-primary font-bold"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-civic-accent/30 text-civic-primary inline-flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <span className="truncate">3. Verification &amp; Submit</span>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* STEP 1: Visual Problem Cards & Dual-Mode Description */}
        {step === 1 && (
          <div className="space-y-6">
            {/* SECTION A: 8 1-Tap Visual Problem Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <span>Step 1: Select Main Problem Category</span>
                    <span className="text-red-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Choose the icon that best matches the issue in your village
                    or ward.
                  </p>
                </div>
                <span className="text-[10.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-xs border border-slate-200 hidden sm:inline-block">
                  1-Tap Accessible Selection
                </span>
              </div>

              {/* 8 Visual Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {VISUAL_CHALLENGES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between relative ${
                        isSelected
                          ? "border-[#1E3A8A] bg-blue-50/40 ring-1 ring-[#1E3A8A] shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center text-xs shadow-xs font-bold">
                          ✓
                        </div>
                      )}

                      <div>
                        <div className="flex items-center space-x-2.5 mb-1.5">
                          <div
                            className="p-2 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: cat.bgLight,
                              border: `1px solid ${cat.borderColor}55`,
                            }}
                          >
                            {renderChallengeIcon(cat.iconName, cat.color)}
                          </div>
                          <span
                            className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              color: cat.color,
                              border: `1px solid ${cat.color}33`,
                            }}
                          >
                            {cat.badge}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-navy leading-snug line-clamp-2">
                          {cat.title}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                          {cat.hindiTitle}
                        </div>
                      </div>

                      <div className="text-[10.5px] text-slate-600 mt-2 line-clamp-2 leading-relaxed border-t border-slate-100 pt-1.5">
                        {cat.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION B: Issue Headline / Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Issue Headline / Summary <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Select a category above or type custom headline..."
                className="w-full px-3.5 py-2.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none font-medium transition"
                required
              />
            </div>

            {/* SECTION C: Modern Dual-Mode Description Box (Type or Speak) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <span>Step 2: Describe the Issue (Type or Speak 🎙️)</span>
                  <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Language Switcher for Speech */}
                  <div className="flex items-center space-x-1 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-xs">
                    <Languages className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-500">Language:</span>
                    <button
                      type="button"
                      onClick={() => setSpeechLang("hi-IN")}
                      className={`font-semibold px-1 rounded-xs transition-colors ${
                        speechLang === "hi-IN"
                          ? "text-navy bg-white shadow-xs"
                          : "text-slate-500 hover:text-navy"
                      }`}
                    >
                      हिन्दी
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSpeechLang("en-IN")}
                      className={`font-semibold px-1 rounded-xs transition-colors ${
                        speechLang === "en-IN"
                          ? "text-navy bg-white shadow-xs"
                          : "text-slate-500 hover:text-navy"
                      }`}
                    >
                      English
                    </button>
                  </div>

                  <span
                    className={`text-[11px] font-medium ${
                      description.length < 15
                        ? "text-amber-700"
                        : "text-emerald-700 font-semibold"
                    }`}
                  >
                    {description.length} chars
                  </span>
                </div>
              </div>

              {/* AI / Chat Unified Input Container */}
              <div
                className={`border rounded-xs transition-all duration-150 bg-white ${
                  isListening
                    ? "border-red-500 ring-2 ring-red-100 shadow-md"
                    : "border-slate-300 focus-within:border-navy focus-within:ring-1 focus-within:ring-navy"
                }`}
              >
                {/* Text Area */}
                <textarea
                  id="issue-description"
                  rows={4}
                  placeholder="Describe the problem, affected families, location, or tap the mic 🎙️ below to speak in Hindi or English..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[140px] p-3 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none resize-y"
                  required
                />

                {/* Interim Real-Time Speech Display Banner */}
                {isListening && (
                  <div className="px-3 py-2 bg-red-50/80 border-t border-red-200 flex items-center justify-between text-xs text-red-900 animate-pulse">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <span className="font-semibold">
                        Listening (
                        {speechLang === "hi-IN"
                          ? "बोलिए - हिन्दी"
                          : "Speaking - English"}
                        )...
                      </span>
                      {interimTranscript && (
                        <span className="italic text-slate-700 text-xs truncate max-w-xs sm:max-w-md">
                          &ldquo;{interimTranscript}&rdquo;
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-red-700 font-medium">
                      Tap mic to stop
                    </span>
                  </div>
                )}

                {/* Chat-Style Bottom Action Bar inside the box */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 border-t border-slate-200">
                  {/* Left: [+] Attachment Trigger & Shortcuts */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1 text-xs text-navy font-semibold hover:text-navyLight bg-white border border-slate-300 px-2.5 py-1 rounded-xs hover:bg-slate-50 transition-colors"
                      title="Attach Photo or Document"
                    >
                      <Plus className="w-3.5 h-3.5 text-navy" />
                      <span>Attach Evidence</span>
                      {files.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-navy text-gold text-[10px] font-bold rounded-full">
                          {files.length}
                        </span>
                      )}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                      Photos, PDFs or test reports
                    </span>
                  </div>

                  {/* Right: Speech-to-Text Mic Button */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-150 ease-in-out cursor-pointer shadow-xs ${
                        isListening
                          ? "bg-rose-50 text-rose-600 border-rose-500 animate-pulse"
                          : "bg-white text-[#274C77] border-[#274C77] hover:bg-[#1E3A8A] hover:text-white"
                      }`}
                      title={
                        isListening
                          ? "Stop Recording"
                          : "Speak to Type Description (Speech to Text)"
                      }
                    >
                      <Mic className="w-4 h-4 transition-colors" />
                      <span>
                        {isListening
                          ? "Listening... (सुन रहे हैं)"
                          : "Voice Input (बोलकर लिखें)"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attached files preview chips */}
              {files.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 text-xs rounded-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-navy flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate max-w-[140px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        ({file.size})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-red-700 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real-Time AI Suggestion & Triage Panel */}
            {description.length >= 10 && (
              <div className="p-3.5 bg-slate-50 border border-slate-300 text-xs rounded-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-navy font-semibold">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span>AI Triage & Technical Department Suggestion</span>
                  </div>
                  {aiConfidence > 0 && (
                    <span className="text-[10.5px] bg-white border border-slate-300 px-1.5 py-0.5 text-slate-600 font-medium">
                      Confidence: {aiConfidence}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="bg-white p-2.5 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">
                      AI Detected Department:
                    </span>
                    <span className="font-semibold text-navy text-sm">
                      {aiSuggestedDomain}
                    </span>
                    {isAiOverridden && (
                      <span className="text-[10px] text-amber-700 block font-medium">
                        Overridden to: {selectedDomain}
                      </span>
                    )}
                  </div>
                  <div className="bg-white p-2.5 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">
                      AI Assessed Severity:
                    </span>
                    <span className="font-semibold text-navy text-sm">
                      Level{" "}
                      {isAiOverridden ? selectedSeverity : aiSuggestedSeverity}
                      /5 &bull;{" "}
                      {selectedSeverity >= 4
                        ? "High Priority"
                        : "Standard Review"}
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
                    <span>Manually override department or severity</span>
                  </label>

                  {isAiOverridden && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Select Department:
                        </label>
                        <select
                          value={selectedDomain}
                          onChange={(e) =>
                            setSelectedDomain(e.target.value as IssueDomain)
                          }
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

            {/* Next Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={!selectedCategory || !headline.trim() || description.trim().length < 10}
                onClick={() => {
                  if (isListening) toggleListening();
                  setStep(2);
                }}
                className="px-5 py-2.5 rounded-lg font-semibold text-xs transition-all duration-150 ease-in-out bg-white text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed cursor-pointer shadow-xs inline-flex items-center"
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
                  onChange={(e) =>
                    setPincode(e.target.value.replace(/\D/g, ""))
                  }
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

            {/* Duration Pill Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                How long has this challenge been affecting your community?{" "}
                <span className="text-red-600">*</span>
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
                className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-xs transition-all duration-150 ease-in-out bg-white text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed cursor-pointer shadow-xs"
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
                  Mobile Number (10 Digits){" "}
                  <span className="text-red-600">*</span>
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
                    onChange={(e) =>
                      setCitizenMobile(e.target.value.replace(/\D/g, ""))
                    }
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
                    <span className="font-bold">[DEMO MODE]</span> Verification
                    OTP:{" "}
                    <span className="font-mono font-bold text-sm text-navy">
                      {mockOtp}
                    </span>
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
                    className="px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-150 ease-in-out bg-white text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed cursor-pointer shadow-xs"
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
                className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !citizenName.trim() || !mobileVerified
                }
                className="inline-flex items-center px-6 py-2.5 rounded-lg font-semibold text-xs transition-all duration-150 ease-in-out bg-white text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {isSubmitting
                  ? "Submitting Challenge..."
                  : "Submit Civic Challenge"}
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
                Your civic report has been securely registered on the Government
                of Jharkhand CivicResolve portal.
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
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  Tracking code copied to clipboard!
                </p>
              )}
            </div>

            {/* Deduplication or Review Notice */}
            {submissionResult.isDuplicateFlagged && (
              <div className="bg-amber-50 border border-amber-300 p-3 max-w-md mx-auto text-left text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">
                    Similar Community Report Detected
                  </span>
                  Your issue has been linked to existing reports in{" "}
                  {submissionResult.district} and queued for Nodal Review
                  (Status: Under Review).
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 italic max-w-sm mx-auto">
              Please save this code to track your report progress or view
              resolution milestones.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-slate-200">
              <Link
                href={`/district/${encodeURIComponent(submissionResult.district)}`}
                onClick={() => router.refresh()}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-xs transition-all duration-150 ease-in-out bg-white text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white shadow-xs cursor-pointer"
              >
                View {submissionResult.district} Dashboard &rarr;
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedCategory(null);
                  setHeadline("");
                  setDescription("");
                  setFiles([]);
                  setMobileVerified(false);
                  setMockOtp(null);
                  setEnteredOtp("");
                  setSubmissionResult(null);
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Report Another Challenge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
