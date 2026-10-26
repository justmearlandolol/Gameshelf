import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI belum diset di .env");
  process.exit(1);
}

const client = new MongoClient(uri);

interface Game {
  title: string;
  genre: string;
  platform: "PC" | "Smartphone" | "Tablet" | "Console";
  playtime?: number;
}

async function main() {
  try {
    await client.connect();
    console.log("MongoDB connected!");

    const db = client.db("gameshelf");
    const games = db.collection<Game>("games");

    await games.insertOne({
      title: "Minecraft",
      genre: "Sandbox",
      platform: "PC",
    });
    await games.insertOne({
      title: "Apex Legends",
      genre: "Battle Royale",
      platform: "PC",
      playtime: 200,
    });
    console.log("Games inserted");

    const search = await games
      .find({
        platform: { $nin: ["Smartphone"] },
        genre: "Battle Royale",
        $or: [{ genre: "Sandbox" }, { genre: "Battle Royale" }],
        $and: [{ platform: "PC" }, { playtime: { $gt: 100 } }],
      })
      .sort({ playtime: -1 })
      .skip(1)
      .limit(2)
      .toArray();
    console.log(search);

    await games.findOne({
      title: "Test Game",
      genre: "Test Genre",
      platform: "Console",
      playtime: 100,
    });

    const data = await games.findOne<Game>({ title: "Minecraft" });
    if (!data) {
      console.warn("Minecraft tidak ditemukan");
    } else {
      console.log("Found Game:", data);
    }

    const result = await games.updateMany(
      { title: "Minecraft" },
      { $set: { platform: "Smartphone" } }
    );
    if (result.matchedCount === 0) {
      console.warn("Tidak ada dokumen yang cocok untuk di-update");
    }
    console.log(result);

    const remove = await games.deleteMany({ title: "Minecraft" });
    if (remove.deletedCount === 0) {
      console.warn("Tidak ada dokumen yang dihapus");
    }
    console.log(remove);

    const deletedGame = await games.findOne<Game>({ title: "Minecraft" });
    console.log(deletedGame);

    const id = "6ab52b966d09bdd8046afe1d";
    if (!ObjectId.isValid(id)) {
      console.error("ObjectId tidak valid:", id);
    } else {
      const game = await games.findOne<Game>({ _id: new ObjectId(id) });
      console.log(game ?? "Game dengan ID tersebut tidak ditemukan");
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

main(); 
