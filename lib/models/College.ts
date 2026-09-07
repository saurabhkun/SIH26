/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document, Model } from "mongoose";
import { CollegeTier } from "@/types/civic";

export type { CollegeTier };
export const COLLEGE_TIERS: CollegeTier[] = ["L1", "L2", "L3R", "L3G"];

export interface IFacility {
  name: string;
  description?: string;
  equipment?: string[];
  certification?: string;
  relatedDomains?: string[];
}

export interface IFaculty {
  name: string;
  department: string;
  specialization?: string;
  email: string;
}

export interface ICollege extends Document {
  name: string;
  code: string;
  email: string;
  tier: CollegeTier;
  district: string;
  facilities: string[] | IFacility[];
  researchSpecializations: string[];
  capabilities: string[];
  faculty: IFaculty[];
  activeFacultyCount: number;
  availableStudentWorkforce: number;
  completedProjectsCount: number;
  avgMilestoneOnTimeRate: number;
  reputationScore: number;
  contactPerson?: string;
  contactPhone?: string;
  maxConcurrentClaims: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FacultySchema = new Schema<IFaculty>(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const CollegeSchema = new Schema<ICollege>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ["L1", "L2", "L3R", "L3G"],
      default: "L2",
      index: true,
    },
    district: { type: String, required: true, trim: true, index: true },
    facilities: { type: [Schema.Types.Mixed as any], default: [] },
    researchSpecializations: [{ type: String }],
    capabilities: [{ type: String }],
    faculty: { type: [FacultySchema], default: [] },
    activeFacultyCount: { type: Number, default: 25 },
    availableStudentWorkforce: { type: Number, default: 120 },
    completedProjectsCount: { type: Number, default: 0 },
    avgMilestoneOnTimeRate: { type: Number, default: 95.0 },
    reputationScore: { type: Number, default: 4.8 },
    contactPerson: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    maxConcurrentClaims: { type: Number, default: 4, min: 1 },
    verified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// High performance compound indexes
CollegeSchema.index({ tier: 1, district: 1 });
CollegeSchema.index({ capabilities: 1, tier: 1 });
CollegeSchema.index({ reputationScore: -1 });

const College: Model<ICollege> =
  mongoose.models.College || mongoose.model<ICollege>("College", CollegeSchema);

export default College;
