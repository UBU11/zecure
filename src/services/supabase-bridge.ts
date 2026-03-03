import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const protocol = "mqtt";
const host = "localhost";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `${protocol}://${host}:${port}`;

const topic = "esp32/data";

const supabaseUrl = "https://spryetddjmqrialeexih.supabase.co";
const supabaseKey = process.env.SUPABASE_API;

if(!supabaseKey){
  throw new Error("SUPABASE_KEY environment variable is not defined");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const uploadFile = async (payload: string) => {
  const fileName = `data_${Date.now()}.json`;
  const { data, error } = await supabase.storage
    .from("FIle Bucket")
    .upload(fileName, payload, {
      cacheControl: "3600",
      contentType: "application/json",
      upsert: true,
    });


  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  console.log("File uploaded successfully:", data.path);
  return data;
};

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "client1",
  password: "public",
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe(topic, (err) => {
    if (err) {
      console.error("MQTT Subscribe error:", err);
    } else {
      console.log("Subscribed to MQTT topic:", topic);
    }
  });
});

client.on("message", (topic, message) => {
  const payload = message.toString();
  console.log(`Received MQTT message on ${topic}:`, payload);
  uploadFile(payload).catch(console.error);
});

client.on("error", (err) => {
  console.error("MQTT error:", err);
  client.reconnect();
});


const channel = supabase
  .channel("any")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "esp32_data" }, 
    (payload) => {
      console.log("Supabase Change received!", payload);
      client.publish("esp32/commands", JSON.stringify(payload.new));
    }
  )
  .subscribe((status) => {
    console.log("Supabase subscription status:", status);
  });
