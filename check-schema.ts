import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://spryetddjmqrialeexih.supabase.co", "sb_publishable_GF4PAo7n769f2EazzoWf0w_GUIYIUGK");
async function test() {
  // Try to insert a row with a fake user ID to see what fails
  const { data, error } = await supabase.from("user_dashboard").insert({ user_id: 'fake_user_123' }).select();
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
