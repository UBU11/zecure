import mqtt from "mqtt";

const protocol = "mqtt";
const host = "localhost";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const connectUrl = `${protocol}://${host}:${port}`;

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "client1",
  password: "public",
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  console.log("Connected");

  client.subscribe("node", (error) => {
    if (error) {
      console.error("Subcribe error: ", error);
    }

    client.publish(
      "node",
      "Hello MQTT Client",
      { qos: 1, retain: false },
      (err) => {
        if (err) {
          console.error("publish error: ", err);
        }
      },
    );
  });
});

client.on("message", (topic, message) => {
  console.log("Message: ", message.toString());
  client.end;
});
