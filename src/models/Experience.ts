import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

const experienceSchema = new Schema(
  {
    role: { type: String, required: true },
    company: { type: String, required: true },
    companyUrl: String,
    location: String,
    /** "YYYY-MM" */
    start: { type: String, required: true },
    /** "YYYY-MM"; absent means "present". */
    end: String,
    highlights: { type: [String], default: [] },
    tech: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ExperienceDoc = InferSchemaType<typeof experienceSchema>;

export const Experience: Model<ExperienceDoc> =
  (mongoose.models.Experience as Model<ExperienceDoc>) ??
  model("Experience", experienceSchema);
