import { Schema } from "mongoose";

/** An uploaded image in the bucket; mirrors `imageSchema` in lib/validation/common.ts. */
export const imageSubSchema = new Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
    alt: { type: String, required: true },
  },
  { _id: false },
);

/** An uploaded file in the bucket; mirrors `fileSchema` in lib/validation/common.ts. */
export const fileSubSchema = new Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);
