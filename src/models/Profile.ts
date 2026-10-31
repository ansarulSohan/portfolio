import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { fileSubSchema, imageSubSchema } from "./shared";

/** Singleton: the site has exactly one profile document. */
const profileSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    tagline: String,
    location: String,
    email: { type: String, required: true },
    socials: {
      linkedin: String,
      github: String,
      x: String,
      website: String,
    },
    bio: { type: String, default: "" },
    values: { type: [String], default: [] },
    avatar: imageSubSchema,
    resume: fileSubSchema,
    seo: {
      title: String,
      description: String,
    },
  },
  { timestamps: true },
);

export type ProfileDoc = InferSchemaType<typeof profileSchema>;

// `mongoose.models.X ??` reuses the compiled model across dev hot reloads.
export const Profile: Model<ProfileDoc> =
  (mongoose.models.Profile as Model<ProfileDoc>) ??
  model("Profile", profileSchema, "profile");
