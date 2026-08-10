'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function updateBenchmarkProgress(studentId: string, benchmarkId: string, status: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('benchmark_progress')
    .upsert({
      student_id: studentId,
      benchmark_id: benchmarkId,
      status
    }, {
      onConflict:'student_id, benchmark_id'
    })

  if (error) {
    console.error("Benchmark update error:", error)
    throw new Error("Failed to update benchmark status")
  }

  revalidatePath('/benchmarks')
}
