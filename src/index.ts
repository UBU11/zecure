import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";


console.log("Backend Orchestrator");

const services = [
  { name: "ESP32 Simulator",   path: "./src/utility/esp32_simulator.ts" },
  { name: "MQTT Service",      path: "./src/services/mqtt-service.ts" },
  { name: "RabbitMQ Worker",   path: "./src/services/rabbitmq-worker.ts" },
  { name: "Supabase Worker",   path: "./src/services/supabase-worker.ts" },
];

const processes: any[] = [];

services.forEach(service => {
  console.log(`[Orchestrator] Spawning ${service.name}...`);
  const proc = Bun.spawn(["bun", service.path], {
    stdout: "inherit",
    stderr: "inherit",
  });
  processes.push(proc);
});


process.on("SIGINT", () => {
  console.log("\n[Orchestrator] Shutting down services...");
  processes.forEach(p => p.kill());
  process.exit();
});


const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/status", (req, res) => {
  res.json({ status: "online", services: services.map(s => s.name) });
});

server.listen(3000, () => {
  console.log("[Orchestrator] Control server running at http://localhost:3000");
});
