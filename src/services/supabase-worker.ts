
import amqplib from "amqplib";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { decryptPayload } from "../utility/key";

const AMQP_URL    = process.env.RABBITMQ_URL ?? "amqp://localhost";
const QUEUE_NAME  = "meter_data";
const RECONNECT_MS = 5_000;

const SUPABASE_URL = "https://spryetddjmqrialeexih.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_API;

if (!SUPABASE_KEY) throw new Error("SUPABASE_API environment variable is not defined");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TAG = "[supabase-worker]";



interface MeterReading {
  device_id:    string;
  voltage:      number;
  current:      number;
  power:        number;
  power_factor: number;
  recorded_at:  string;
}

async function processPayload(raw: string): Promise<void> {
  let jsonStr = raw;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.EncryptedKey && parsed.iv && parsed.authTag) {
      console.log(`${TAG} Encrypted payload — decrypting…`);
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

    for (const r of rows) {
      if (!isFinite(r.voltage) || !isFinite(r.current) || !isFinite(r.power)) {
        const err = new Error(`Non-finite values in row: ${JSON.stringify(r)}`) as any;
        err.poison = true;
        throw err;
      }
    }
  } catch (e: any) {
    if (e.poison) throw e;                       
    const err = new Error(`JSON parse failed: ${e.message}`) as any;
    err.poison = true;
    throw err;
  }

  const { error } = await supabase.from("meter_readings").insert(rows);

  if (error) {
    console.error(`${TAG} Supabase insert error:`, error.message, error.code);
    throw new Error(error.message);
  }

  console.log(
    `${TAG} ✓ Inserted ${rows.length} row(s) — ` +
    `device=${rows[0]?.device_id} power=${rows[0]?.power}W ` +
    `at=${rows[0]?.recorded_at}`
  );
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
        channel.ack(msg);                           // success
      } catch (err: any) {
        if (err.poison) {
          console.error(`${TAG} ☠ Poison message — discarding:`, err.message);
          channel.nack(msg, false, false);
        } else {
          console.warn(`${TAG} Transient error — nacking (requeue):`, err.message);
          channel.nack(msg, false, true);
        }
      }
    });

    conn.on("close", () => {
      console.warn(`${TAG} RabbitMQ connection closed — reconnecting in ${RECONNECT_MS / 1000} s`);
      setTimeout(startConsumer, RECONNECT_MS);
    });

    conn.on("error", (err: Error) => {
      console.error(`${TAG} RabbitMQ connection error:`, err.message);
    });

  } catch (err: any) {
    console.error(`${TAG} Failed to connect to RabbitMQ:`, err.message);
    console.log(`${TAG} Retrying in ${RECONNECT_MS / 1000} s…`);
    setTimeout(startConsumer, RECONNECT_MS);
  }
}



console.log(`${TAG} Starting…`);
startConsumer();
