import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

/** A contact-form submission. */
const messageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: String,
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    /** Salted hash of the sender's IP, for abuse handling without storing the raw IP. */
    ipHash: String,
  },
  { timestamps: true },
);

// Admin inbox: newest first, filterable by unread.
messageSchema.index({ read: 1, createdAt: -1 });

export type MessageDoc = InferSchemaType<typeof messageSchema>;

export const Message: Model<MessageDoc> =
  (mongoose.models.Message as Model<MessageDoc>) ??
  model("Message", messageSchema);
