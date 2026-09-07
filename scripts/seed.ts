import { connectDB } from "../lib/mongodb";
import College from "../lib/models/College";
import Issue from "../lib/models/Issue";
import User from "../lib/models/User";
import Notification from "../lib/models/Notification";
import mongoose from "mongoose";

async function runSeed() {
  console.log("==================================================================");
  console.log("   CivicResolve (SIH 2026 PS 26043) - Database Verification & Seed");
  console.log("==================================================================");

  let memServer: any = null;
  const targetUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/civicresolve";
  process.env.MONGODB_URI = targetUri;

  console.log(`Attempting connection to MongoDB at: ${targetUri}`);

  try {
    // Quick probe if local standalone mongod is responding
    const probeConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 2000 }).asPromise().catch(() => null);

    if (probeConn) {
      await probeConn.close();
      console.log("-> Local MongoDB instance detected at 127.0.0.1:27017.");
    } else {
      console.log("-> No active MongoDB daemon at 127.0.0.1:27017. Spinning up in-memory MongoDB instance for schema verification...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memServer = await MongoMemoryServer.create();
      process.env.MONGODB_URI = memServer.getUri();
      console.log(`-> In-memory MongoDB running at: ${process.env.MONGODB_URI}`);
    }

    // Call standard cached connectDB helper from lib/mongodb.ts
    await connectDB();
    console.log("[OK] connectDB() successfully connected to database.\n");

    // Clean existing seed collections
    console.log("Step 1: Clearing existing collections...");
    await College.deleteMany({});
    await Issue.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});
    console.log("[OK] Existing records cleared.\n");

    // 1. Seed 3 Sample Colleges across tiers in Jharkhand
    console.log("Step 2: Inserting 3 sample Higher Education Institutions (HEIs)...");
    const collegesData = [
      {
        name: "Birla Institute of Technology, Mesra",
        district: "Ranchi",
        tier: "L1" as const,
        capabilities: ["Water Resources", "Environment", "Agriculture", "Energy"],
        facilities: [
          {
            name: "Environmental Engineering & Water Testing Lab",
            description: "Advanced spectrometry and heavy metal trace detection facility.",
            relatedDomains: ["Water Resources", "Environment"],
          },
          {
            name: "Renewable Energy Research Center",
            description: "Solar PV microgrid and biomass conversion testing setup.",
            relatedDomains: ["Energy"],
          },
        ],
        faculty: [
          {
            name: "Dr. Ananya Sen",
            department: "Civil & Environmental Engineering",
            specialization: "Groundwater Arsenic Remediation & Filtration",
            email: "ananya.sen@bitmesra.ac.in",
          },
          {
            name: "Prof. Rajesh Verma",
            department: "Computer Science & Engineering",
            specialization: "IoT Sensor Networks for Smart Irrigation",
            email: "rverma@bitmesra.ac.in",
          },
        ],
        email: "rnd.director@bitmesra.ac.in",
        contactPerson: "Dr. A. K. Sinha (Dean R&D)",
        contactPhone: "+91-651-2275444",
        maxConcurrentClaims: 5,
        verified: true,
      },
      {
        name: "National Institute of Technology Jamshedpur",
        district: "East Singhbhum",
        tier: "L1" as const,
        capabilities: ["Urban Development", "Energy", "Sanitation", "Healthcare"],
        facilities: [
          {
            name: "Urban IoT & Automation Cell",
            description: "Smart waste sensor prototyping and GIS mapping unit.",
            relatedDomains: ["Urban Development", "Sanitation"],
          },
        ],
        faculty: [
          {
            name: "Dr. Prakash Murmu",
            department: "Electrical & Electronics Engineering",
            specialization: "Off-grid Solar Inverters & Rural Electrification",
            email: "pmurmu.ee@nitjsr.ac.in",
          },
        ],
        email: "innovations@nitjsr.ac.in",
        contactPerson: "Prof. Sanjay Mishra",
        contactPhone: "+91-657-2286620",
        maxConcurrentClaims: 4,
        verified: true,
      },
      {
        name: "Government Polytechnic Dumka",
        district: "Dumka",
        tier: "L3" as const,
        capabilities: ["Rural Livelihoods", "Agriculture", "Water Resources"],
        facilities: [
          {
            name: "Rural Fabrication Workshop",
            description: "Low-cost mechanical tool machining and agricultural implement fabrication.",
            relatedDomains: ["Agriculture", "Rural Livelihoods"],
          },
        ],
        faculty: [
          {
            name: "Er. Rameshwar Soren",
            department: "Mechanical Engineering",
            specialization: "Low-cost seed drill & micro-tiller adaptation",
            email: "r.soren@gpdumka.ac.in",
          },
        ],
        email: "principal@gpdumka.ac.in",
        contactPerson: "Er. Rameshwar Soren",
        contactPhone: "+91-6434-222415",
        maxConcurrentClaims: 2,
        verified: true,
      },
    ];

    const insertedColleges = await College.insertMany(collegesData);
    console.log(`[OK] Inserted ${insertedColleges.length} colleges:`);
    insertedColleges.forEach((col, idx) => {
      console.log(`   ${idx + 1}. [Tier ${col.tier}] ${col.name} (${col.district})`);
      console.log(`      Capabilities: ${col.capabilities.join(", ")}`);
      console.log(`      Faculty: ${col.faculty.map(f => f.name).join(", ")}`);
      console.log(`      ID: ${col._id}`);
    });

    // 2. Seed 5 Sample Issues across Jharkhand districts
    console.log("\nStep 3: Inserting 5 sample civic issues across Jharkhand districts...");
    const issuesData = [
      {
        title: "Fluoride Contamination in Village Handpumps of Bhandra Block",
        description: "Severe fluoride contamination (>2.5 mg/L) detected in 14 community handpumps across 3 panchayats, causing dental and skeletal fluorosis among schoolchildren.",
        attachments: [
          {
            url: "https://example.gov.in/reports/fluoride-test-lohardaga.pdf",
            type: "document" as const,
            filename: "water_quality_test_report_bhandra.pdf",
          },
        ],
        domain: "Water Resources" as const,
        severityScore: 5,
        aiTags: ["water-contamination", "fluoride", "groundwater-filtration", "public-health"],
        district: "Lohardaga",
        pincode: "835302",
        address: "Bhandra Gram Panchayat, Block Bhandra",
        location: { lat: 23.4735, lng: 84.7796 },
        facingSince: "1+ years" as const,
        citizenName: "Sushil Oraon",
        citizenMobile: "9876543210",
        mobileVerified: true,
        trackingCode: "CR-JH-2026-000101",
        dedupFingerprint: "hash_bhandra_lohardaga_water_fluoride_v1",
        duplicateOf: null,
        similarIssueIds: [],
        status: "Reported" as const,
        assignedColleges: [insertedColleges[0]._id],
        reviewedBy: "State Civic Review Officer - Ranchi Desk",
        submissionIndexForMobile: 1,
      },
      {
        title: "High Spoilage in Post-Harvest Lac Processing & Storage",
        description: "Tribal lac farmers in Khunti suffer up to 35% produce loss due to lack of solar dehumidification storage units and moisture-control storage bags during the monsoon flush.",
        attachments: [],
        domain: "Rural Livelihoods" as const,
        severityScore: 4,
        aiTags: ["lac-cultivation", "post-harvest-loss", "solar-drying", "tribal-livelihoods"],
        district: "Khunti",
        pincode: "835210",
        address: "Murhu Market Yard, Khunti",
        location: { lat: 23.0725, lng: 85.2789 },
        facingSince: "6-12 months" as const,
        citizenName: "Birsa Munda",
        citizenMobile: "9876543211",
        mobileVerified: true,
        trackingCode: "CR-JH-2026-000102",
        dedupFingerprint: "hash_khunti_lac_storage_spoilage_v1",
        duplicateOf: null,
        similarIssueIds: [],
        status: "Under_Review" as const,
        assignedColleges: [insertedColleges[2]._id],
        reviewedBy: "District Nodal Officer - Khunti",
        submissionIndexForMobile: 1,
      },
      {
        title: "Coal Dust Fugitive Emissions and Respiratory Risk in Slag Yards",
        description: "Heavy PM10/PM2.5 particulate dispersion affecting residential colonies adjoining coal washery transport corridor without automated mist canon suppression.",
        attachments: [],
        domain: "Environment" as const,
        severityScore: 4,
        aiTags: ["air-pollution", "coal-dust", "particulate-matter", "respiratory-health"],
        district: "Dhanbad",
        pincode: "828104",
        address: "Jharia Bypass Road, Near Colony 4",
        location: { lat: 23.7423, lng: 86.4172 },
        facingSince: "1+ years" as const,
        citizenName: "Amit Kumar Agarwal",
        citizenMobile: "9876543212",
        mobileVerified: true,
        trackingCode: "CR-JH-2026-000103",
        dedupFingerprint: "hash_dhanbad_jharia_dust_pollution_v1",
        duplicateOf: null,
        similarIssueIds: [],
        status: "Assigned_HEI" as const,
        assignedColleges: [insertedColleges[0]._id, insertedColleges[1]._id],
        reviewedBy: "State Environmental Cell Lead",
        submissionIndexForMobile: 1,
      },
      {
        title: "Cold-Chain Breakdown in Remote Primary Health Centre (PHC)",
        description: "Intermittent grid supply causes vaccine storage refrigerator failures at Sarath PHC. Requires a ruggedized hybrid solar-battery backup with real-time temperature telemetry.",
        attachments: [],
        domain: "Healthcare" as const,
        severityScore: 5,
        aiTags: ["cold-chain", "vaccine-storage", "solar-backup", "iot-telemetry"],
        district: "Deoghar",
        pincode: "814149",
        address: "Primary Health Centre, Sarath",
        location: { lat: 24.2215, lng: 86.8488 },
        facingSince: "1-6 months" as const,
        citizenName: "Dr. Priya Kumari",
        citizenMobile: "9876543213",
        mobileVerified: true,
        trackingCode: "CR-JH-2026-000104",
        dedupFingerprint: "hash_deoghar_sarath_phc_coldchain_v1",
        duplicateOf: null,
        similarIssueIds: [],
        status: "Proposal_Submitted" as const,
        assignedColleges: [insertedColleges[1]._id],
        reviewedBy: "Health Directorate Coordinator",
        submissionIndexForMobile: 1,
      },
      {
        title: "Soil Erosion and Silt Choking of Irrigation Canals in Patamda",
        description: "Heavy silt runoff during torrential rains blocks check-dam channels, depriving 200+ hectares of paddy fields from perennial canal irrigation.",
        attachments: [],
        domain: "Agriculture" as const,
        severityScore: 3,
        aiTags: ["soil-erosion", "check-dam", "siltation", "canal-irrigation"],
        district: "East Singhbhum",
        pincode: "832105",
        address: "Patamda Irrigation Sub-Division",
        location: { lat: 22.8942, lng: 86.3814 },
        facingSince: "<1 month" as const,
        citizenName: "Govind Mahto",
        citizenMobile: "9876543214",
        mobileVerified: true,
        trackingCode: "CR-JH-2026-000105",
        dedupFingerprint: "hash_eastsinghbhum_patamda_canal_silt_v1",
        duplicateOf: null,
        similarIssueIds: [],
        status: "Reported" as const,
        assignedColleges: [],
        reviewedBy: undefined,
        submissionIndexForMobile: 1,
      },
    ];

    const insertedIssues = await Issue.insertMany(issuesData);
    console.log(`[OK] Inserted ${insertedIssues.length} issues:`);
    insertedIssues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. [${issue.trackingCode}] ${issue.title}`);
      console.log(`      District: ${issue.district} | Domain: ${issue.domain} | Severity: ${issue.severityScore}/5 | Status: ${issue.status}`);
      console.log(`      Citizen: ${issue.citizenName} (${issue.citizenMobile}) | DedupFingerprint: ${issue.dedupFingerprint}`);
    });

    // 3. Seed 3 Role-Based Test Accounts
    console.log("\nStep 4: Inserting 3 test accounts for role-based portal access...");
    const usersData = [
      {
        name: "Dr. Arvind Kumar",
        email: "officer@jharkhand.gov.in",
        passwordHash: "Gov@1234",
        role: "gov" as const,
        designation: "State Nodal Review Officer",
        district: "Ranchi",
      },
      {
        name: "Dr. Ananya Sen",
        email: "rnd.director@bitmesra.ac.in",
        passwordHash: "College@1234",
        role: "college" as const,
        designation: "Dean of Research & Innovation",
        district: "Ranchi",
        college: insertedColleges[0]._id,
      },
      {
        name: "Sanjay Chatterjee",
        email: "csr.head@tatasteel.com",
        passwordHash: "Industry@1234",
        role: "industry" as const,
        designation: "Head of CSR & Sustainability",
        organizationName: "Tata Steel Foundation",
      },
    ];

    const insertedUsers = await User.insertMany(usersData);
    console.log(`[OK] Inserted ${insertedUsers.length} user accounts:`);
    insertedUsers.forEach((u, idx) => {
      console.log(`   ${idx + 1}. [Role: ${u.role.toUpperCase()}] ${u.name} <${u.email}> (Pass: ${u.passwordHash})`);
    });

    // 4. Seed Multi-Role Operational Notifications
    console.log("\nStep 5: Inserting operational state notifications across roles...");
    const sampleNotifications = [
      {
        recipientRole: "GOV",
        recipientId: "gov_admin_nodal",
        title: "⚡ Circuit Breaker Disaster Alert",
        message: "Damodar River chemical discharge detected near Bokaro Thermal. Emergency fast-track triggered.",
        type: "CIRCUIT_BREAKER_DISASTER",
        priority: "CRITICAL",
        actionUrl: "/dashboard/gov/triage",
        read: false,
      },
      {
        recipientRole: "GOV",
        recipientId: "gov_admin_nodal",
        title: "🏆 Human Panel Determination Required",
        message: "BIT Mesra and NIT Jamshedpur submitted competitive bids for Fluoride Filtration. 1 Winner + 2 Runners-Up to be selected.",
        type: "PANEL_DECISION",
        priority: "HIGH",
        actionUrl: "/dashboard/gov/allocations",
        read: false,
      },
      {
        recipientRole: "RO",
        recipientId: insertedColleges[0]._id.toString(),
        title: "🎯 Challenge Awarded: Winning RO",
        message: "Your institution's proposal for 'Groundwater Heavy-Metal Bioremediation' was approved as Lead RO by the State Nodal Panel!",
        type: "PANEL_DECISION",
        priority: "HIGH",
        actionUrl: "/dashboard/college/projects",
        read: false,
      },
      {
        recipientRole: "RO",
        recipientId: insertedColleges[0]._id.toString(),
        title: "🤝 L3 Subcontracting Recommendation",
        message: "Consider delegating ground sensor calibration to Chaibasa Polytechnic (Tier L3G) for rural deployment.",
        type: "L3_SUBCONTRACT_INVITE",
        priority: "NORMAL",
        actionUrl: "/dashboard/college/projects",
        read: true,
      },
      {
        recipientRole: "INDUSTRY",
        recipientId: "all_csr_partners",
        title: "💰 Milestone Escrow Verification Ready",
        message: "Milestone #1 for Patamda Check-Dam IoT telemetry has achieved nodal signoff. Escrow payout ready for release.",
        type: "MILESTONE_PAYOUT_RELEASED",
        priority: "NORMAL",
        actionUrl: "/dashboard/industry/escrow",
        read: false,
      },
      {
        recipientRole: "CITIZEN",
        recipientPhone: "9876543210",
        title: "✅ Ground Resolution In Progress",
        message: "BIT Mesra field engineering team deployed automated water testing units in Ranchi Sadar.",
        type: "CITIZEN_STATUS_UPDATE",
        priority: "NORMAL",
        actionUrl: "/track",
        read: false,
      },
    ];

    const insertedNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`[OK] Inserted ${insertedNotifications.length} operational notifications.`);

    console.log("\n==================================================================");
    console.log(" [SUCCESS] Database schemas, users, and connectDB() fully verified!");
    console.log("==================================================================");
  } catch (error) {
    console.error("\n[ERROR] Seed execution failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    if (memServer) {
      await memServer.stop();
    }
    console.log("Database connection cleanly closed.");
  }
}

runSeed();
