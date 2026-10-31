import mongoose from "mongoose";
import { E2E_DB_NAME, e2eMongoUri } from "./env";

/** Drop the throwaway e2e database. Refuses to drop anything else. */
export default async function globalTeardown() {
  const uri = e2eMongoUri();
  if (new URL(uri).pathname !== `/${E2E_DB_NAME}`) {
    throw new Error(`Refusing to drop a database other than ${E2E_DB_NAME}`);
  }
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    if (connection.db?.databaseName !== E2E_DB_NAME) {
      throw new Error(
        `Connected to ${connection.db?.databaseName}, not ${E2E_DB_NAME}; not dropping.`,
      );
    }
    await connection.db.dropDatabase();
  } finally {
    await connection.close();
  }
}
