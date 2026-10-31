import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { imageSubSchema } from "./shared";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, required: true },
    body: { type: String, default: "" },
    tech: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    links: {
      github: String,
      live: String,
      caseStudy: String,
    },
    cover: imageSubSchema,
    gallery: { type: [imageSubSchema], default: [] },
    role: String,
    /** "YYYY-MM" */
    start: String,
    /** "YYYY-MM"; absent means ongoing. */
    end: String,
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    /** Manual sort position, ascending. */
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Public listing: published projects in manual order.
projectSchema.index({ published: 1, order: 1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema>;

export const Project: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ??
  model("Project", projectSchema);
