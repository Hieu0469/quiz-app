'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type QuizSet = {
  id: string
  title: string
  description: string
  created_at: string
}

export default function Home() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('quiz_sets').select('*').order('created_at', { ascending: false })
      if (data) setQuizSets(data)
    }
    fetch()
  }, [])

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📝 Chọn bộ câu hỏi</h1>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
          Admin
        </Link>
      </div>

      {quizSets.length === 0 && (
        <p className="text-gray-400 text-center mt-20">Chưa có bộ câu hỏi nào.</p>
      )}

      <div className="space-y-4">
        {quizSets.map(set => (
          <Link key={set.id} href={`/quiz/${set.id}`}>
            <div className="border rounded-xl p-5 hover:border-blue-500 hover:shadow transition cursor-pointer">
              <h2 className="text-lg font-semibold">{set.title}</h2>
              {set.description && (
                <p className="text-gray-500 text-sm mt-1">{set.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}