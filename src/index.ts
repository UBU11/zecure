import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { startSimulator } from "./utility/esp32_simulator";
import { startMqttService } from "./services/mqtt-service";
import { startRabbitMQWorker } from "./services/rabbitmq-worker";
import { startSupabaseWorker } from "./services/supabase-worker";

console.log("=========================================");
console.log("   Zecure Backend Orchestrator v2.0    ");
console.log("      (Single Process Architecture)      ");
console.log("=========================================");

const services = [
  { name: "ESP32 Simulator",   start: () => startSimulator() },
  { name: "MQTT Service",      start: () => startMqttService() },
  { name: "RabbitMQ Worker",   start: () => startRabbitMQWorker() },
  { name: "Supabase Worker",   start: () => startSupabaseWorker() },
];

console.log("[Orchestrator] Starting components...");

services.forEach(async (service) => {
  try {
    console.log(`[Orchestrator] -> Launching ${service.name}`);
    service.start();
  } catch (err) {
    console.error(`[Orchestrator] [ERROR] Failed to launch ${service.name}:`, err);
  }
});


setInterval(() => {
  const mem = process.memoryUsage().rss / 1024 / 1024;
  console.log(`[Orchestrator] Heartbeat - Uptime: ${Math.floor(process.uptime())}s | Memory: ${mem.toFixed(2)}MB`);
}, 30000);

process.on("SIGINT", () => {
  console.log("\n[Orchestrator] Graceful shutdown initiated...");
  process.exit(0);
});

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.json({ message: "Zecure API is running" });
});

app.get("/status", (req, res) => {
  res.json({ 
    status: "online", 
    mode: "single-process",
    services: services.map(s => s.name),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    node: process.version,
    platform: process.platform
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Orchestrator] API Server running at http://localhost:${PORT}`);
  console.log(`[Orchestrator] Check status at http://localhost:${PORT}/status`);
});
