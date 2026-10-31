import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { SKILL_LEVELS } from "@/lib/validation/content";

const skillCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    items: {
      type: [
        new Schema(
          {
            name: { type: String, required: true },
            level: { type: String, enum: SKILL_LEVELS },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type SkillCategoryDoc = InferSchemaType<typeof skillCategorySchema>;

export const SkillCategory: Model<SkillCategoryDoc> =
  (mongoose.models.SkillCategory as Model<SkillCategoryDoc>) ??
  model("SkillCategory", skillCategorySchema, "skillCategories");
