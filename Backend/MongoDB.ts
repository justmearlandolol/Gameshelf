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
  isFavorite?: boolean;
}

async function main() {
  try {
    await client.connect();
    console.log("MongoDB connected!");

    const db = client.db("gameshelf");
    const games = db.collection<Game>("games");


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

    //projection 
    const results = await games.find({
        isFavorite: true
      })
      .project({
        _id: 0,
        title: 1,
        genre: 1
      })
      .toArray();

      console.log(results);

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
    // Aggregation
    const hasil = await games.aggregate([
      {
        $group: {
          _id: "$platform",
          totalPlaytime: { $sum: "$playtime" }
        }
      }
    ]).toArray();

    console.log(hasil);

const completedStats = await games.aggregate([
  {
    $match: {
      status: "Completed"
    }
  },
  {
    $group: {
      _id: "$genre",
      totalPlaytime: { $sum: "$playtime" }
    }
  },
  {
    $sort: {
      totalPlaytime: 1
    }
  }
]).toArray();

console.log(completedStats);


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
