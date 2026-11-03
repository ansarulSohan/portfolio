import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

/** A reader's comment on a post. Nothing is shown until it's approved. */
const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    name: { type: String, required: true },
    /** For the admin only; never shown publicly. */
    email: { type: String, required: true },
    /** Plain text. */
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "spam"],
      default: "pending",
      required: true,
    },
    ipHash: String,
  },
  { timestamps: true },
);

// A post's approved comments in order; also the moderation queue per status.
commentSchema.index({ post: 1, status: 1, createdAt: 1 });
commentSchema.index({ status: 1, createdAt: -1 });

export type CommentDoc = InferSchemaType<typeof commentSchema>;

export const Comment: Model<CommentDoc> =
  (mongoose.models.Comment as Model<CommentDoc>) ??
  model("Comment", commentSchema);
