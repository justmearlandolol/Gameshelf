import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017");

async function main() {
    await client.connect();

    console.log("MongoDB connected!");

    const db = client.db("gameshelf");
    const games = db.collection("games");

    await games.insertOne({
        title: "Minecraft",
        platform: "PC",
        genre: "Sandbox",
        status: "Playing"
    });

    console.log("Game added!");

    const data = await games.find().toArray();

    console.log(data);

    await client.close();
}

main().catch(console.error);