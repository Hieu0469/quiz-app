'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

type QuizSet = { id: string; title: string; description: string; created_at: string }

export default function MyQuizzes() {
  const [user, setUser] = useState<User | null>(null)
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else { setUser(data.user); loadMyQuizzes(data.user.id) }
    })
  }, [])

  async function loadMyQuizzes(uid: string) {
    const { data } = await supabase.from('quiz_sets').select('*')
      .eq('owner_id', uid).order('created_at', { ascending: false })
    if (data) setQuizSets(data)
  }

  async function deleteSet(id: string) {
    if (!confirm('Xóa bộ câu hỏi này? Tất cả câu hỏi sẽ bị xóa!')) return
    await supabase.from('quiz_sets').delete().eq('id', id)
    if (user) loadMyQuizzes(user.id)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Bộ câu hỏi của tôi</h1>
        <Link href="/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          + Tạo mới
        </Link>
      </div>

      {quizSets.length === 0 && (
        <p className="text-gray-400 text-center mt-20">
          Bạn chưa tạo bộ câu hỏi nào.
        </p>
      )}

      <div className="space-y-4">
        {quizSets.map(set => (
          <div key={set.id} className="border rounded-xl p-5 flex justify-between items-center">
            <div>
              <h2 className="font-semibold">{set.title}</h2>
              {set.description && <p className="text-sm text-gray-500 mt-1">{set.description}</p>}
            </div>
            <div className="flex gap-3 ml-4 shrink-0">
              <Link href={`/my-quizzes/${set.id}`}
                className="text-blue-600 text-sm hover:underline">Sửa</Link>
              <Link href={`/quiz/${set.id}`}
                className="text-gray-600 text-sm hover:underline">Xem</Link>
              <button onClick={() => deleteSet(set.id)}
                className="text-red-500 text-sm hover:underline">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}