import mqtt from "mqtt";

const protocol = "ws";
const host = "localhost";
const port = "8083";
const path = "/mqtt";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const connectUrl = `${protocol}://${host}:${port}${path}`;

const wsClient = mqtt.connect(connectUrl, {
  clientId,
  keepalive: 30,
  clean: true,
  connectTimeout: 4000,
  username: "client1",
  password: "public",
  reconnectPeriod: 1000,
});
