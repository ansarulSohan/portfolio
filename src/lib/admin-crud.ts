import "server-only";
import { Types, type Model } from "mongoose";
import { connectDB } from "./db";

export type Direction = "up" | "down";

/** Order value that puts a new item at the end of the list. */
export async function nextOrder<T>(model: Model<T>): Promise<number> {
  await connectDB();
  const last = await model
    .findOne()
    .sort({ order: -1 })
    .select("order")
    .lean<{ order?: number }>();
  return (last?.order ?? -1) + 1;
}

/**
 * Move one item up or down in its list, then renumber the whole list 0..n-1
 * so orders stay dense even after deletes or concurrent edits.
 * Returns false if the item doesn't exist or is already at the edge.
 */
export async function moveDocument<T>(
  model: Model<T>,
  id: string,
  direction: Direction,
): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  await connectDB();
  const items = await model
    .find()
    .sort({ order: 1, createdAt: -1 })
    .select("_id")
    .lean<{ _id: Types.ObjectId }[]>();
  const index = items.findIndex((item) => item._id.toString() === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length) return false;

  [items[index], items[target]] = [items[target], items[index]];
  await model.bulkWrite(
    items.map((item, order) => ({
      updateOne: { filter: { _id: item._id }, update: { $set: { order } } },
    })) as Parameters<Model<T>["bulkWrite"]>[0],
  );
  return true;
}

export function isValidId(id: unknown): id is string {
  return typeof id === "string" && Types.ObjectId.isValid(id);
}

/**
 * Turn validated form data into a Mongo update: defined values go in $set and
 * cleared optional fields (undefined) go in $unset, so emptying a field in the
 * editor really removes the old value. Nested objects are replaced whole.
 */
export function toUpdate(data: Record<string, unknown>) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) $unset[key] = 1;
    else $set[key] = value;
  }
  return Object.keys($unset).length > 0 ? { $set, $unset } : { $set };
}
