"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { JHARKHAND_DISTRICTS, District } from "@/lib/data/districts";
import { animate } from "animejs";

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
 * 3-Stop Color Interpolator:
 * Low (0-35): Green #4A7C59 -> rgb(74, 124, 89)
 * Medium (36-70): Amber #C9A227 -> rgb(201, 162, 39)
 * High (71-100): Deep Red #8B3A3A -> rgb(139, 58, 58)
 */
function getDensityColor(density: number): string {
  const clamped = Math.max(0, Math.min(100, density));

  if (clamped <= 50) {
    const t = clamped / 50;
    // Green (74, 124, 89) to Amber (201, 162, 39)
    const r = Math.round(74 + (201 - 74) * t);
    const g = Math.round(124 + (162 - 124) * t);
    const b = Math.round(89 + (39 - 89) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (clamped - 50) / 50;
    // Amber (201, 162, 39) to Deep Red (139, 58, 58)
    const r = Math.round(201 + (139 - 201) * t);
    const g = Math.round(162 + (58 - 162) * t);
    const b = Math.round(39 + (58 - 39) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

interface TooltipState {
  visible: boolean;
  district: District | null;
  count: number;
  density: number;
  x: number;
  y: number;
}

interface JharkhandMapProps {
  districtData?: Record<string, { count: number; density: number }>;
  onSelectDistrict?: (districtName: string) => void;
}

export default function JharkhandMap({
  districtData: propData,
  onSelectDistrict,
}: JharkhandMapProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [liveData, setLiveData] = useState<Record<string, { count: number; density: number }>>(
    propData || DEFAULT_DISTRICT_STATS
  );

  // Fetch live aggregated summary from backend
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

  // Sort districts in schematic reading order (row first, then col) for smooth staggered load animation
  const sortedDistricts = useMemo(() => {
    return [...JHARKHAND_DISTRICTS].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  }, []);

  // Map Layout Constants
  const BOX_WIDTH = 92;
  const BOX_HEIGHT = 68;
  const GAP_X = 12;
  const GAP_Y = 12;
  const PADDING_LEFT = 20;
  const PADDING_TOP = 20;
  const VIEWBOX_WIDTH = 960;
  const VIEWBOX_HEIGHT = 430;
  const RECT_PERIMETER = 2 * (BOX_WIDTH + BOX_HEIGHT); // ~320px

  // Orchestrated anime.js load animation (played once on mount)
  useEffect(() => {
    if (typeof window === "undefined" || !svgRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const rectElements = svgRef.current.querySelectorAll<SVGRectElement>(".district-outline");
    const fillElements = svgRef.current.querySelectorAll<SVGRectElement>(".district-fill");
    const textElements = svgRef.current.querySelectorAll<SVGTextElement>(".district-label");

    if (prefersReducedMotion) {
      // Instantly set final visible state without transition
      rectElements.forEach((el) => {
        el.style.strokeDashoffset = "0";
      });
      fillElements.forEach((el) => {
        el.style.opacity = "1";
      });
      textElements.forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    // Step 1: Draw in SVG stroke-dashoffset with 30ms stagger
    animate(rectElements, {
      strokeDashoffset: [RECT_PERIMETER, 0],
      duration: 650,
      ease: "easeOutQuad",
      delay: (_el, i) => (i ?? 0) * 30,
    });

    // Step 2: Fade in fill color smoothly right after stroke outline
    animate(fillElements, {
      opacity: [0, 1],
      duration: 500,
      ease: "easeOutQuad",
      delay: (_el, i) => 250 + (i ?? 0) * 30,
    });

    // Step 3: Fade in district text labels
    animate(textElements, {
      opacity: [0, 1],
      duration: 400,
      ease: "easeOutQuad",
      delay: (_el, i) => 350 + (i ?? 0) * 30,
    });
  }, [RECT_PERIMETER]);

  const handleDistrictClick = (districtName: string) => {
    if (onSelectDistrict) {
      onSelectDistrict(districtName);
    } else {
      router.push(`/district/${encodeURIComponent(districtName)}`);
    }
  };

  const handleMouseEnter = (
    e: React.MouseEvent<SVGGElement>,
    district: District
  ) => {
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

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setTooltip((prev) => ({
      ...prev,
      x,
      y,
    }));
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      {/* Map Header & Disclaimer */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-navy inline-block" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-navy">
              Jharkhand District Civic Problem Density
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Schematic administrative grid across all 24 districts (Click any district to view logged issues)
          </p>
        </div>

        {/* 3-Stop Color Legend */}
        <div className="flex items-center space-x-4 text-xs text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-sm">
          <span className="font-medium text-slate-500 text-[11px] uppercase tracking-wider">
            Issue Density:
          </span>
          <div className="flex items-center space-x-1.5">
            <span
              className="w-3 h-3 inline-block rounded-xs"
              style={{ backgroundColor: "#4A7C59" }}
            />
            <span className="text-[11px]">Low (&lt;35)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className="w-3 h-3 inline-block rounded-xs"
              style={{ backgroundColor: "#C9A227" }}
            />
            <span className="text-[11px]">Moderate (35-70)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className="w-3 h-3 inline-block rounded-xs"
              style={{ backgroundColor: "#8B3A3A" }}
            />
            <span className="text-[11px]">High (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* SVG Container with Schematic Grid */}
      <div className="w-full relative bg-slate-50 border border-slate-300 p-2 sm:p-4 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="w-full max-w-[960px] mx-auto block select-none"
          style={{ minWidth: "680px" }}
          aria-label="Schematic Map of Jharkhand Districts"
        >
          {/* Subtle Division Group Labels / Background Grid */}
          <g className="division-indicators" opacity="0.4">
            <text x="35" y="16" fill="#0A2540" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
              WEST (PALAMU)
            </text>
            <text x="320" y="16" fill="#0A2540" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
              NORTH CHOTANAGPUR
            </text>
            <text x="680" y="16" fill="#0A2540" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
              SANTHAL PARGANA
            </text>
            <text x="210" y="420" fill="#0A2540" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
              SOUTH CHOTANAGPUR
            </text>
            <text x="490" y="420" fill="#0A2540" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
              KOLHAN
            </text>
          </g>

          {/* 24 District Rectangles */}
          {sortedDistricts.map((district) => {
            const x = PADDING_LEFT + (district.col - 1) * (BOX_WIDTH + GAP_X);
            const y = PADDING_TOP + (district.row - 1) * (BOX_HEIGHT + GAP_Y);
            const stat = activeData[district.name] || { count: 0, density: 0 };
            const fillColor = getDensityColor(stat.density);

            return (
              <g
                key={district.name}
                id={`district-${district.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="district-node cursor-pointer transition-transform duration-150 ease-out origin-center focus:outline-none"
                style={{
                  transformOrigin: `${x + BOX_WIDTH / 2}px ${y + BOX_HEIGHT / 2}px`,
                }}
                onClick={() => handleDistrictClick(district.name)}
                onMouseEnter={(e) => handleMouseEnter(e, district)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                tabIndex={0}
                role="button"
                aria-label={`${district.name} district, ${stat.count} issues reported`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleDistrictClick(district.name);
                  }
                }}
              >
                {/* Background Fill Rect (Faded in via Anime.js) */}
                <rect
                  className="district-fill"
                  x={x}
                  y={y}
                  width={BOX_WIDTH}
                  height={BOX_HEIGHT}
                  rx="4"
                  ry="4"
                  fill={fillColor}
                  opacity="0"
                />

                {/* Drawn Stroke Outline (Animated via Anime.js stroke-dashoffset) */}
                <rect
                  className="district-outline"
                  x={x}
                  y={y}
                  width={BOX_WIDTH}
                  height={BOX_HEIGHT}
                  rx="4"
                  ry="4"
                  fill="none"
                  stroke="#0A2540"
                  strokeWidth="1.5"
                  strokeDasharray={RECT_PERIMETER}
                  strokeDashoffset={RECT_PERIMETER}
                />

                {/* District Name & Issue Count Labels */}
                <text
                  className="district-label"
                  x={x + BOX_WIDTH / 2}
                  y={y + 28}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                  opacity="0"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {district.name.length > 12 ? (
                    <>
                      <tspan x={x + BOX_WIDTH / 2} dy="-4">
                        {district.name.split(" ")[0]}
                      </tspan>
                      <tspan x={x + BOX_WIDTH / 2} dy="12">
                        {district.name.split(" ").slice(1).join(" ")}
                      </tspan>
                    </>
                  ) : (
                    district.name
                  )}
                </text>

                <text
                  className="district-label"
                  x={x + BOX_WIDTH / 2}
                  y={y + 52}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="500"
                  fontFamily="Inter, sans-serif"
                  opacity="0"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                >
                  {stat.count} issues
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {tooltip.visible && tooltip.district && (
          <div
            className="absolute z-20 pointer-events-none bg-navy text-white text-xs p-2.5 rounded shadow border border-gold/50"
            style={{
              left: `${tooltip.x + 12}px`,
              top: `${tooltip.y + 12}px`,
              transform: "translate(0, 0)",
            }}
          >
            <div className="font-serif font-bold text-gold text-sm">
              {tooltip.district.name}
            </div>
            <div className="text-slate-300 text-[11px] mb-1">
              Division: {tooltip.district.division}
            </div>
            <div className="border-t border-slate-600 pt-1 mt-1 flex justify-between gap-4">
              <span>Logged Issues:</span>
              <span className="font-semibold text-white">{tooltip.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Density Index:</span>
              <span className="font-semibold text-white">{tooltip.density}/100</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full text-left mt-2">
        <p className="text-[11px] text-slate-500 italic">
          * Note: Schematic block representation for state monitoring and issue routing; not a survey-accurate boundary map.
        </p>
      </div>
    </div>
  );
}
