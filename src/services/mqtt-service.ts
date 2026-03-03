import mqtt from "mqtt";
import * as fs from "fs";
import * as path from "path";

const protocol = "mqtt";
const host = "localhost";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `${protocol}://${host}:${port}`;

const encodedFile = fs.readFileSync(path.resolve(__dirname, "../data/esp32.json.enc"), "utf8");



const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "client1",
  password: "public",
  reconnectPeriod: 1000,
});

const publishData = () => {
  console.log("Publishing data to MQTT...");
  client.publish(
    "esp32/data",
    encodedFile,
    { qos: 1, retain: false },
    (err) => {
      if (err) {
        console.error("publish error: ", err);
      } else {
        console.log("Data published successfully at:", new Date().toISOString());
      }
    },
  );
};

client.on("connect", () => {
  console.log("Connected");
  
  publishData();

  setInterval(() => {
    publishData();
  }, 3600000);
});

client.on("message", (topic, message) => {
  console.log(`Received message on topic ${topic}:`, message.toString());

});

client.on('error', (err)=>{
  console.log('mqtt error: ',err)
  client.reconnect()
})
