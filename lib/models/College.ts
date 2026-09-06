import mongoose, { Schema, Document, Model } from "mongoose";
import { ISSUE_DOMAINS, IssueDomain, COLLEGE_TIERS, CollegeTier } from "../constants/domains";

export { COLLEGE_TIERS };
export type { CollegeTier };

export interface IFacility {
  name: string;
  description?: string;
  relatedDomains: IssueDomain[];
}

export interface IFaculty {
  name: string;
  department: string;
  specialization?: string;
  email: string;
}

export interface ICollege extends Document {
  name: string;
  district: string;
  tier: CollegeTier;
  capabilities: IssueDomain[];
  facilities: IFacility[];
  faculty: IFaculty[];
  email: string;
  contactPerson?: string;
  contactPhone?: string;
  maxConcurrentClaims: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    relatedDomains: [{ type: String, enum: ISSUE_DOMAINS }],
  },
  { _id: false }
);

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
    district: { type: String, required: true, trim: true },
    tier: {
      type: String,
      enum: COLLEGE_TIERS,
      required: true,
    },
    capabilities: [
      {
        type: String,
        enum: ISSUE_DOMAINS,
      },
    ],
    facilities: { type: [FacilitySchema], default: [] },
    faculty: { type: [FacultySchema], default: [] },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactPerson: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    maxConcurrentClaims: { type: Number, default: 3, min: 1 },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
CollegeSchema.index({ district: 1, tier: 1 });
CollegeSchema.index({ capabilities: 1 });

const College: Model<ICollege> =
  mongoose.models.College || mongoose.model<ICollege>("College", CollegeSchema);

export default College;
