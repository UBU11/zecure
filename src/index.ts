import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { decryptFile } from "./utility/key";
import path from "node:path";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  decryptFile(
    path.resolve(__dirname, "data/esp32.json.enc"),
    path.resolve(__dirname, "data/esp32.json"),
  );

  res.sendFile(path.resolve(__dirname, "data/esp32.json"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
