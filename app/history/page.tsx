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
  const [selected, setSelected] = useState<Result | null>(null)
  const [deleting, setDeleting] = useState(false)
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
    if (data) {
      setResults(data)
      if (data.length > 0) setSelected(data[0])
    }
    setLoading(false)
  }

  async function deleteOne(id: string) {
    if (!confirm('Xóa bài làm này?')) return
    setDeleting(true)
    await supabase.from('quiz_results').delete().eq('id', id)
    const updated = results.filter(r => r.id !== id)
    setResults(updated)
    setSelected(updated.length > 0 ? updated[0] : null)
    setDeleting(false)
  }

  async function deleteAll() {
    if (!confirm('Xóa toàn bộ lịch sử? Không thể hoàn tác!')) return
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('quiz_results').delete().eq('user_id', user.id)
    }
    setResults([])
    setSelected(null)
    setDeleting(false)
  }

  if (loading)
    return <p className="text-center mt-20 text-gray-400">Đang tải...</p>

  if (results.length === 0)
    return (
      <div className="text-center mt-20">
        <p className="text-gray-400 mb-4">Bạn chưa có lịch sử làm bài nào.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Xem các bộ câu hỏi →
        </Link>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Lịch sử làm bài</h1>
        <button onClick={deleteAll} disabled={deleting}
          className="px-4 py-2 border border-red-400 text-red-500 rounded-lg text-sm hover:bg-red-50 disabled:opacity-40 transition">
          🗑 Xóa tất cả
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-160px)]">

        {/* Cột trái — danh sách */}
        <div className="w-80 shrink-0 overflow-y-auto space-y-3 pr-2">
          {results.map(r => (
            <div key={r.id}
              onClick={() => setSelected(r)}
              className={`border rounded-xl p-4 cursor-pointer transition group relative
                ${selected?.id === r.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-400'}`}>

              {/* Nút xóa từng bài */}
              <button
                onClick={e => { e.stopPropagation(); deleteOne(r.id) }}
                disabled={deleting}
                className="absolute top-3 right-3 w-6 h-6 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                ✕
              </button>

              <p className="font-semibold text-sm text-gray-900 truncate pr-6">{r.quiz_title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(r.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-lg font-bold
                  ${r.score === r.total ? 'text-green-500'
                    : r.score >= r.total / 2 ? 'text-blue-500'
                    : 'text-red-500'}`}>
                  {r.score}/{r.total}
                </span>
                <span className="text-sm text-gray-400">
                  {Math.round((r.score / r.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full transition-all
                  ${r.score === r.total ? 'bg-green-500'
                    : r.score >= r.total / 2 ? 'bg-blue-500'
                    : 'bg-red-500'}`}
                  style={{ width: `${(r.score / r.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Cột phải — chi tiết */}
        <div className="flex-1 overflow-y-auto border rounded-xl p-6">
          {selected ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.quiz_title}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(selected.created_at).toLocaleDateString('vi-VN', {
                      weekday: 'long', day: '2-digit', month: '2-digit',
                      year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => deleteOne(selected.id)}
                    disabled={deleting}
                    className="px-3 py-2 border border-red-400 text-red-500 rounded-lg text-sm hover:bg-red-50 disabled:opacity-40 transition">
                    🗑 Xóa bài này
                  </button>
                  <Link href={`/quiz/${selected.quiz_set_id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                    Làm lại →
                  </Link>
                </div>
              </div>

              {/* Tổng kết */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">{selected.score}</p>
                  <p className="text-sm text-gray-400 mt-1">Câu đúng</p>
                </div>
                <div className="border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-500">{selected.total - selected.score}</p>
                  <p className="text-sm text-gray-400 mt-1">Câu sai</p>
                </div>
                <div className="border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-500">
                    {Math.round((selected.score / selected.total) * 100)}%
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Tỉ lệ đúng</p>
                </div>
              </div>

              {/* Chi tiết từng câu */}
              <h3 className="font-semibold text-gray-700 mb-3">Chi tiết từng câu</h3>
              <div className="space-y-3">
                {selected.answers.map((a, i) => (
                  <div key={i} className={`rounded-xl p-4 border
                    ${a.isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex gap-2 items-start">
                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${a.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {a.isCorrect ? '✓' : '✗'}
                      </span>
                      <p className="font-medium text-gray-900 text-sm">Câu {i + 1}: {a.question}</p>
                    </div>
                    <div className="ml-8 mt-2 space-y-1">
                      <p className={`text-sm ${a.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                        Bạn chọn: <span className="font-medium">{a.userAnswer}</span>
                      </p>
                      {!a.isCorrect && (
                        <p className="text-sm text-green-700">
                          Đáp án đúng: <span className="font-medium">{a.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 mt-20">
              Chọn một bài làm để xem chi tiết
            </p>
          )}
        </div>
      </div>
    </div>
  )
}