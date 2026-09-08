"use client";

import React, { useState } from "react";
import { Image as ImageIcon, ExternalLink, X } from "lucide-react";
import { sanitizeMediaUrl } from "@/lib/constants/civicMedia";

interface MediaProps {
  mediaUrls?: string[];
  domain?: string;
  className?: string;
}

const FALLBACK_EVIDENCE_IMAGE =
  "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80";

export const EvidenceMediaViewer: React.FC<MediaProps> = ({
  mediaUrls = [],
  domain,
  className = "",
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Filter and sanitize URLs
  const validUrls = (mediaUrls || [])
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .map((u, idx) => sanitizeMediaUrl(u, domain, idx));

  if (validUrls.length === 0) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-slate-400 italic py-1 ${className}`}>
        <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> No citizen field photos attached
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-thin">
        {validUrls.map((url, idx) => (
          <div
            key={idx}
            onClick={() => setActiveImage(url)}
            className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shrink-0 bg-slate-100 hover:border-civic-primary transition shadow-xs"
            title="Click to enlarge citizen evidence photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Evidence ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_EVIDENCE_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <ExternalLink className="w-4 h-4 text-white drop-shadow-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-xl overflow-hidden p-2 shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition cursor-pointer shadow-md"
              title="Close enlarged image"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt="Enlarged Ground Evidence"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_EVIDENCE_IMAGE;
                }}
              />
              <div className="w-full pt-2 px-2 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Citizen Field Photo Evidence</span>
                <a
                  href={activeImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-civic-primary hover:text-civic-primaryHover hover:underline flex items-center gap-1 font-medium"
                >
                  Open full source <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceMediaViewer;
