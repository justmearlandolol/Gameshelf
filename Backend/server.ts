import express, { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { connectDB, getDB } from "./db";
import path from "path";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../Frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

//GET semua game dari MongoDB.
app.get("/api/games", async (req, res, next) => {
  try {
    const games = getDB().collection("games");
    return res.json(await games.find({}).toArray());
  } catch (error) {
    return next(error);
  }
});

type GameStats = "Library" | "Playing Now" | "Completed" | "Backlog" | "Favorites";
type Platform = "PC" | "SmartPhone" | "Tablet";


export interface game {
  _id?: string;
  title: string;
  genre: string;
  platform: Platform;
  status: GameStats;
  Playtime: number;
  lastplayed: Date;
  notes?: string;
  isFavorite: boolean;
}

// Statistik untuk dashboard GameShelf.
export interface Gameshelfstats {
  totalGamesCount: number;
  playingNowCount: number;
  completedCount: number;
  backlogCount: number;
  favorites: number;
  totalPlaytimeHours: string;
  completionRatePercentage: number;
}

// Interface request untuk membuat game baru melalui POST /api/games.
interface CreateGameRequest {
  title: string;
  genre: string;
  status: string;
  playtime: number;
  platform: string;
  notes?: string;
  isFavorite: boolean;
}

function validatePlatform(platform: string): boolean {
  return ["PC", "SmartPhone", "Tablet"].includes(platform);
}

function validateStatus(status: string): boolean {
  return ["Library", "Playing Now", "Completed", "Backlog", "Favorites"].includes(status);
}

// GET satu game berdasarkan MongoDB ObjectId.
app.get("/api/games/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    const games = getDB().collection("games");
    const foundGame = await games.findOne({ _id: new ObjectId(id) });
    if (!foundGame) {
      return res.status(404).json({ message: "Game not found" });
    }
    return res.json(foundGame);
  } catch (error) {
    return next(error);
  }
});

// Validasi platform/status tetap dilakukan sebelum update ke MongoDB.
app.patch("/api/games/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    const body = req.body as Record<string, unknown>;
    const allowedFields = ["title", "genre", "platform", "status", "playtime", "notes", "isFavorite"];
    const keys = Object.keys(body ?? {});
    if (keys.length === 0 || keys.some((key) => !allowedFields.includes(key))) {
      return res.status(400).json({ message: "Request must contain only editable game fields" });
    }

    if ("title" in body && (typeof body.title !== "string" || !body.title.trim())) {
      return res.status(400).json({ message: "Invalid title" });
    }
    if ("genre" in body && (typeof body.genre !== "string" || !body.genre.trim())) {
      return res.status(400).json({ message: "Invalid genre" });
    }
    if ("platform" in body && (typeof body.platform !== "string" || !validatePlatform(body.platform))) {
      return res.status(400).json({ message: "Invalid platform" });
    }
    if ("status" in body && (typeof body.status !== "string" || !validateStatus(body.status))) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if ("playtime" in body && (typeof body.playtime !== "number" || !Number.isFinite(body.playtime) || body.playtime < 0)) {
      return res.status(400).json({ message: "Invalid playtime" });
    }
    if ("notes" in body && typeof body.notes !== "string") {
      return res.status(400).json({ message: "Invalid notes" });
    }
    if ("isFavorite" in body && typeof body.isFavorite !== "boolean") {
      return res.status(400).json({ message: "Invalid isFavorite" });
    }

    const games = getDB().collection("games");
    const result = await games.updateOne({ _id: new ObjectId(id) }, { $set: body });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Game not found" });
    }
    return res.status(200).json(await games.findOne({ _id: new ObjectId(id) }));
  } catch (error) {
    return next(error);
  }
});

// POST /api/games — masukkan game baru ke MongoDB menggunakan insertOne().
app.post("/api/games", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (
      !body ||
      typeof body.title !== "string" || !body.title.trim() ||
      typeof body.genre !== "string" || !body.genre.trim() ||
      typeof body.platform !== "string" ||
      typeof body.status !== "string" ||
      typeof body.playtime !== "number" ||
      !Number.isFinite(body.playtime) || body.playtime < 0 ||
      typeof body.isFavorite !== "boolean" ||
      (body.notes !== undefined && typeof body.notes !== "string")
    ) {
      return res.status(400).json({ message: "Invalid or missing game fields" });
    }

    if (!validatePlatform(body.platform) || !validateStatus(body.status)) {
      return res.status(400).json({ message: "Invalid platform or status" });
    }

    // Buat dokumen baru. MongoDB akan menghasilkan _id secara otomatis.
    const newGame = {
      title: body.title.trim(),
      genre: body.genre.trim(),
      platform: body.platform,
      status: body.status,
      playtime: body.playtime,
      notes: body.notes,
      isFavorite: body.isFavorite,
      lastplayed: new Date()
    };

    const games = getDB().collection("games");
    // Masukkan game baru ke collection games.
    const result = await games.insertOne(newGame);
    const insertedGame = await games.findOne({ _id: result.insertedId });
    return res.status(201).json(insertedGame);
  } catch (error) {
    return next(error);
  }
});

//DELETE menghapus game dari MongoDB berdasarkan ObjectId.
app.delete("/api/games/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    const games = getDB().collection("games");
    const result = await games.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Game not found" });
    }
    return res.status(200).json({ message: "Game deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  return res.status(500).json({ message: "Internal server error" });
});

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });
