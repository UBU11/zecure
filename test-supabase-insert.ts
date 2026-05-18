import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://spryetddjmqrialeexih.supabase.co", "sb_publishable_GF4PAo7n769f2EazzoWf0w_GUIYIUGK");
async function test() {
  const row = {
    device_id: "test",
    voltage: 220,
    current: 1,
    power: 220,
    power_factor: 1,
    recorded_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from("meter_readings").insert([row]);
  console.log("Data:", data);
  console.log("Error:", error);
}
test();
