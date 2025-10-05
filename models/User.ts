import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Student ID (e.g. 23UBC512)
    dno: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      match: [
        /^[0-9]{2}[A-Z]{3}[0-9]{3}$/,
        "Invalid D.No format (e.g., 23UBC512)",
      ],
    },

    // Staff ID (e.g. ST23CS512)
    staffId: {
      type: String,
      required: function () {
        return this.role === "staff";
      },
      match: [
        /^ST[0-9A-Z]{3,}$/,
        "Invalid Staff ID format (e.g., ST23CS512)",
      ],
    },

    role: {
      type: String,
      enum: ["student", "staff", "admin"], // ✅ Added staff
      default: "student",
    },
  },
  { timestamps: true }
);

// ✅ Ensure mongoose doesn’t recompile models
const User = models.User || model("User", userSchema);

export default User;
