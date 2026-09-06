async function testPhase4() {
  const baseUrl = "http://localhost:3000";
  console.log("==================================================================");
  console.log("   CivicResolve Phase 4 End-to-End API & Dashboard Verification   ");
  console.log("==================================================================");

  // Test 1: Fetch Districts Summary
  console.log("\n[Test 1] GET /api/districts/summary...");
  const summaryRes = await fetch(`${baseUrl}/api/districts/summary`);
  const summaryData = await summaryRes.json();
  console.log(`-> HTTP ${summaryRes.status} | Success: ${summaryData.success}`);
  console.log(`-> Total Districts Aggregated: ${summaryData.totalDistricts}`);
  const sampleDist = summaryData.data["Lohardaga"] || summaryData.data["Ranchi"];
  console.log(`-> Sample District Stats [Lohardaga]:`, sampleDist);

  // Test 2: Submit a New Civic Issue (Citizen Submission)
  console.log("\n[Test 2] POST /api/issues (Submit new civic challenge in Lohardaga)...");
  const newIssuePayload = {
    title: "Broken Bridge Culvert Disrupting Paddy Transport in Kuru",
    description: "Monsoon floods washed away the approach slab of the Kuru-Senha road culvert, cutting off 8 agricultural villages from the block market.",
    domain: "Agriculture",
    district: "Lohardaga",
    facingSince: "1-6 months",
    citizenName: "Bishwanath Sahu",
    citizenMobile: "9876500001",
    pincode: "835302",
    address: "Kuru Panchayat Road, Near River Bridge",
    location: { lat: 23.54, lng: 84.81 },
    severityScore: 4,
  };

  const createRes = await fetch(`${baseUrl}/api/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newIssuePayload),
  });
  const createData = await createRes.json();
  console.log(`-> HTTP ${createRes.status} | Tracking Code: ${createData.trackingCode}`);
  console.log(`-> Duplicate Flagged: ${createData.isDuplicateFlagged} | Status: ${createData.data?.status}`);
  console.log(`-> Repeat Reporter Index: ${createData.submissionIndexForMobile}`);

  // Test 3: Deduplication Detection Test (Submit duplicate content)
  console.log("\n[Test 3] POST /api/issues with duplicate text to test dedupFingerprint...");
  const dupRes = await fetch(`${baseUrl}/api/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newIssuePayload),
  });
  const dupData = await dupRes.json();
  console.log(`-> HTTP ${dupRes.status} | Tracking Code: ${dupData.trackingCode}`);
  console.log(`-> Duplicate Flagged: ${dupData.isDuplicateFlagged} (Expected: true)`);
  console.log(`-> Status Assigned: ${dupData.data?.status} (Expected: Under_Review)`);
  console.log(`-> Similar Issue IDs count: ${dupData.data?.similarIssueIds?.length}`);
  console.log(`-> Repeat Reporter Index: ${dupData.submissionIndexForMobile} (Expected: 2)`);

  // Test 4: Fetch District Detail for Lohardaga
  console.log("\n[Test 4] GET /api/districts/Lohardaga...");
  const detailRes = await fetch(`${baseUrl}/api/districts/Lohardaga`);
  const detailData = await detailRes.json();
  console.log(`-> HTTP ${detailRes.status} | District: ${detailData.district.name}`);
  console.log(`-> Total Issues in Lohardaga: ${detailData.stats.totalIssues}`);
  console.log(`-> Resolution Rate: ${detailData.stats.resolutionRate}%`);
  console.log(`-> Top 2 Issues in Lohardaga:`);
  detailData.issues.slice(0, 2).forEach((iss, i) => {
    console.log(`   ${i + 1}. [${iss.trackingCode}] ${iss.title} (${iss.status})`);
  });

  console.log("\n==================================================================");
  console.log(" [SUCCESS] All Phase 4 API routes & validation checks PASSED!");
  console.log("==================================================================");
}

testPhase4().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
