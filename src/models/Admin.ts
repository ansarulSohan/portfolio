import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

const adminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /** bcrypt hash; the plain password is never stored. */
    passwordHash: { type: String, required: true },
    /**
     * Embedded in session tokens. Incrementing it (password change, "sign out
     * everywhere") makes every previously issued session invalid.
     */
    sessionVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;

export const Admin: Model<AdminDoc> =
  (mongoose.models.Admin as Model<AdminDoc>) ?? model("Admin", adminSchema);
