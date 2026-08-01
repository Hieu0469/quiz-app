'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Result = {
  id: string
  quiz_title: string
  quiz_set_id: string
  score: number
  total: number
  created_at: string
  answers: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }[]
}

export default function History() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      loadHistory()
    })
  }, [])

  async function loadHistory() {
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setResults(data)
    setLoading(false)
  }

  if (loading)
    return <p className="text-center mt-20 text-gray-400">Đang tải...</p>

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-8">📊 Lịch sử làm bài</h1>

      {results.length === 0 && (
        <div className="text-center mt-20">
          <p className="text-gray-400 mb-4">Bạn chưa làm bài nào.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Xem các bộ câu hỏi →
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {results.map(r => (
          <div key={r.id} className="border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div>
                <p className="font-semibold">{r.quiz_title}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {new Date(r.created_at).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold
                  ${r.score === r.total ? 'text-green-500'
                    : r.score >= r.total / 2 ? 'text-blue-500'
                    : 'text-red-500'}`}>
                  {r.score}/{r.total}
                </p>
                <p className="text-sm text-gray-400">
                  {Math.round((r.score / r.total) * 100)}%
                </p>
              </div>
            </div>

            {/* Chi tiết từng câu */}
            {expanded === r.id && (
              <div className="border-t px-4 pb-4 pt-3 bg-gray-50 space-y-3">
                {r.answers.map((a, i) => (
                  <div key={i} className={`rounded-lg p-3 border text-sm
                    ${a.isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <p className="font-medium text-gray-800 mb-1">
                      {a.isCorrect ? '✓' : '✗'} Câu {i + 1}: {a.question}
                    </p>
                    <p className={a.isCorrect ? 'text-green-700' : 'text-red-600'}>
                      Bạn chọn: {a.userAnswer}
                    </p>
                    {!a.isCorrect && (
                      <p className="text-green-700">Đáp án đúng: {a.correctAnswer}</p>
                    )}
                  </div>
                ))}
                <Link href={`/quiz/${r.quiz_set_id}`}
                  className="inline-block mt-2 text-blue-600 text-sm hover:underline">
                  Làm lại bài này →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}