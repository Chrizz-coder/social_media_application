import mongoose, { Schema, models, model } from "mongoose";
import type { IUser } from "@social/types";

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    bio: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

// Guard against model re-registration during hot-reloads
export const User = (models.User as mongoose.Model<IUser>) || model<IUser>("User", UserSchema);
