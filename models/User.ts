import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  password: string;
  role: "student" | "staff" | "admin";
  dno?: string;
  staffId?: string;
  department?: string;
  phone?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    // ✅ use a typed `this` instead of `any`
    email: {
      type: String,
      required: function (this: IUser) {
        return this.role === "admin";
      },
      unique: false,
      sparse: true,
    },

    password: { type: String, required: true },
    role: { type: String, enum: ["student", "staff", "admin"], required: true },

    dno: {
      type: String,
      required: function (this: IUser) {
        return this.role === "student";
      },
      match: [/^[0-9]{2}[A-Z]{3}[0-9]{3}$/, "Invalid D.No format"],
    },

    staffId: {
      type: String,
      required: function (this: IUser) {
        return this.role === "staff";
      },
      match: [/^[0-9]{2}[A-Z]{3}[0-9]{2,3}$/, "Invalid Staff ID format"],
    },

    department: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

// ✅ Mongoose model export
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
