"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { animate, stagger } from "animejs";
import { getJharkhandGeoPaths, DistrictGeoPath, MAP_VIEWBOX_WIDTH, MAP_VIEWBOX_HEIGHT } from "@/lib/geo";

// Mock issue density data (0 - 100) and reported issue counts for 24 Jharkhand districts
export const DEFAULT_DISTRICT_STATS: Record<string, { count: number; density: number }> = {
  Ranchi: { count: 142, density: 88 },
  Dhanbad: { count: 118, density: 82 },
  "East Singhbhum": { count: 96, density: 76 },
  Bokaro: { count: 84, density: 68 },
  Hazaribagh: { count: 73, density: 62 },
  Deoghar: { count: 67, density: 58 },
  Giridih: { count: 64, density: 55 },
  Palamu: { count: 58, density: 51 },
  Garhwa: { count: 47, density: 44 },
  Latehar: { count: 41, density: 39 },
  Ramgarh: { count: 38, density: 36 },
  Dumka: { count: 35, density: 34 },
  Godda: { count: 32, density: 31 },
  Sahibganj: { count: 29, density: 29 },
  "Seraikela Kharsawan": { count: 28, density: 27 },
  Khunti: { count: 26, density: 25 },
  Lohardaga: { count: 23, density: 23 },
  "West Singhbhum": { count: 22, density: 21 },
  Gumla: { count: 19, density: 19 },
  Pakur: { count: 18, density: 18 },
  Jamtara: { count: 16, density: 16 },
  Koderma: { count: 15, density: 15 },
  Chatra: { count: 14, density: 13 },
  Simdega: { count: 11, density: 11 },
};

/**
 * 3-Stop Color Scale for District Civic Issue Density:
 * Low (0-35): Green #4A7C59 -> rgb(74, 124, 89)
 * Medium (36-70): Amber Gold #C9A227 -> rgb(201, 162, 39)
 * High (71-100): Deep Red #8B3A3A -> rgb(139, 58, 58)
 */
