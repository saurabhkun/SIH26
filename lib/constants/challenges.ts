import { IssueDomain } from "./domains";

export interface VisualChallengeOption {
  id: string;
  title: string;
  hindiTitle: string;
  iconName:
    | "droplets"
    | "sprout"
    | "pickaxe"
    | "heart-pulse"
    | "graduation-cap"
    | "trees"
    | "baby"
    | "tractor";
  domain: IssueDomain;
  defaultSeverity: number;
  badge: string;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  exampleTitle: string;
}

export const VISUAL_CHALLENGES: VisualChallengeOption[] = [
  {
    id: "water-contamination",
    title: "Water Contamination & Public Health",
    hindiTitle: "जल प्रदूषण एवं जन स्वास्थ्य",
    iconName: "droplets",
    domain: "Water Resources",
    defaultSeverity: 4,
    badge: "High Priority",
    color: "#0284c7",
    borderColor: "#38bdf8",
    bgLight: "#f0f9ff",
    description: "Fluoride/arsenic in drinking water, dry handpumps, pipeline contamination.",
    exampleTitle: "High fluoride / toxic runoff in Panchayat drinking water supply",
  },
  {
    id: "drought-irrigation",
    title: "Drought-Resilient Irrigation Engineering",
    hindiTitle: "सूखा-रोधी सिंचाई इंजीनियरिंग",
    iconName: "sprout",
    domain: "Agriculture",
    defaultSeverity: 3,
    badge: "Agritech",
    color: "#15803d",
    borderColor: "#4ade80",
    bgLight: "#f0fdf4",
    description: "Check dam siltation, broken canal network, dry season crop water shortage.",
    exampleTitle: "Check dam silted and canals broken causing severe irrigation deficit",
  },
  {
    id: "mining-pollution",
    title: "Mining Pollution & Land Reclamation",
    hindiTitle: "खनन प्रदूषण एवं भूमि पुनरुद्धार",
    iconName: "pickaxe",
    domain: "Environment",
    defaultSeverity: 4,
    badge: "Industrial",
    color: "#b45309",
    borderColor: "#fbbf24",
    bgLight: "#fffbeb",
    description: "Coal fly-ash, dust clouds, abandoned mine craters, toxic topsoil runoff.",
    exampleTitle: "Coal dust air pollution & toxic runoff from open-cast mining site",
  },
  {
    id: "healthcare-delivery",
    title: "Last-Mile Healthcare Delivery",
    hindiTitle: "अंतिम छोर तक स्वास्थ्य सेवा",
    iconName: "heart-pulse",
    domain: "Healthcare",
    defaultSeverity: 4,
    badge: "Critical",
    color: "#e11d48",
    borderColor: "#fb7185",
    bgLight: "#fff1f2",
    description: "Lack of cold-chain vaccines, non-functional PHC equipment, ambulance isolation.",
    exampleTitle: "Primary Health Centre (PHC) lacks emergency medicines and cold storage",
  },
  {
    id: "school-infrastructure",
    title: "School Infrastructure & Learning Continuity",
    hindiTitle: "स्कूल बुनियादी ढांचा एवं शिक्षा",
    iconName: "graduation-cap",
    domain: "Education",
    defaultSeverity: 3,
    badge: "Youth",
    color: "#4f46e5",
    borderColor: "#818cf8",
    bgLight: "#eef2ff",
    description: "Unsafe building roof, no electricity, sanitation lack for girl students, lab shortage.",
    exampleTitle: "Dilapidated government school building lacking sanitation and power",
  },
  {
    id: "watershed-forest",
    title: "Watershed & Forest Degradation",
    hindiTitle: "जलसंभर एवं वन क्षरण",
    iconName: "trees",
    domain: "Environment",
    defaultSeverity: 3,
    badge: "Ecological",
    color: "#047857",
    borderColor: "#34d399",
    bgLight: "#ecfdf5",
    description: "Soil erosion, natural stream drying, illegal timber cutting, water table drop.",
    exampleTitle: "Rapid depletion of village groundwater and seasonal stream drying",
  },
  {
    id: "child-malnutrition",
    title: "Child Malnutrition & Stunting",
    hindiTitle: "बाल कुपोषण एवं नाटापन निवारण",
    iconName: "baby",
    domain: "Healthcare",
    defaultSeverity: 4,
    badge: "POSHAN",
    color: "#c026d3",
    borderColor: "#e879f9",
    bgLight: "#fdf4ff",
    description: "Anganwadi ration disruptions, nutritional tracking gaps, severe wasting cases.",
    exampleTitle: "Irregular nutritional ration and severe child stunting in tribal hamlet",
  },
  {
    id: "farmer-livelihoods",
    title: "Livelihood Diversification for Farmers",
    hindiTitle: "किसानों के लिए आजीविका विविधीकरण",
    iconName: "tractor",
    domain: "Rural Livelihoods",
    defaultSeverity: 3,
    badge: "Economic",
    color: "#d97706",
    borderColor: "#fcd34d",
    bgLight: "#fffdf0",
    description: "Lac/tussar silk support, poultry/dairy alternative income, crop failure rescue.",
    exampleTitle: "Drought crop destruction requiring alternative lac/tussar livelihood aid",
  },
];
