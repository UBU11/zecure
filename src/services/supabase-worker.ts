
import amqplib from "amqplib";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { decryptPayload } from "../utility/key";

const TAG        = "[supabase-worker]";
const RECONNECT_MS = 5_000;

interface MeterReading {
  device_id:    string;
  voltage:      number;
  current:      number;
  power:        number;
  power_factor: number;
  recorded_at:  string;
}

export async function startSupabaseWorker() {
  const AMQP_URL    = process.env.RABBITMQ_URL ?? "amqp://localhost";
  const QUEUE_NAME  = "meter_data";
  const SUPABASE_URL = "https://spryetddjmqrialeexih.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_API;

  if (!SUPABASE_KEY) {
    console.warn(`${TAG} SUPABASE_API environment variable is not defined - skipping Supabase insertion`);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  async function processPayload(raw: string): Promise<void> {
    let jsonStr = raw;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.EncryptedKey && parsed.iv && parsed.authTag) {
        jsonStr = decryptPayload(raw);
      }
    } catch (e: any) {
      const err = new Error(`Parse failed: ${e.message}`) as any;
      err.poison = true;
      throw err;
    }

    let rows: MeterReading[];
    try {
      const parsed = JSON.parse(jsonStr);
      const items  = Array.isArray(parsed) ? parsed : [parsed];

      rows = items.map((item) => ({
        device_id:    String(item.device_id   ?? "esp32"),
        voltage:      Number(item.voltage     ?? 0),
        current:      Number(item.current     ?? 0),
        power:        Number(item.power       ?? 0),
        power_factor: Number(item.power_factor ?? 1),
        recorded_at:  item.timestamp
                        ? new Date(item.timestamp).toISOString()
                        : new Date().toISOString(),
      }));
    } catch (e: any) {
      const err = new Error(`JSON parse failed: ${e.message}`) as any;
      err.poison = true;
      throw err;
    }

    const { error } = await supabase.from("meter_readings").insert(rows);

    if (error) {
      console.error(`${TAG} Supabase insert error:`, error.message);
      throw new Error(error.message);
    }

    console.log(`${TAG} ✓ Inserted ${rows.length} row(s) to Supabase`);
  }

  async function startConsumer(): Promise<void> {
    try {
      const conn    = await amqplib.connect(AMQP_URL);
      const channel = await conn.createChannel();

      await channel.assertQueue(QUEUE_NAME, { durable: true });
      channel.prefetch(1);   

      console.log(`${TAG} Connected to RabbitMQ — consuming "${QUEUE_NAME}"`);

      channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        const raw = msg.content.toString();

        try {
          await processPayload(raw);
          channel.ack(msg);                           
        } catch (err: any) {
          if (err.poison) {
            console.error(`${TAG} ☠ Poison message — discarding:`, err.message);
            channel.nack(msg, false, false);
          } else {
            channel.nack(msg, false, true);
          }
        }
      });

      conn.on("close", () => {
        setTimeout(startConsumer, RECONNECT_MS);
      });

    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
         console.warn(`${TAG} RabbitMQ connection refused at ${AMQP_URL}.`);
      } else {
         console.error(`${TAG} Failed to connect to RabbitMQ:`, err.message);
      }
      setTimeout(startConsumer, RECONNECT_MS);
    }
  }

  console.log(`${TAG} Starting…`);
  await startConsumer();
}

// if (import.meta.main) {
//   startSupabaseWorker().catch(console.error);
// }
