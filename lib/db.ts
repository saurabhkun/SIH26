/**
 * Re-export the MongoDB connection helper under the alias `@/lib/db`
 * so new files can import from either path.
 */
export { connectDB as default } from "./mongodb";
