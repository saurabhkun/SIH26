import mongoose, { Schema, Document, Model } from "mongoose";

export const USER_ROLES = ["gov", "college", "industry"] as const;
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
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
