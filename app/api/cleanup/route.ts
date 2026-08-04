import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Dùng service role key để có quyền xóa tất cả user
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Bảo vệ endpoint — chỉ Vercel Cron mới được gọi
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Xóa các bài làm cũ hơn 30 ngày
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('quiz_results')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: `Đã xóa ${data?.length ?? 0} bài làm cũ hơn 30 ngày`,
    deletedAt: new Date().toISOString()
  })
}