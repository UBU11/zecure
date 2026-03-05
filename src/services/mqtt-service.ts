import mqtt from "mqtt";
import { simulatorEvents } from "../utility/esp32_simulator";
import { encryptJsonFile } from "../utility/key";
import fs from "fs";
import path from "path";

export async function startMqttService() {
  const protocol = "mqtt";
  const host = process.env.MQTT_HOST ?? "localhost";
  const port = "1883";
  const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
  const connectUrl = `${protocol}://${host}:${port}`;

  console.log(`[MQTT] Connecting to ${connectUrl}...`);

  const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: "client1",
    password: "public",
    reconnectPeriod: 5000,
  });

  const topic = "esp32/data"


  simulatorEvents.on("data", async (data) => {
    if (!client.connected) return;

    try {
      const dataPath = path.resolve(__dirname, "../data/esp32.json.enc");
      if (fs.existsSync(dataPath)) {
        const encodedFile = fs.readFileSync(dataPath, "utf8");
        client.publish(
          topic,
          encodedFile,
          { qos: 1, retain: false },
          (err) => {
            if (err) console.error("[MQTT] Publish error:", err.message);
          },
        );
      }
    } catch (e) {
      console.error("[MQTT] Failed to publish event data:", e);
    }
  });

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker successfully");
  });

  client.on("message", (topic, message) => {
    console.log(`[MQTT] Received message on topic ${topic}`);
  });

  client.on('error', (err: any) => {
    // Only log essential info to reduce noise
    if (err.code === 'ECONNREFUSED') {
      const target = err.address ? `${err.address}:${err.port}` : connectUrl;
      console.warn(`[MQTT] Connection refused at ${target}. Is the broker running?`);
    } else {
      console.error('[MQTT] error:', err.message || err);
    }
  });
}

// if (import.meta.main) {
//   startMqttService().catch(console.error);
// }

