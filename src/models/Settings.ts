import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

/** Singleton: site-wide options edited in /admin/settings. */
const settingsSchema = new Schema(
  {
    sections: {
      about: { type: Boolean, default: true },
      projects: { type: Boolean, default: true },
      experience: { type: Boolean, default: true },
      skills: { type: Boolean, default: true },
      education: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
      // Off until the owner turns it on, so an empty blog never shows.
      blog: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;

export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as Model<SettingsDoc>) ??
  model("Settings", settingsSchema, "settings");
