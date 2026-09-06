import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import jharkhandGeoJson from "@/lib/data/jharkhand-districts.json";
import { JHARKHAND_DISTRICTS, District } from "@/lib/data/districts";

export interface DistrictGeoPath {
  name: string;
  division?: string;
  d: string;
  centroid: [number, number];
  labelOffset?: [number, number];
  fontSize?: number;
}

export interface MapGeoConfig {
  width: number;
  height: number;
  districts: DistrictGeoPath[];
}

export const MAP_VIEWBOX_WIDTH = 880;
export const MAP_VIEWBOX_HEIGHT = 600;

// Specific label tweaks for dense/small districts to ensure zero overlap and crystal-clear legibility
const LABEL_TWEAKS: Record<string, { offset?: [number, number]; fontSize?: number; label?: string }> = {
  Ramgarh: { offset: [0, 2], fontSize: 10 },
  Lohardaga: { offset: [-2, 0], fontSize: 10 },
  Jamtara: { offset: [2, 0], fontSize: 10 },
  Khunti: { offset: [0, 0], fontSize: 10.5 },
  Koderma: { offset: [0, -2], fontSize: 10.5 },
  Bokaro: { offset: [0, 0], fontSize: 10.5 },
  Dhanbad: { offset: [0, 0], fontSize: 10.5 },
  "Seraikela Kharsawan": { offset: [0, 2], fontSize: 9.5, label: "Seraikela" },
  "East Singhbhum": { offset: [0, 0], fontSize: 10 },
  "West Singhbhum": { offset: [0, 0], fontSize: 11 },
};

/**
 * Computes projected SVG path strings and centroids for all 24 Jharkhand districts
 * using D3 geoMercator fitted to the SVG viewport.
 */
export function getJharkhandGeoPaths(
  width = MAP_VIEWBOX_WIDTH,
  height = MAP_VIEWBOX_HEIGHT
): MapGeoConfig {
  const geojson = jharkhandGeoJson as unknown as FeatureCollection<Geometry, { district: string; dt_code?: string }>;

  const projection = geoMercator().fitExtent(
    [
      [35, 35],
      [width - 35, height - 35],
    ],
    geojson
  );

  const pathGenerator = geoPath().projection(projection);

  const districtMap = new Map<string, District>();
  JHARKHAND_DISTRICTS.forEach((d) => districtMap.set(d.name.toLowerCase(), d));

  const districts: DistrictGeoPath[] = geojson.features.map((feature) => {
    const name = feature.properties?.district || "Unknown";
    const d = pathGenerator(feature) || "";
    const [cx, cy] = pathGenerator.centroid(feature);
    const meta = districtMap.get(name.toLowerCase());

    const tweak = LABEL_TWEAKS[name] || {};
    const offset = tweak.offset || [0, 0];

    return {
      name,
      division: meta?.division,
      d,
      centroid: [Math.round(cx + offset[0]), Math.round(cy + offset[1])],
      labelOffset: offset,
      fontSize: tweak.fontSize || 11,
    };
  });

  // Sort geographically from top-left (North-West) to bottom-right (South-East) for natural drawing sequence
  districts.sort((a, b) => {
    const scoreA = a.centroid[1] * 1.5 + a.centroid[0];
    const scoreB = b.centroid[1] * 1.5 + b.centroid[0];
    return scoreA - scoreB;
  });

  return {
    width,
    height,
    districts,
  };
}
