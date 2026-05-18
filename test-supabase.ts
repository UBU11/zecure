import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://spryetddjmqrialeexih.supabase.co", "sb_publishable_GF4PAo7n769f2EazzoWf0w_GUIYIUGK");
async function test() {
  const { data, error } = await supabase.from("meter_readings").select("*").limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}
test();
