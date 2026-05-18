import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://spryetddjmqrialeexih.supabase.co", "sb_publishable_GF4PAo7n769f2EazzoWf0w_GUIYIUGK");
async function test() {
  const { data, error } = await supabase.from("user_dashboard").select("*").limit(5);
  console.log("Dashboard data:", data);
  console.log("Error:", error);
}
test();
