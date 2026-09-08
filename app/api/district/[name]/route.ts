import { GET as getDistrict } from "@/app/api/districts/[name]/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export { getDistrict as GET };
