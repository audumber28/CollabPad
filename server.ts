import { createServer } from "http";
import next from "next";
import { Server, Socket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let connectedCount = 0;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handler(req, res);
  });

  const io = new Server(httpServer);

  io.on("connection", (socket: Socket) => {
    console.log("✅ User connected:", socket.id);

    connectedCount++;
    io.emit("user count update", connectedCount);

    socket.on("request user count", () => {
      socket.emit("user count update", connectedCount);
    });

    socket.on("user joined", (data: { username: string }) => {
      io.emit("user count update", connectedCount);
      console.log(`👤 User ${data.username} joined (total: ${connectedCount})`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      connectedCount = Math.max(0, connectedCount - 1);
      io.emit("user count update", connectedCount);
    });

    socket.on("clear", () => {
      io.emit("clear");
      console.log("Canvas cleared by user:", socket.id);
    });

    socket.on("draw", (data) => {
      io.emit("draw", data); // broadcast to everyone (including sender)
    });

    socket.on("chat message", (msg) => {
      io.emit("chat message", msg);
    });

    socket.on("typing", (data) => {
      socket.broadcast.emit("typing", data);
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server ready at http://${hostname}:${port}`);
  });
});
