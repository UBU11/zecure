import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { decryptPayload } from "../utility/key";

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
  let finalData: string = payload;
  let isEncrypted = false;

  try {
    const parsed = JSON.parse(payload);
    if (parsed.EncryptedKey && parsed.iv && parsed.authTag) {
      console.log("Detected encrypted payload, decrypting...");
      finalData = decryptPayload(payload);
      isEncrypted = true;
    }
  } catch (e:any) {
    console.error("Failed to parse payload:", e.message);
  }

  const fileName = `data_${Date.now()}${isEncrypted ? '_decrypted' : ''}.json`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from("FIle Bucket")
    .upload(fileName, finalData, {
      cacheControl: "3600",
      contentType: "application/json",
      upsert: true,
    });

  if (storageError) {
    console.error("Storage upload error:", storageError);
  } else {
    console.log("Storage upload successful:", storageData.path);
  }


  if (isEncrypted) {
    try {
      const parsed = JSON.parse(finalData);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      
      const insertData = rows.map(item => ({
        device_id: item.device_id,
        voltage: item.voltage,
        current: item.current,
        power: item.power,
        power_factor: item.power_factor,
        recorded_at: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
      }));

      const { error: dbError } = await supabase
        .from("meter_readings")
        .insert(insertData);
      
      if (dbError) {
        console.warn("Database insert failed:", dbError.message);
      } else {
        console.log(`Database record(s) inserted successfully: ${insertData.length} row(s)`);
      }
    } catch (e) {
      console.error("Failed to parse or insert decrypted data:", e);
    }
  }

  return storageData;
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
