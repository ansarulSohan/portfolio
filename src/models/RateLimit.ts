import mongoose, {
  model,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

/** Fixed-window counters for rate limiting (contact form, login). */
const rateLimitSchema = new Schema({
  /** e.g. "contact:<ip hash>" */
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  /** MongoDB's TTL monitor deletes the document after this time. */
  expiresAt: { type: Date, required: true, expires: 0 },
});

export type RateLimitDoc = InferSchemaType<typeof rateLimitSchema>;

export const RateLimit: Model<RateLimitDoc> =
  (mongoose.models.RateLimit as Model<RateLimitDoc>) ??
  model("RateLimit", rateLimitSchema, "rateLimits");
