'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

type Question = {
  id: string
  type: string
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
}

export default function EditQuiz() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])

  // Form state
  const [type, setType] = useState<'multiple_choice' | 'fill_in_blank'>('multiple_choice')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [fillAnswer, setFillAnswer] = useState('')
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setUser(data.user)
    })
    loadData()
  }, [])

  async function loadData() {
    const { data: set } = await supabase
      .from('quiz_sets').select('title').eq('id', id).single()
    if (set) setQuizTitle(set.title)

    const { data: qs } = await supabase
      .from('questions').select('*')
      .eq('quiz_set_id', id).order('order_index')
    if (qs) setQuestions(qs)
  }

  async function addQuestion() {
    if (!question.trim()) return alert('Nhập nội dung câu hỏi!')

    let opts = null
    let answer = ''

    if (type === 'multiple_choice') {
      if (options.some(o => !o.trim())) return alert('Điền đủ 4 đáp án!')
      opts = options
      answer = String(correctIndex)
    } else {
      if (!fillAnswer.trim()) return alert('Nhập đáp án!')
      answer = fillAnswer.trim()
    }

    await supabase.from('questions').insert({
      quiz_set_id: id,
      type,
      question,
      options: opts,
      correct_answer: answer,
      explanation,
      order_index: questions.length,
    })

    setQuestion(''); setOptions(['', '', '', ''])
    setCorrectIndex(0); setFillAnswer(''); setExplanation('')
    loadData()
  }

  async function deleteQuestion(qid: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    await supabase.from('questions').delete().eq('id', qid)
    loadData()
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => router.push('/my-quizzes')}
            className="text-blue-600 text-sm hover:underline">← Quay lại</button>
          <h1 className="text-2xl font-bold mt-1 text-white">{quizTitle}</h1>
        </div>
        <Link href={`/quiz/${id}`}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 text-white">
          Xem bài test →
        </Link>
      </div>

      {/* Form thêm câu hỏi */}
      <div className="border rounded-xl p-5 mb-8 bg-gray-50">
        <h2 className="font-semibold mb-4 text-gray-900">Thêm câu hỏi mới</h2>

        {/* Chọn loại câu hỏi */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setType('multiple_choice')}
            className={`px-4 py-2 rounded-lg text-sm border transition
              ${type === 'multiple_choice'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-700'}`}>
            Trắc nghiệm
          </button>
          <button onClick={() => setType('fill_in_blank')}
            className={`px-4 py-2 rounded-lg text-sm border transition
              ${type === 'fill_in_blank'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-700'}`}>
            Điền từ
          </button>
        </div>

        {/* Nội dung câu hỏi */}
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          placeholder={
            type === 'fill_in_blank'
              ? 'Ví dụ: Thủ đô của Việt Nam là ___'
              : 'Nội dung câu hỏi *'
          }
          rows={2}
          className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 resize-none bg-white text-gray-900 placeholder-gray-400" />

        {/* Trắc nghiệm */}
        {type === 'multiple_choice' && (
          <>
            <p className="text-sm text-gray-600 mb-2">Chọn đáp án đúng (●) và điền nội dung:</p>
            <div className="space-y-2 mb-4">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input type="radio" name="correct" checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)} className="w-4 h-4" />
                  <span className="font-medium text-sm w-4 text-gray-700">
                    {['A', 'B', 'C', 'D'][i]}
                  </span>
                  <input value={opt} onChange={e => {
                    const arr = [...options]; arr[i] = e.target.value; setOptions(arr)
                  }}
                    placeholder={`Đáp án ${['A', 'B', 'C', 'D'][i]}`}
                    className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Điền từ */}
        {type === 'fill_in_blank' && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Đáp án đúng:</p>
            <input value={fillAnswer} onChange={e => setFillAnswer(e.target.value)}
              placeholder="Ví dụ: Hà Nội"
              className="w-full border rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400" />
            <p className="text-xs text-gray-400 mt-1">
              * Hệ thống sẽ bỏ qua hoa/thường khi chấm điểm
            </p>
          </div>
        )}

        {/* Giải thích */}
        <input value={explanation} onChange={e => setExplanation(e.target.value)}
          placeholder="Giải thích đáp án (không bắt buộc)"
          className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400" />

        <button onClick={addQuestion}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          + Thêm câu hỏi
        </button>
      </div>

      {/* Danh sách câu hỏi */}
      <h2 className="font-semibold mb-3 text-white">Câu hỏi ({questions.length})</h2>
      {questions.length === 0 && (
        <p className="text-gray-400 text-sm">Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên!</p>
      )}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="border rounded-xl p-4 flex justify-between items-start">
            <div className="flex-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-1 inline-block">
                {q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền từ'}
              </span>
              <p className="font-medium text-white">{i + 1}. {q.question}</p>
              <p className="text-sm text-green-400 mt-1">
                ✓ {q.type === 'multiple_choice'
                  ? q.options?.[parseInt(q.correct_answer)]
                  : q.correct_answer}
              </p>
            </div>
            <button onClick={() => deleteQuestion(q.id)}
              className="text-red-500 text-sm hover:underline ml-4 shrink-0">Xóa</button>
          </div>
        ))}
      </div>
    </div>
  )
}