function getDensityColor(density: number): string {
  const clamped = Math.max(0, Math.min(100, density));

  if (clamped <= 50) {
    const t = clamped / 50;
    const r = Math.round(74 + (201 - 74) * t);
    const g = Math.round(124 + (162 - 124) * t);
    const b = Math.round(89 + (39 - 89) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (clamped - 50) / 50;
    const r = Math.round(201 + (139 - 201) * t);
    const g = Math.round(162 + (58 - 162) * t);
    const b = Math.round(39 + (58 - 39) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

interface TooltipState {
  visible: boolean;
  district: DistrictGeoPath | null;
  count: number;
  density: number;
  x: number;
  y: number;
}

interface JharkhandMapProps {
  districtData?: Record<string, { count: number; density: number }>;
  onSelectDistrict?: (districtName: string) => void;
  compact?: boolean;
}

export default function JharkhandMap({
  districtData: propData,
  onSelectDistrict,
  compact = false,
}: JharkhandMapProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const [liveData, setLiveData] = useState<Record<string, { count: number; density: number }>>(
    propData || DEFAULT_DISTRICT_STATS
  );

  // Warm up the Next.js route cache for all 24 districts in the background
  useEffect(() => {
    const districts = [
      "Garhwa", "Palamu", "Chatra", "Hazaribagh", "Koderma", "Giridih",
      "Deoghar", "Dumka", "Godda", "Sahibganj", "Pakur", "Jamtara",
      "Dhanbad", "Bokaro", "Ramgarh", "Ranchi", "Lohardaga", "Latehar",
      "Gumla", "Simdega", "Khunti", "West Singhbhum", "Saraikela Kharsawan", "East Singhbhum",
      "Seraikela Kharsawan",
    ];
    districts.forEach((district) => {
      router.prefetch(`/district/${encodeURIComponent(district.toLowerCase())}`);
      router.prefetch(`/district/${encodeURIComponent(district)}`);
    });
  }, [router]);

  // Compute D3 geographic projections once (memoized)
  const geoConfig = useMemo(() => {
    return getJharkhandGeoPaths(MAP_VIEWBOX_WIDTH, MAP_VIEWBOX_HEIGHT);
  }, []);

  // Fetch live aggregated summary from backend /api/districts/summary
  useEffect(() => {
    if (propData) return;

    let isMounted = true;
    fetch("/api/districts/summary")
      .then((res) => res.json())
      .then((result) => {
        if (isMounted && result.success && result.data) {
          const mapped: Record<string, { count: number; density: number }> = {};
          Object.keys(result.data).forEach((name) => {
            mapped[name] = {
              count: result.data[name].totalIssues,
              density: result.data[name].density,
            };
          });
          setLiveData(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch live district summary, using defaults:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [propData]);

  const activeData = propData || liveData;

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    district: null,
    count: 0,
    density: 0,
    x: 0,
    y: 0,
  });

  // Entrance animation runs only once on initial mount
  useEffect(() => {
    if (typeof window === "undefined" || !svgRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const districtPaths = svgRef.current.querySelectorAll<SVGPathElement>(".district-path");
    const textLabels = svgRef.current.querySelectorAll<SVGTextElement>(".district-text-label");

    if (prefersReducedMotion) {
      districtPaths.forEach((el) => {
        el.style.opacity = "1";
      });
      textLabels.forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    animate(districtPaths, {
      opacity: [0, 1],
      duration: 400,
      ease: "outQuad",
      delay: stagger(15),
    });

    animate(textLabels, {
      opacity: [0, 1],
      duration: 350,
      ease: "outQuad",
      delay: stagger(12, { start: 180 }),
    });
  }, []);

  const handleDistrictClick = (districtName: string) => {
    setIsNavigating(true);
    setSelectedDistrict(districtName);
    if (onSelectDistrict) {
      onSelectDistrict(districtName);
    } else {
      router.push(`/district/${encodeURIComponent(districtName.toLowerCase())}`);
    }
  };

  const handleMouseEnter = (
    e: React.MouseEvent<SVGPathElement>,
    district: DistrictGeoPath
  ) => {
    // Bring hovered path element to top of SVG render stack to prevent border clipping
    if (e.currentTarget && e.currentTarget.parentNode) {
      e.currentTarget.parentNode.appendChild(e.currentTarget);
    }

    const stat = activeData[district.name] || { count: 0, density: 0 };
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setTooltip({
      visible: true,
      district,
      count: stat.count,
      density: stat.density,
      x,
      y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setTooltip((prev) => (prev.visible ? { ...prev, x, y } : prev));
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      {/* Map Header & Legend (Shown if not in compact mode) */}
      {!compact && (
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-civic-border">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-civic-primary inline-block" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-civic-textDark">
                Jharkhand District Civic Problem Density
              </h2>
            </div>
            <p className="text-xs text-civic-textMuted mt-0.5">
              Geographic choropleth map of all 24 districts (Click any district to view logged issues)
            </p>
          </div>

          {/* 3-Stop Color Legend */}
          <div className="flex items-center space-x-3 text-xs text-civic-textDark bg-civic-canvas/70 border border-civic-border px-3 py-1.5 rounded-lg shadow-xs">
            <span className="font-semibold text-civic-textMuted text-[11px] uppercase tracking-wider">
              Density:
            </span>
            <div className="flex items-center space-x-1">
              <span
                className="w-2.5 h-2.5 inline-block rounded-xs"
                style={{ backgroundColor: "#4A7C59" }}
              />
              <span className="text-[10.5px]">Low (&lt;35)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span
                className="w-2.5 h-2.5 inline-block rounded-xs"
                style={{ backgroundColor: "#6096BA" }}
              />
              <span className="text-[10.5px] text-civic-primary font-medium">Mod (35-70)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span
                className="w-2.5 h-2.5 inline-block rounded-xs"
                style={{ backgroundColor: "#8B3A3A" }}
              />
              <span className="text-[10.5px]">High (&gt;70)</span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Geographic Choropleth Map Container */}
      <div className="w-full relative bg-slate-100/60 border border-civic-border p-2 sm:p-3 rounded-xl overflow-hidden flex justify-center shadow-xs">
        {/* Fast Top Loading Bar */}
        {isNavigating && (
          <div className="absolute top-0 left-0 right-0 h-1 z-30 overflow-hidden bg-slate-100 rounded-t-xl">
            <div className="h-full bg-civic-primary animate-pulse w-full transition-all duration-300 origin-left" />
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${geoConfig.width} ${geoConfig.height}`}
          className="w-full h-auto block select-none max-h-[520px]"
          aria-label="Choropleth Map of Jharkhand Districts"
        >
          <defs>
            <style>{`
              .district-path {
                transition: transform 150ms ease, stroke 150ms ease, stroke-width 150ms ease;
                transform-box: fill-box;
                transform-origin: center center;
                will-change: transform;
                cursor: pointer;
              }

              /* ONLY the hovered district changes without affecting siblings */
              .district-path:hover {
                transform: scale(1.02);
                stroke: #274C77 !important;
                stroke-width: 2.2px !important;
                filter: drop-shadow(0 4px 10px rgba(39, 76, 119, 0.25));
              }

              .district-selected {
                stroke: #FFC49B !important;
                stroke-width: 3px !important;
                animation: pulseGlow 1.2s infinite ease-in-out;
              }

              @keyframes pulseGlow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }

              .district-text-label {
                pointer-events: none;
                user-select: none;
              }
            `}</style>
          </defs>

          {/* Base Layer */}
          <g>
            {geoConfig.districts.map((district) => (
              <path
                key={`bg-${district.name}`}
                d={district.d}
                fill="#E2E8F0"
                stroke="#64748B"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* 24 District Features: Paths and Labels */}
          <g id="jharkhand-districts-layer">
            {geoConfig.districts.map((district) => {
              const stat = activeData[district.name] || { count: 0, density: 0 };
              const fillColor = getDensityColor(stat.density);
              const isSelected = selectedDistrict === district.name;

              return (
                <path
                  key={`path-${district.name}`}
                  id={`geo-path-${district.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  className={`district-path focus:outline-none ${isSelected ? "district-selected" : ""}`}
                  d={district.d}
                  fill={fillColor}
                  stroke="#1E293B"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ opacity: 1 }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${district.name} district, ${stat.count} issues reported`}
                  onClick={() => handleDistrictClick(district.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleDistrictClick(district.name);
                    }
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, district)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}
          </g>

          {/* Permanent District Text Labels Layer (Always on top with high contrast) */}
          <g id="jharkhand-labels-layer" className="pointer-events-none">
            {geoConfig.districts.map((district) => {
              const [cx, cy] = district.centroid;

              return (
                <text
                  key={`label-${district.name}`}
                  className="district-text-label"
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize={district.fontSize || 11}
                  fontWeight="600"
                  fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                  style={{
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.85), 0 0 2px rgba(0, 0, 0, 0.9)",
                    letterSpacing: "-0.01em",
                    pointerEvents: "none",
                    opacity: 1,
                  }}
                >
                  {district.name === "Seraikela Kharsawan" ? (
                    <>
                      <tspan x={cx} dy="-5">Seraikela</tspan>
                      <tspan x={cx} dy="10">Kharsawan</tspan>
                    </>
                  ) : district.name === "East Singhbhum" ? (
                    <>
                      <tspan x={cx} dy="-5">East</tspan>
                      <tspan x={cx} dy="10">Singhbhum</tspan>
                    </>
                  ) : district.name === "West Singhbhum" ? (
                    <>
                      <tspan x={cx} dy="-5">West</tspan>
                      <tspan x={cx} dy="10">Singhbhum</tspan>
                    </>
                  ) : (
                    district.name
                  )}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip */}
        {tooltip.visible && tooltip.district && (
          <div
            className="absolute z-20 pointer-events-none bg-civic-primary text-white text-xs p-3 rounded-lg shadow-lg border border-civic-secondary"
            style={{
              left: `${tooltip.x + 14}px`,
              top: `${tooltip.y + 14}px`,
              transform: "translate(0, 0)",
            }}
          >
            <div className="font-serif font-bold text-civic-accent text-sm">
              {tooltip.district.name}
            </div>
            {tooltip.district.division && (
              <div className="text-slate-200 text-[11px] mb-1">
                Division: {tooltip.district.division}
              </div>
            )}
            <div className="border-t border-white/20 pt-1 mt-1 flex justify-between gap-4">
              <span>Logged Issues:</span>
              <span className="font-bold text-white">{tooltip.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Density Index:</span>
              <span className="font-bold text-white">{tooltip.density}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Data Attribution & Note */}
      {!compact && (
        <div className="w-full text-left mt-2 flex flex-col sm:flex-row justify-between text-[11px] text-civic-textMuted">
          <p>
            * Official district boundaries rendered from Survey/Census spatial data (CC BY 4.0).
          </p>
          <p className="italic">
            Click any district for public grievance records &amp; HEI projects
          </p>
        </div>
      )}
    </div>
  );
}

