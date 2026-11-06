import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

const client = new MongoClient(uri);

export async function connectDB() {
  await client.connect();
  console.log("MongoDB connected!");
}

export function getDB() {
  return client.db("gameshelf");
}

export async function closeDB() {
  await client.close();
  console.log("MongoDB connection closed!");
}
