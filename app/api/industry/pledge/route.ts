import { POST as createPledge, GET as getPledges } from "@/app/api/pledges/route";

export const dynamic = "force-dynamic";

export { createPledge as POST, getPledges as GET };
