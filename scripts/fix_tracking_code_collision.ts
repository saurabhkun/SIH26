import { connectDB } from "../lib/mongodb";
import Issue from "../lib/models/Issue";

async function main() {
  await connectDB();
  console.log("Checking for collision on CR-JH-2026-000106 or duplicate tracking codes...");

  const existing = await Issue.find({ trackingCode: "CR-JH-2026-000106" });
  if (existing.length > 1) {
    console.log(`Found ${existing.length} issues with trackingCode CR-JH-2026-000106.`);
    for (let i = 1; i < existing.length; i++) {
      const doc = existing[i];
      const newCode = `CR-JH-2026-000106-FIX${i}`;
      doc.trackingCode = newCode;
      await doc.save();
      console.log(`Updated document ${doc._id} tracking code to ${newCode}`);
    }
  } else if (existing.length === 1) {
    console.log("Found 1 issue with trackingCode CR-JH-2026-000106. Updating with entropy suffix to clear legacy collision index.");
    const doc = existing[0];
    const newCode = `CR-JH-2026-000106-FIX`;
    doc.trackingCode = newCode;
    await doc.save();
    console.log(`Updated document ${doc._id} tracking code to ${newCode}`);
  } else {
    console.log("No existing document with CR-JH-2026-000106 found in connected database.");
  }

  console.log("MongoDB tracking code collision check complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error in fix script:", err);
  process.exit(1);
});
