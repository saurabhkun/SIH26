import dns from "dns";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Ensure DNS resolution on Windows
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {}

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:admin@cluster0.h2nfefk.mongodb.net/civic_resolve?appName=Cluster0";

async function runCleanup() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log("Connected successfully to Atlas database!");

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database handle not found");

  const usersCol = db.collection("users");
  const collegesCol = db.collection("colleges");
  const proposalsCol = db.collection("proposals");

  // 1. Check existing users
  const oldUsers = await usersCol.find({
    email: { $regex: /rnd\.director/i },
  }).toArray();
  console.log(`Found ${oldUsers.length} old user(s) matching rnd.director.`);

  // 2. Delete old user accounts
  if (oldUsers.length > 0) {
    const delResult = await usersCol.deleteMany({
      email: { $regex: /rnd\.director/i },
    });
    console.log(`[DELETED] ${delResult.deletedCount} old user account(s).`);
  }

  // 3. Check existing colleges with old email
  const oldColleges = await collegesCol.find({
    email: { $regex: /rnd\.director/i },
  }).toArray();
  console.log(`Found ${oldColleges.length} old college record(s) matching rnd.director.`);

  // Delete old college documents
  if (oldColleges.length > 0) {
    const delColResult = await collegesCol.deleteMany({
      email: { $regex: /rnd\.director/i },
    });
    console.log(`[DELETED] ${delColResult.deletedCount} old college document(s).`);
  }

  // 4. Check all proposals and their statuses
  const allProposals = await proposalsCol.find({}).toArray();
  console.log(`Total active proposal records in database: ${allProposals.length}`);

  // 5. Clean up old/stale proposals that might be blocking the fairness cap
  const staleProposalDelete = await proposalsCol.deleteMany({
    $or: [
      { "facultyLead.email": { $regex: /rnd\.director/i } },
      { college: { $in: oldColleges.map((c) => c._id) } },
    ],
  });
  console.log(`[CLEANED] ${staleProposalDelete.deletedCount} stale proposals previously tied to the old institute ID.`);

  // 6. Upsert the fresh institutional record for BIT Mesra with new ID
  const existingBitMesra = await collegesCol.findOne({
    $or: [
      { email: "director.rnd@bitmesra.ac.in" },
      { name: "Birla Institute of Technology, Mesra" },
    ],
  });

  if (existingBitMesra) {
    await collegesCol.updateOne(
      { _id: existingBitMesra._id },
      {
        $set: {
          name: "Birla Institute of Technology, Mesra",
          district: "Ranchi",
          tier: "L1",
          capabilities: [
            "Water Resources",
            "Environment",
            "Agriculture",
            "Energy",
          ],
          email: "director.rnd@bitmesra.ac.in",
          contactPerson: "Dr. A. K. Sinha (Dean R&D)",
          contactPhone: "+91-651-2275444",
          maxConcurrentClaims: 10, // Generous limit so cap is never blocking
          verified: true,
        },
      }
    );
    console.log(`[UPDATED] BIT Mesra college record updated with new ID director.rnd@bitmesra.ac.in & fresh capacity.`);
  } else {
    const insertRes = await collegesCol.insertOne({
      name: "Birla Institute of Technology, Mesra",
      district: "Ranchi",
      tier: "L1",
      capabilities: [
        "Water Resources",
        "Environment",
        "Agriculture",
        "Energy",
      ],
      facilities: [
        {
          name: "Environmental Engineering & Water Testing Lab",
          description: "Advanced spectrometry and heavy metal trace detection facility.",
          relatedDomains: ["Water Resources", "Environment"],
        },
      ],
      faculty: [
        {
          name: "Dr. Ananya Sen",
          department: "Civil & Environmental Engineering",
          specialization: "Groundwater Arsenic Remediation & Filtration",
          email: "director.rnd@bitmesra.ac.in",
        },
      ],
      email: "director.rnd@bitmesra.ac.in",
      contactPerson: "Dr. A. K. Sinha (Dean R&D)",
      contactPhone: "+91-651-2275444",
      maxConcurrentClaims: 10,
      verified: true,
      createdAt: new Date(),
    });
    console.log(`[CREATED] New BIT Mesra college record created: ${insertRes.insertedId}`);
  }

  // 7. Upsert user record for director.rnd@bitmesra.ac.in
  const collegeDoc = await collegesCol.findOne({ email: "director.rnd@bitmesra.ac.in" });
  await usersCol.updateOne(
    { email: "director.rnd@bitmesra.ac.in" },
    {
      $set: {
        name: "Dr. Ananya Sen",
        email: "director.rnd@bitmesra.ac.in",
        passwordHash: "College@1234",
        role: "college",
        designation: "Dean of Research & Innovation",
        district: "Ranchi",
        college: collegeDoc?._id,
        isVerified: true,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log(`[UPSERTED] User account director.rnd@bitmesra.ac.in is active and ready.`);

  console.log("\n✅ CLEANUP COMPLETE: Old institute ID purged, claim limits reset, and new ID initialized!");
  await mongoose.disconnect();
}

runCleanup().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
