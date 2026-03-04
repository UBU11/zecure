

import mqtt, { MqttClient } from "mqtt";
import amqplib from "amqplib";
import "dotenv/config";

const MQTT_URL   = process.env.MQTT_URL ?? "mqtt://localhost:1883";
const MQTT_TOPIC = "esp32/data";
const AMQP_URL   = process.env.RABBITMQ_URL ?? "amqp://localhost";
const QUEUE_NAME = "meter_data";
const TAG        = "[rabbitmq-worker]";
const RECONNECT_MS = 5_000;


let amqpChannel:  amqplib.Channel | null = null;
let mqttClient:   MqttClient | null = null;
let draining      = false;
const pending: Buffer[] = []; 



async function connectRabbitMQ(): Promise<void> {
  try {
    const conn    = await amqplib.connect(AMQP_URL);
    const channel = await conn.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    while (pending.length > 0) {
      const buf = pending.shift()!;
      channel.sendToQueue(QUEUE_NAME, buf, { persistent: true, contentType: "application/json" });
    }

    amqpChannel = channel;
    draining    = false;
    console.log(`${TAG} RabbitMQ ready. Queue: "${QUEUE_NAME}"`);
    startMqtt();

    conn.on("close", () => {
      console.warn(`${TAG} RabbitMQ connection closed — reconnecting in ${RECONNECT_MS / 1000} s`);
      amqpChannel = null;
      setTimeout(connectRabbitMQ, RECONNECT_MS);
    });

    conn.on("error", (err: Error) => {
      console.error(`${TAG} RabbitMQ connection error:`, err.message);
    });

  } catch (err: any) {
    console.error(`${TAG} Failed to connect to RabbitMQ:`, err.message);
    setTimeout(connectRabbitMQ, RECONNECT_MS);
  }
}


function startMqtt(): void {
  if (mqttClient) {

    mqttClient.subscribe(MQTT_TOPIC, { qos: 1 }, () => {});
    return;
  }

  mqttClient = mqtt.connect(MQTT_URL, {
    clientId:       `rmq_producer_${Math.random().toString(16).slice(2, 8)}`,
    clean:          true,
    connectTimeout: 4000,
    username:       "client1",
    password:       "public",
    reconnectPeriod: 3000,
  });

  mqttClient.on("connect", () => {
    console.log(`${TAG} MQTT connected — subscribing to "${MQTT_TOPIC}"`);
    mqttClient!.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
      if (err) console.error(`${TAG} MQTT subscribe error:`, err);
    });
  });

  mqttClient.on("message", (_topic: string, message: Buffer) => {
    publishToRabbitMQ(message);
  });

  mqttClient.on("error",     (err) => console.error(`${TAG} MQTT error:`, err.message));
  mqttClient.on("reconnect", ()    => console.log(`${TAG} MQTT reconnecting…`));
}

function publishToRabbitMQ(payload: Buffer): void {
  if (!amqpChannel) {
    pending.push(payload);
    if (pending.length === 1) {
      console.warn(`${TAG} RabbitMQ not ready — buffering messages (${pending.length} queued)`);
    }
    return;
  }

  if (draining) {
    pending.push(payload);
    return;
  }

  const sent = amqpChannel.sendToQueue(QUEUE_NAME, payload, {
    persistent:  true,
    contentType: "application/json",
    timestamp:   Math.floor(Date.now() / 1000),
  });

  if (!sent) {
    draining = true;
    pending.push(payload);
    amqpChannel.once("drain", () => {
      draining = false;
      console.log(`${TAG} RabbitMQ drain — flushing ${pending.length} buffered message(s)`);
      while (pending.length > 0 && amqpChannel) {
        amqpChannel.sendToQueue(QUEUE_NAME, pending.shift()!, {
          persistent:  true,
          contentType: "application/json",
        });
      }
    });
  } else {
    console.log(`${TAG} → RabbitMQ: ${payload.length} bytes`);
  }
}

console.log(`${TAG} Starting…`);
connectRabbitMQ();  
