import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

const educationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    location: String,
    /** "YYYY-MM" */
    start: { type: String, required: true },
    /** "YYYY-MM"; absent means ongoing. */
    end: String,
    notes: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type EducationDoc = InferSchemaType<typeof educationSchema>;

export const Education: Model<EducationDoc> =
  (mongoose.models.Education as Model<EducationDoc>) ??
  model("Education", educationSchema, "education");
