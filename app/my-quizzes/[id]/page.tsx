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
  order_index: number
}

export default function EditQuiz() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])

  // Form thêm mới
  const [type, setType] = useState<'multiple_choice' | 'fill_in_blank'>('multiple_choice')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [fillAnswer, setFillAnswer] = useState('')
  const [explanation, setExplanation] = useState('')

  // Modal sửa
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editOptions, setEditOptions] = useState(['', '', '', ''])
  const [editCorrectIndex, setEditCorrectIndex] = useState(0)
  const [editFillAnswer, setEditFillAnswer] = useState('')
  const [editExplanation, setEditExplanation] = useState('')

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

  // Mở modal sửa và điền sẵn data
  function openEdit(q: Question) {
    setEditingQ(q)
    setEditQuestion(q.question)
    setEditExplanation(q.explanation || '')
    if (q.type === 'multiple_choice') {
      setEditOptions(q.options || ['', '', '', ''])
      setEditCorrectIndex(parseInt(q.correct_answer))
      setEditFillAnswer('')
    } else {
      setEditFillAnswer(q.correct_answer)
      setEditOptions(['', '', '', ''])
    }
  }

  async function saveEdit() {
    if (!editingQ) return
    if (!editQuestion.trim()) return alert('Nhập nội dung câu hỏi!')

    let opts = null
    let answer = ''

    if (editingQ.type === 'multiple_choice') {
      if (editOptions.some(o => !o.trim())) return alert('Điền đủ 4 đáp án!')
      opts = editOptions
      answer = String(editCorrectIndex)
    } else {
      const blankCount = editQuestion.split('___').length - 1
      const answers = editFillAnswer.split('|')
      if (blankCount === 0) return alert('Nhập ___ vào câu hỏi để tạo chỗ trống!')
      if (answers.some(a => !a.trim()) || answers.length < blankCount) {
        return alert(`Điền đủ đáp án cho ${blankCount} chỗ trống!`)
      }
      answer = editFillAnswer
    }

    await supabase.from('questions').update({
      question: editQuestion,
      options: opts,
      correct_answer: answer,
      explanation: editExplanation,
    }).eq('id', editingQ.id)

    setEditingQ(null)
    loadData()
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
      const blankCount = question.split('___').length - 1
      const answers = fillAnswer.split('|')
      if (blankCount === 0) return alert('Nhập ___ vào câu hỏi để tạo chỗ trống!')
      if (answers.some(a => !a.trim()) || answers.length < blankCount) {
        return alert(`Điền đủ đáp án cho ${blankCount} chỗ trống!`)
      }
      answer = fillAnswer
    }
    await supabase.from('questions').insert({
      quiz_set_id: id, type, question,
      options: opts, correct_answer: answer,
      explanation, order_index: questions.length,
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
          <h1 className="text-2xl font-bold mt-1">{quizTitle}</h1>
        </div>
        <Link href={`/quiz/${id}`}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          Xem bài test →
        </Link>
      </div>

      {/* Form thêm câu hỏi */}
      <div className="border rounded-xl p-5 mb-8 bg-gray-50">
        <h2 className="font-semibold mb-4 text-gray-900">Thêm câu hỏi mới</h2>
        <div className="flex gap-2 mb-4">
          {(['multiple_choice', 'fill_in_blank'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm border transition
                ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'}`}>
              {t === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền từ'}
            </button>
          ))}
        </div>
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          placeholder={type === 'fill_in_blank' ? 'Ví dụ: ___ là thủ đô của ___' : 'Nội dung câu hỏi *'}
          rows={2}
          className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 resize-none bg-white text-gray-900 placeholder-gray-400" />
        {type === 'multiple_choice' && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600 mb-2">Chọn đáp án đúng (●):</p>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input type="radio" name="correct" checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)} />
                <span className="text-sm font-medium text-gray-700 w-4">{['A','B','C','D'][i]}</span>
                <input value={opt} onChange={e => {
                  const arr = [...options]; arr[i] = e.target.value; setOptions(arr)
                }}
                  placeholder={`Đáp án ${['A','B','C','D'][i]}`}
                  className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400" />
              </div>
            ))}
          </div>
        )}
        {type === 'fill_in_blank' && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Dùng <code className="bg-gray-200 px-1 rounded">___</code> để đánh dấu chỗ trống</p>
            {question.includes('___') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  {question.split('___').length - 1} chỗ trống — nhập đáp án đúng:
                </p>
                <div className="space-y-2">
                  {Array.from({ length: question.split('___').length - 1 }).map((_, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-sm text-blue-600 w-16 shrink-0">Ô {i + 1}:</span>
                      <input value={fillAnswer.split('|')[i] || ''}
                        onChange={e => {
                          const parts = fillAnswer.split('|')
                          parts[i] = e.target.value
                          setFillAnswer(parts.join('|'))
                        }}
                        placeholder={`Đáp án ô ${i + 1}`}
                        className="flex-1 border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!question.includes('___') && (
              <p className="text-sm text-orange-500">⚠ Nhập ___ vào câu hỏi để tạo chỗ trống</p>
            )}
          </div>
        )}
        <input value={explanation} onChange={e => setExplanation(e.target.value)}
          placeholder="Giải thích đáp án (không bắt buộc)"
          className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400" />
        <button onClick={addQuestion}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg">+ Thêm câu hỏi</button>
      </div>

      {/* Danh sách câu hỏi */}
      <h2 className="font-semibold mb-3 text-gray-900">Câu hỏi ({questions.length})</h2>
      {questions.length === 0 && (
        <p className="text-gray-400 text-sm">Chưa có câu hỏi nào.</p>
      )}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-2 inline-block">
                  {q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền từ'}
                </span>
                <p className="font-medium text-gray-900">{i + 1}. {q.question}</p>
                <p className="text-sm text-green-600 mt-1">
                  ✓ {q.type === 'multiple_choice'
                    ? q.options?.[parseInt(q.correct_answer)]
                    : q.correct_answer}
                </p>
                {q.explanation && (
                  <p className="text-sm text-gray-400 mt-1">💡 {q.explanation}</p>
                )}
              </div>
              <div className="flex gap-3 ml-4 shrink-0">
                <button onClick={() => openEdit(q)}
                  className="text-blue-600 text-sm hover:underline">Sửa</button>
                <button onClick={() => deleteQuestion(q.id)}
                  className="text-red-500 text-sm hover:underline">Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal sửa câu hỏi */}
      {editingQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Sửa câu hỏi</h3>
              <button onClick={() => setEditingQ(null)}
                className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <textarea value={editQuestion} onChange={e => setEditQuestion(e.target.value)}
              rows={2} placeholder="Nội dung câu hỏi *"
              className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400" />

            {/* Sửa trắc nghiệm */}
            {editingQ.type === 'multiple_choice' && (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 mb-2">Chọn đáp án đúng (●):</p>
                {editOptions.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="radio" name="editCorrect" checked={editCorrectIndex === i}
                      onChange={() => setEditCorrectIndex(i)} />
                    <span className="text-sm font-medium text-gray-700 w-4">{['A','B','C','D'][i]}</span>
                    <input value={opt} onChange={e => {
                      const arr = [...editOptions]; arr[i] = e.target.value; setEditOptions(arr)
                    }}
                      placeholder={`Đáp án ${['A','B','C','D'][i]}`}
                      className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400" />
                  </div>
                ))}
              </div>
            )}

            {/* Sửa điền từ */}
            {editingQ.type === 'fill_in_blank' && (
              <div className="mb-4">
                {editQuestion.includes('___') ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-2">
                      {editQuestion.split('___').length - 1} chỗ trống:
                    </p>
                    <div className="space-y-2">
                      {Array.from({ length: editQuestion.split('___').length - 1 }).map((_, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-sm text-blue-600 w-16 shrink-0">Ô {i + 1}:</span>
                          <input value={editFillAnswer.split('|')[i] || ''}
                            onChange={e => {
                              const parts = editFillAnswer.split('|')
                              parts[i] = e.target.value
                              setEditFillAnswer(parts.join('|'))
                            }}
                            placeholder={`Đáp án ô ${i + 1}`}
                            className="flex-1 border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-orange-500">⚠ Nhập ___ vào câu hỏi để tạo chỗ trống</p>
                )}
              </div>
            )}

            <input value={editExplanation} onChange={e => setEditExplanation(e.target.value)}
              placeholder="Giải thích đáp án (không bắt buộc)"
              className="w-full border rounded-lg px-4 py-2 mb-6 outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400" />

            <div className="flex gap-3">
              <button onClick={saveEdit}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold">
                Lưu thay đổi
              </button>
              <button onClick={() => setEditingQ(null)}
                className="flex-1 py-3 border rounded-lg text-gray-700">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}