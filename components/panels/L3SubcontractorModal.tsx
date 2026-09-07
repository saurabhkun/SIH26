"use client";

import React, { useState } from "react";
import {
  X,
  FlaskConical,
  Truck,
  MapPin,
  Users,
  CheckCircle,
  Search,
  ChevronRight,
} from "lucide-react";
import { L3SubcontractDetail } from "@/types/civic";

export interface L3CollegeOption {
  id: string;
  name: string;
  district: string;
  tier: "L3R" | "L3G";
  distanceKm: number;
  availableStudentWorkforce: number;
  facilities: string[];
  reputationScore: number;
  activeSpecializations: string[];
}

interface L3SubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeTitle: string;
  leadCollegeName: string;
  candidates: L3CollegeOption[];
  onAssignSubcontract: (delegation: L3SubcontractDetail) => void;
  isSubmitting?: boolean;
}

export default function L3SubcontractorModal({
  isOpen,
  onClose,
  challengeTitle,
  leadCollegeName,
  candidates,
  onAssignSubcontract,
  isSubmitting = false,
}: L3SubcontractorModalProps) {
  const [activeTab, setActiveTab] = useState<"L3R" | "L3G">("L3R");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxDistance, setMaxDistance] = useState<number>(100); // km
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [stipendAmount, setStipendAmount] = useState<number>(35000);
  const [scopeTasks, setScopeTasks] = useState<string[]>([
    "Ground soil/water sample collection & testing",
    "Field hardware calibration and local citizen survey",
  ]);
  const [newTaskInput, setNewTaskInput] = useState("");

  if (!isOpen) return null;

  const filteredCandidates = candidates.filter((c) => {
    const matchTier = c.tier === activeTab;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.facilities.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDist = c.distanceKm <= maxDistance;
    return matchTier && matchSearch && matchDist;
  });

  const selectedCollege = candidates.find((c) => c.id === selectedCollegeId);

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      setScopeTasks([...scopeTasks, newTaskInput.trim()]);
      setNewTaskInput("");
    }
  };

  const handleRemoveTask = (idx: number) => {
    setScopeTasks(scopeTasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!selectedCollege) return;
    onAssignSubcontract({
      collegeId: selectedCollege.id,
      collegeName: selectedCollege.name,
      type: activeTab,
      scopeOfWork: scopeTasks,
      agreedStipend: stipendAmount,
      distanceKm: selectedCollege.distanceKm,
      status: "PENDING",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-300 rounded-sm shadow-xl flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-navy text-white px-6 py-4 flex justify-between items-start border-b border-gold/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-gold/20 text-gold border border-gold/40 rounded-xs uppercase tracking-wider">
                L1/L2 &rarr; L3 Subcontracting
              </span>
              <span className="text-xs text-slate-300">
                Lead: {leadCollegeName}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-white mt-1">
              Delegate Ground Operations for &ldquo;{challengeTitle}&rdquo;
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: L3R vs L3G */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("L3R");
              setSelectedCollegeId("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "L3R"
                ? "border-navy text-navy bg-white"
                : "border-transparent text-slate-600 hover:text-navy"
            }`}
          >
            <FlaskConical className="w-4 h-4 text-indigo-700" />
            <span>L3R: Regional Research-Capable</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-2xs">
              Labs &amp; Sampling
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("L3G");
              setSelectedCollegeId("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "L3G"
                ? "border-navy text-navy bg-white"
                : "border-transparent text-slate-600 hover:text-navy"
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-700" />
            <span>L3G: Regional Ground Execution</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-2xs">
              Logistics &amp; Survey
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-xs">
            <div className="sm:col-span-2 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by college name, district, or lab facilities..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-xs focus:ring-1 focus:ring-navy focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span className="text-[11px] font-medium whitespace-nowrap">
                Max Distance: <b>{maxDistance} km</b>
              </span>
              <input
                type="range"
                min="10"
                max="250"
                step="10"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-navy"
              />
            </div>
          </div>

          {/* Candidate List & Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {filteredCandidates.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-slate-500 text-xs border border-dashed border-slate-300 rounded-xs">
                No matching {activeTab} institutions found within {maxDistance}km.
              </div>
            ) : (
              filteredCandidates.map((c) => {
                const isSelected = selectedCollegeId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCollegeId(c.id)}
                    className={`cursor-pointer p-3 rounded-xs border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-2 border-navy bg-navy/5 shadow-xs"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif font-bold text-xs text-navy">
                          {c.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-2xs">
                          {c.distanceKm} km away
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>District: {c.district}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Workforce: {c.availableStudentWorkforce} Students</span>
                      </div>
                      {c.facilities.length > 0 && (
                        <div className="text-[10.5px] text-slate-600 mt-1 line-clamp-1">
                          <b>Facilities:</b> {c.facilities.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-emerald-700">
                        Score: {c.reputationScore} / 5.0
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isSelected ? "text-navy" : "text-slate-400"
                        }`}
                      >
                        {isSelected ? "● Selected" : "Click to select"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Scope of Work & Stipend Configuration */}
          {selectedCollege && (
            <div className="bg-slate-50 border border-slate-300 p-4 rounded-xs space-y-3">
              <h4 className="font-serif font-bold text-xs text-navy flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-navy" />
                Subcontract Scope &amp; Budget for {selectedCollege.name}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Agreed Stipend / Ground Budget (₹):
                  </label>
                  <input
                    type="number"
                    value={stipendAmount}
                    onChange={(e) => setStipendAmount(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xs bg-white focus:ring-1 focus:ring-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Add Scope Deliverable / Milestone:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="e.g. Conduct village water sample sensor test"
                      className="w-full text-xs p-2 border border-slate-300 rounded-xs bg-white focus:ring-1 focus:ring-navy focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="px-3 py-1 bg-navy text-white text-xs font-semibold rounded-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Delegated Task List ({scopeTasks.length}):
                </span>
                <ul className="space-y-1">
                  {scopeTasks.map((task, idx) => (
                    <li
                      key={idx}
                      className="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-xs flex justify-between items-center"
                    >
                      <span>{task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-slate-400 hover:text-red-600 text-xs ml-2"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 text-xs font-semibold border border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedCollege || isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-navy text-gold text-xs font-bold border border-gold hover:bg-navyLight disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <span>{isSubmitting ? "Dispatching Agreement..." : "Assign &amp; Dispatch Subcontract"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
