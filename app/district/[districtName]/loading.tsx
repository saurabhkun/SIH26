import React from "react";

export default function DistrictLoading() {
  return (
    <div className="min-h-screen bg-[#E7ECEF] p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-72 bg-slate-300 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-white border border-slate-200 rounded-xl" />
    </div>
  );
}
