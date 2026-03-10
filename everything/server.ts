import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import userRouter from "./server/routes/user";
import synthesisRouter from "./server/routes/synthesis";
import gachaRouter from "./server/routes/gacha";
import exploreRouter from "./server/routes/explore";
import taskRouter from "./server/routes/task";
import arenaRouter from "./server/routes/arena";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // ==========================================
  // 2. 服务端核心模块框架 (根据思维导图)
  // ==========================================

  // 2.4.1 用户模块
  app.use("/api/user", userRouter);
  app.use("/api/task", taskRouter);

  // 2.4.2 宇宙探索模块
  app.use("/api/explore", exploreRouter);

  // 2.4.3 合成模块
  app.use("/api", synthesisRouter);

  // 2.4.4 战斗模块
  app.post("/api/battle/start", (req, res) => res.json({ status: "pending" }));

  // 2.4.5 卡牌模块
  app.get("/api/cards/library", (req, res) => res.json({ status: "pending" }));
  app.use("/api/gacha", gachaRouter);

  // 2.4.6 拍卖行模块
  app.get("/api/auction/list", (req, res) => res.json({ status: "pending" }));

  // 2.4.7 炼金模块
  app.post("/api/alchemy/decompose", (req, res) => res.json({ status: "pending" }));

  // 2.4.8 赛季模块
  app.use("/api/arena", arenaRouter);

  // Socket.io connection
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("card_created", (data) => {
      // Broadcast to all other clients
      socket.broadcast.emit("global:card_created", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
