import express from "express";
const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/games", (req, res) => {
    res.json(Game);
});

app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
});
type GameStats = 'Library' | 'Playing Now' | 'Completed' | 'Backlog' | 'Favorites'

export interface game {
    _id?:string;
    title: string;
    genre: string;
    platform: 'PC'| 'SmartPhone' | 'Tablet';
    status: GameStats;
    Playtime: number;
    lastplayed: Date;
    notes?:string;
    isFavorite: boolean;
    
}

// Gameshelf statistics
export interface Gameshelfstats {
  totalGamesCount: number;
  playingNowCount: number;
  completedCount: number;
  backlogCount: number;
  favorites: number;
  totalPlaytimeHours: string; 
  completionRatePercentage: number; 
}

//in memory games array
// menghitung stats dari array games
function calstats(games: game[]):Gameshelfstats {
    const totalgamescount = games.length;

    const playingnowcount = games.filter(g => g.status === 'Playing Now').length
    const favorites = games.filter(g => g.status === 'Favorites').length
    const backlogCount = games.filter(g => g.status === 'Backlog').length
    const completedCount = games.filter(g => g.status === 'Completed').length
    // menghitung presentase game
    const totalPlaytimeHours = games.reduce((total, g) => total + g.Playtime, 0).toString();
    const completionRatePercentage = totalgamescount === 0
      ? 0
      : (completedCount / totalgamescount) * 100;

    return {
      totalGamesCount: totalgamescount,
      playingNowCount: playingnowcount,
      completedCount,
      backlogCount,
      favorites,
      totalPlaytimeHours,
      completionRatePercentage,
    };
}
// game array
const Game: game[] = [
    {
        _id: "1",
        title: "Minecraft",
        genre: "Sandbox",
        platform: "PC",
        status: "Playing Now",
        Playtime: 20,
        lastplayed: new Date(),
        notes: "Survival",
        isFavorite:true,
    },
        {
        _id: "2",
        title: "Terraria",
        genre: "Sandbox",
        platform: "PC",
        status: "Completed",
        Playtime: 40,
        lastplayed: new Date(),
        notes: "Finished main progression",
        isFavorite:false,
    },
    {
        _id: "3",
        title: "Valorant",
        genre: "FPS",
        platform: "PC",
        status: "Completed",
        Playtime: 40,
        lastplayed: new Date(),
        notes: "Finished main progression",
        isFavorite:true,
    },
      {
        _id: "4",
        title: "Roblox",
        genre: "Simulator",
        platform: "PC",
        status: "Completed",
        Playtime: 40,
        lastplayed: new Date(),
        notes: "Finished main progression",
        isFavorite:true,
    },
      {
        _id: "5",
        title: "Mobile legends Bang Bang",
        genre: "MOBA",
        platform: "SmartPhone",
        status: "Completed",
        Playtime: 40,
        lastplayed: new Date(),
        notes: "Got a new hero",
        isFavorite:true,
    },
  ];
  
function getgames(): game [] {
  return Game;
}
console.log(getgames());
//Cari game
function getGameByID(id: string): game [] | undefined {
return Game;
}
