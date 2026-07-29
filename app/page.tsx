'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type QuizSet = {
  id: string
  title: string
  description: string
  owner_name: string
  created_at: string
}

export default function Home() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quiz_sets')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setQuizSets(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-center mt-20 text-gray-400">Đang tải...</p>

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-2">Tất cả bộ câu hỏi</h1>
      <p className="text-gray-500 mb-8">Chọn một bộ câu hỏi để bắt đầu làm bài</p>

      {quizSets.length === 0 && (
        <p className="text-center text-gray-400 mt-20">
          Chưa có bộ câu hỏi nào. Đăng nhập để tạo bộ đầu tiên!
        </p>
      )}

      <div className="space-y-4">
        {quizSets.map(set => (
          <Link key={set.id} href={`/quiz/${set.id}`}>
            <div className="border rounded-xl p-5 hover:border-blue-500 hover:shadow transition cursor-pointer">
              <h2 className="text-lg font-semibold">{set.title}</h2>
              {set.description && (
                <p className="text-gray-500 text-sm mt-1">{set.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">Tạo bởi {set.owner_name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}