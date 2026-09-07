import React from "react";
import IndustryDashboardPage from "../page";

export const dynamic = "force-dynamic";

export default function IndustryFeedPage() {
  return <IndustryDashboardPage initialTab="curated" />;
}
