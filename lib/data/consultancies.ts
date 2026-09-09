export interface ConsultancyFirm {
  id: string;
  name: string;
  shortName: string;
  category: string;
  domainExpertise: string[];
  certifications: string[];
  operatingDistricts: string[];
  headquarters: string;
  contactPOC: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  auditsCompleted: number;
  complianceRating: number;
  turnaroundDays: number;
  description: string;
  specializedEquipment: string[];
}

export const EMPANELLED_CONSULTANCIES: ConsultancyFirm[] = [
  {
    id: "cmpdi-ranchi",
    name: "Central Mine Planning & Design Institute (CMPDI)",
    shortName: "CMPDI",
    category: "Geotechnical & Environmental Audits",
    domainExpertise: [
      "Mining Reclamation",
      "Air Quality Monitoring",
      "Land Subsidence Analysis",
      "Mined-out Area Topography",
    ],
    certifications: [
      "NABET Accredited (Category A)",
      "QCI Certified EIA Consultant",
      "ISO 9001:2015",
      "Coal India Subsidiary",
    ],
    operatingDistricts: [
      "Dhanbad",
      "Bokaro",
      "Ramgarh",
      "Hazaribagh",
      "Ranchi",
      "East Singhbhum",
    ],
    headquarters: "Gondwana Place, Kanke Road, Ranchi, Jharkhand",
    contactPOC: {
      name: "Dr. Alok K. Mishra",
      designation: "Chief General Manager (Environment & Geomatics)",
      phone: "+91 651 2231841",
      email: "env.audit@cmpdi.co.in",
    },
    auditsCompleted: 48,
    complianceRating: 4.9,
    turnaroundDays: 14,
    description:
      "Premier technical consultancy under Ministry of Coal providing third-party environmental impact audits, remote sensing mine reclamation tracking, and continuous ambient air quality telemetry validation.",
    specializedEquipment: [
      "High-Volume Dust Samplers",
      "Differential GPS Topo Scanners",
      "GC-MS Hydrocarbon Analyzers",
      "Sub-surface Seismic Profilers",
    ],
  },
  {
    id: "mecon-limited",
    name: "MECON Limited (A Govt. of India Enterprise)",
    shortName: "MECON Limited",
    category: "Infrastructure & Structural Engineering",
    domainExpertise: [
      "Infrastructure Engineering",
      "Structural Audits",
      "Metallurgical Testing",
      "Industrial Effluent Plant Design",
    ],
    certifications: [
      "Ministry of Steel PSU",
      "QCI/NABET Approved",
      "NABL Accredited Test Center",
      "ISO 14001 Certified",
    ],
    operatingDistricts: [
      "Ranchi",
      "East Singhbhum",
      "Saraikela-Kharsawan",
      "Bokaro",
      "Dhanbad",
      "All 24 Districts",
    ],
    headquarters: "Doranda, Ranchi, Jharkhand 834002",
    contactPOC: {
      name: "Er. Supriyo Banerjee",
      designation: "Executive Director (Civil & Environmental Audits)",
      phone: "+91 651 2483000",
      email: "civil.audit@meconlimited.co.in",
    },
    auditsCompleted: 62,
    complianceRating: 4.95,
    turnaroundDays: 10,
    description:
      "Public sector engineering consultancy specializing in structural stability inspections, bridge load tests, industrial effluent treatment verification, and civic civil infrastructure durability certification.",
    specializedEquipment: [
      "Ultrasonic Pulse Velocity Testers",
      "Rebound Hammer Concrete Analyzers",
      "Heavy Metals Spectrophotometer",
      "Fluid Dynamics Simulation Clusters",
    ],
  },
  {
    id: "neeri-ecolabs",
    name: "NEERI-Empanelled EcoLabs & Assays",
    shortName: "NEERI EcoLabs",
    category: "Water Quality & Hazardous Waste",
    domainExpertise: [
      "Water Contamination Assays",
      "Effluent & Leachate Testing",
      "Heavy Metal Toxicity Profiling",
      "Fluoride & Arsenic Remediation",
    ],
    certifications: [
      "CSIR-NEERI Empanelled",
      "NABL ISO/IEC 17025:2017",
      "CPCB Recognized Lab",
      "JSPCB Approved",
    ],
    operatingDistricts: [
      "Dhanbad",
      "Ranchi",
      "Palamu",
      "Garhwa",
      "Dumka",
      "Giridih",
      "All 24 Districts",
    ],
    headquarters: "Science & Technology Campus, Namkum, Ranchi",
    contactPOC: {
      name: "Dr. Sunita Priyadarshini",
      designation: "Principal Scientific Officer & Quality Head",
      phone: "+91 94311 08745",
      email: "sunita.ecolab@neeri-empanelled.org",
    },
    auditsCompleted: 54,
    complianceRating: 4.88,
    turnaroundDays: 7,
    description:
      "Specialized water quality, river discharge, and industrial effluent compliance auditing firm providing field spectroscopic verification of student-developed filtration and chemical treatment prototypes.",
    specializedEquipment: [
      "Inductively Coupled Plasma (ICP-MS)",
      "Atomic Absorption Spectrophotometer (AAS)",
      "Ion Chromatography System",
      "TOC & COD Digestion Analyzers",
    ],
  },
  {
    id: "csir-cimfr",
    name: "CSIR-Central Institute of Mining & Fuel Research",
    shortName: "CSIR-CIMFR",
    category: "Mine Safety & Gas Telemetry",
    domainExpertise: [
      "Mine Hazard Profiling",
      "Methane & Toxic Gas Telemetry",
      "Rock Mechanics & Slope Stability",
      "Blasting Vibration Audits",
    ],
    certifications: [
      "CSIR Autonomous R&D Body",
      "DGMS Approved Testing Authority",
      "ISO 9001:2015 Accredited",
    ],
    operatingDistricts: [
      "Dhanbad",
      "Bokaro",
      "Ramgarh",
      "Ranchi",
      "East Singhbhum",
      "Hazaribagh",
    ],
    headquarters: "Barwa Road, Dhanbad, Jharkhand 826015",
    contactPOC: {
      name: "Dr. R. K. Vishwakarma",
      designation: "Chief Scientist (Mine Environment & Safety)",
      phone: "+91 326 2296023",
      email: "safety.audit@cimfr.res.in",
    },
    auditsCompleted: 39,
    complianceRating: 4.92,
    turnaroundDays: 12,
    description:
      "Premier national research institute providing third-party verification for civic gas warning telemetry, abandoned pit slope stabilization, and mine water discharge compliance.",
    specializedEquipment: [
      "Multi-Gas Laser Spectrometers",
      "Geotechnical Borehole Inclinometers",
      "Seismograph Triaxial Arrays",
      "Thermal Infrared UAV Cameras",
    ],
  },
  {
    id: "wapcos-limited",
    name: "WAPCOS Limited (Ministry of Jal Shakti)",
    shortName: "WAPCOS Ltd",
    category: "Hydrogeology & Watershed Management",
    domainExpertise: [
      "Hydrogeological Surveys",
      "Watershed & Aquifer Mapping",
      "Rural Water Supply Audits",
      "Dam & Checkdam Structural Health",
    ],
    certifications: [
      "MINI-RATNA-I PSU (Govt of India)",
      "NABET Accredited EIA Consultant",
      "Central Ground Water Authority Empanelled",
    ],
    operatingDistricts: ["All 24 Districts of Jharkhand"],
    headquarters: "Ashok Nagar, Ranchi, Jharkhand",
    contactPOC: {
      name: "Er. Manoj Kumar Sinha",
      designation: "Regional Project Director (Jal Jeevan & Water Audits)",
      phone: "+91 651 2244190",
      email: "jharkhand.audits@wapcos.gov.in",
    },
    auditsCompleted: 71,
    complianceRating: 4.94,
    turnaroundDays: 10,
    description:
      "Central public sector enterprise offering certified water audit verification, aquifer replenishment modeling, and hydraulic infrastructure safety audits for CSR funded projects.",
    specializedEquipment: [
      "Electrical Resistivity Tomography (ERT)",
      "Acoustic Doppler Current Profilers (ADCP)",
      "Digital Flow & Pressure Loggers",
      "Water Level Telemetry Sensors",
    ],
  },
  {
    id: "envirocheck-nabl",
    name: "EnviroCheck NABL Testing Laboratories",
    shortName: "EnviroCheck",
    category: "Environmental Sampling & Soil Remediation",
    domainExpertise: [
      "Soil Contamination & Bio-Assays",
      "Ambient Air & Particulate Matter (PM2.5/PM10)",
      "Industrial Noise Level Profiling",
      "Agricultural Runoff Testing",
    ],
    certifications: [
      "NABL ISO/IEC 17025:2017 Certified",
      "MoEF&CC Recognized Environmental Lab",
      "QCI/NABET Empanelled",
    ],
    operatingDistricts: [
      "Ranchi",
      "Jamshedpur",
      "Dhanbad",
      "Bokaro",
      "Deoghar",
      "Hazaribagh",
    ],
    headquarters: "Industrial Estate, Kokar, Ranchi, Jharkhand",
    contactPOC: {
      name: "Dr. Ananya Sen",
      designation: "Director of Field Compliance & Analytical Chemistry",
      phone: "+91 98350 44112",
      email: "ananya.sen@envirocheck.in",
    },
    auditsCompleted: 35,
    complianceRating: 4.85,
    turnaroundDays: 5,
    description:
      "Fast-turnaround NABL accredited laboratory providing certified field soil testing, heavy metal bio-accumulation checks, and environmental safety baseline audits.",
    specializedEquipment: [
      "Gas Chromatography (GC-FID/ECD)",
      "Portable PM2.5/PM10 Laser Dust Trackers",
      "Sound Level Octave Band Analyzers",
      "Soil Heavy Metal Extraction Digestors",
    ],
  },
];
