const supabase = require('@supabase/supabase-js').createClient('http://127.0.0.1:54321', process.env.SUPABASE_KEY || 'fake');
async function test() {
  console.log("Starting test");
}
test();
