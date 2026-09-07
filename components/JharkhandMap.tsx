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
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  const [liveData, setLiveData] = useState<Record<string, { count: number; density: number }>>(
    propData || DEFAULT_DISTRICT_STATS
  );

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

  // Anime.js v4 Entrance Animation
  useEffect(() => {
    if (typeof window === "undefined" || !svgRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const boundaryPaths = svgRef.current.querySelectorAll<SVGPathElement>(".district-boundary-path");
    const fillPaths = svgRef.current.querySelectorAll<SVGPathElement>(".district-fill-path");
    const textLabels = svgRef.current.querySelectorAll<SVGTextElement>(".district-text-label");

    if (prefersReducedMotion) {
      boundaryPaths.forEach((el) => {
        el.style.strokeDashoffset = "0";
      });
      fillPaths.forEach((el) => {
        el.style.opacity = "0.9";
      });
      textLabels.forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    boundaryPaths.forEach((path) => {
      const len = Math.ceil(path.getTotalLength() || 1200);
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    });

    // 1. Draw in boundaries
    animate(boundaryPaths, {
      strokeDashoffset: 0,
      duration: 650,
      ease: "outQuad",
      delay: stagger(20),
    });

    // 2. Reveal fills
    animate(fillPaths, {
      opacity: [0, 0.92],
      duration: 450,
      ease: "outQuad",
      delay: stagger(20, { start: 200 }),
    });

    // 3. District labels fade in
    animate(textLabels, {
      opacity: [0, 1],
      translateY: [3, 0],
      duration: 350,
      ease: "outQuad",
      delay: stagger(15, { start: 400 }),
    });
  }, []);

  const handleDistrictClick = (districtName: string) => {
    if (onSelectDistrict) {
      onSelectDistrict(districtName);
    } else {
      router.push(`/district/${encodeURIComponent(districtName)}`);
    }
  };

  const handleMouseEnter = (
    e: React.MouseEvent<SVGPathElement | SVGTextElement>,
    district: DistrictGeoPath
  ) => {
    setHoveredDistrict(district.name);
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

    const group = svgRef.current?.querySelector(`#geo-district-${district.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
    if (group) {
      const fillEl = group.querySelector<SVGPathElement>(".district-fill-path");
      if (fillEl) {
        animate(fillEl, {
          opacity: 1,
          scale: 1.015,
          duration: 150,
          ease: "outQuad",
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement | SVGTextElement>) => {
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

  const handleMouseLeave = (district: DistrictGeoPath) => {
    setHoveredDistrict(null);
    setTooltip((prev) => ({ ...prev, visible: false }));

    const group = svgRef.current?.querySelector(`#geo-district-${district.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
    if (group) {
      const fillEl = group.querySelector<SVGPathElement>(".district-fill-path");
      if (fillEl) {
        animate(fillEl, {
          opacity: 0.92,
          scale: 1,
          duration: 180,
          ease: "outQuad",
        });
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      {/* Map Header & Legend (Shown if not in compact mode) */}
      {!compact && (
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-navy inline-block" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-navy">
                Jharkhand District Civic Problem Density
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Geographic choropleth map of all 24 districts (Click any district to view logged issues)
            </p>
          </div>

          {/* 3-Stop Color Legend */}
          <div className="flex items-center space-x-3 text-xs text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-xs">
            <span className="font-medium text-slate-500 text-[11px] uppercase tracking-wider">
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
                style={{ backgroundColor: "#C9A227" }}
              />
              <span className="text-[10.5px]">Mod (35-70)</span>
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
      <div className="w-full relative bg-[#F8FAFC] border border-slate-200 p-2 sm:p-3 rounded-xs overflow-hidden flex justify-center shadow-xs">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${geoConfig.width} ${geoConfig.height}`}
          className="w-full h-auto block select-none max-h-[520px]"
          aria-label="Choropleth Map of Jharkhand Districts"
        >
          {/* Base Layer */}
          <g>
            {geoConfig.districts.map((district) => (
              <path
                key={`bg-${district.name}`}
                d={district.d}
                fill="#E2E8F0"
                stroke="#0A2540"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* 24 District Features: Fills, Boundaries & Labels */}
          {geoConfig.districts.map((district) => {
            const stat = activeData[district.name] || { count: 0, density: 0 };
            const fillColor = getDensityColor(stat.density);
            const isHovered = hoveredDistrict === district.name;
            const [cx, cy] = district.centroid;

            return (
              <g
                key={district.name}
                id={`geo-district-${district.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                className="district-geo-group cursor-pointer focus:outline-none"
                style={{ transformOrigin: `${cx}px ${cy}px` }}
                onClick={() => handleDistrictClick(district.name)}
                tabIndex={0}
                role="button"
                aria-label={`${district.name} district, ${stat.count} issues reported`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleDistrictClick(district.name);
                  }
                }}
              >
                {/* 1. Animated Fill Path */}
                <path
                  className="district-fill-path transition-colors duration-150"
                  d={district.d}
                  fill={fillColor}
                  opacity="0"
                  onMouseEnter={(e) => handleMouseEnter(e, district)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => handleMouseLeave(district)}
                />

                {/* 2. Animated Boundary Stroke Path */}
                <path
                  className="district-boundary-path pointer-events-none"
                  d={district.d}
                  fill="none"
                  stroke={isHovered ? "#B38B21" : "#0A2540"}
                  strokeWidth={isHovered ? "2.2" : "1.1"}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* 3. District Name Label Centered at D3 Centroid */}
                <text
                  className="district-text-label pointer-events-none select-none"
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize={district.fontSize || 10.5}
                  fontWeight="600"
                  fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                  opacity="0"
                  style={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)",
                    letterSpacing: "-0.01em",
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
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {tooltip.visible && tooltip.district && (
          <div
            className="absolute z-20 pointer-events-none bg-navy text-white text-xs p-2.5 rounded-xs shadow-md border border-gold/50"
            style={{
              left: `${tooltip.x + 14}px`,
              top: `${tooltip.y + 14}px`,
              transform: "translate(0, 0)",
            }}
          >
            <div className="font-serif font-bold text-gold text-sm">
              {tooltip.district.name}
            </div>
            {tooltip.district.division && (
              <div className="text-slate-300 text-[11px] mb-1">
                Division: {tooltip.district.division}
              </div>
            )}
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

      {/* Map Data Attribution & Note */}
      {!compact && (
        <div className="w-full text-left mt-2 flex flex-col sm:flex-row justify-between text-[11px] text-slate-500">
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
