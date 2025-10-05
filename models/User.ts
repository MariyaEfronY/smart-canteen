import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    dno: {
      type: String,
      required: true,
      unique: true,
      match: [/^[0-9]{2}[A-Z]{3}[0-9]{3}$/, "Invalid D.No format (e.g., 23UBC512)"],
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
