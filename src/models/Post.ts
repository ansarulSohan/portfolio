import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { imageSubSchema } from "./shared";

/** An image uploaded into a post's body; tracked so it's deleted with the post. */
const bodyImageSchema = new Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    /** Markdown. */
    body: { type: String, default: "" },
    tags: { type: [String], default: [] },
    cover: imageSubSchema,
    images: { type: [bodyImageSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
    /** When it goes (or went) live. Public = published and publishAt <= now. */
    publishAt: Date,
    commentsOpen: { type: Boolean, default: true },
    readingMinutes: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// Public listing: published posts, newest first.
postSchema.index({ status: 1, publishAt: -1 });

export type PostDoc = InferSchemaType<typeof postSchema>;

export const Post: Model<PostDoc> =
  (mongoose.models.Post as Model<PostDoc>) ?? model("Post", postSchema);
