import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const { error } = await supabase.from('trips').delete().in('id', [
    'a5ae3f2d-276f-4c3e-85f8-d8da05abeb60',
    '9d01aaee-a56b-4300-b1c1-e6f2451b72c4',
    '9cd875dd-07b6-4c4d-abf1-a319548f6317'
  ])
  if (error) console.error(error)
  else console.log('Deleted successfully')
}
run()
