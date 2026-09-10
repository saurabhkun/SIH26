import mongoose, { Schema, Document, Model } from "mongoose";

export const USER_ROLES = [
  "gov",
  "college",
  "industry",
  "gov_ro",
  "consultancy",
  "citizen",
  "super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  designation?: string;
  district?: string;
  college?: mongoose.Types.ObjectId;
  organizationName?: string;
  employeeId?: string;
  domainExpertise?: string[];
  certifications?: string[];
  accreditation?: string;
  address?: string;
  contactPerson?: string;
  operatingDistricts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    designation: { type: String, trim: true },
    district: { type: String, trim: true },
    college: {
      type: Schema.Types.ObjectId,
      ref: "College",
      default: null,
    },
    organizationName: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    domainExpertise: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    accreditation: { type: String, trim: true },
    address: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    operatingDistricts: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
