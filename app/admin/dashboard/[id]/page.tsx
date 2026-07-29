'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth'
import { useRouter, useParams } from 'next/navigation'

type Question = {
  id: string
  type: string
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
  order_index: number
}

type QuizSet = { id: string; title: string }

export default function EditQuizSet() {
  const { id } = useParams()
  const router = useRouter()
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  // Form state
  const [type, setType] = useState<'multiple_choice' | 'fill_in_blank' | 'ordering'>('multiple_choice')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)       // trắc nghiệm
  const [fillAnswer, setFillAnswer] = useState('')           // điền từ
  const [orderItems, setOrderItems] = useState(['', '', '', '']) // sắp xếp (đáp án đúng theo thứ tự)
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    if (!isAdmin()) router.push('/admin')
    else { loadSet(); loadQuestions() }
  }, [])

  async function loadSet() {
    const { data } = await supabase.from('quiz_sets').select('*').eq('id', id).single()
    if (data) setQuizSet(data)
  }

  async function loadQuestions() {
    const { data } = await supabase.from('questions').select('*')
      .eq('quiz_set_id', id).order('order_index')
    if (data) setQuestions(data)
  }

  async function addQuestion() {
    if (!question.trim()) return alert('Nhập nội dung câu hỏi!')

    let opts = null
    let answer = ''

    if (type === 'multiple_choice') {
      if (options.some(o => !o.trim())) return alert('Điền đủ 4 đáp án!')
      opts = options
      answer = String(correctIndex)
    } else if (type === 'fill_in_blank') {
      if (!fillAnswer.trim()) return alert('Nhập đáp án!')
      answer = fillAnswer.trim()
    } else if (type === 'ordering') {
      if (orderItems.some(o => !o.trim())) return alert('Điền đủ 4 mục cần sắp xếp!')
      // Lưu thứ tự đúng: "0,1,2,3" nghĩa là đây đã là thứ tự đúng
      opts = [...orderItems]
      // Shuffle để hiển thị ngẫu nhiên, correct_answer là index thứ tự đúng
      answer = '0,1,2,3'
    }

    await supabase.from('questions').insert({
      quiz_set_id: id,
      type,
      question,
      options: opts,
      correct_answer: answer,
      explanation,
      order_index: questions.length
    })

    // Reset form
    setQuestion(''); setOptions(['', '', '', '']); setCorrectIndex(0)
    setFillAnswer(''); setOrderItems(['', '', '', '']); setExplanation('')
    loadQuestions()
  }

  async function deleteQuestion(qid: string) {
    await supabase.from('questions').delete().eq('id', qid)
    loadQuestions()
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <button onClick={() => router.push('/admin/dashboard')}
        className="text-blue-600 text-sm mb-4 hover:underline">← Quay lại</button>

      <h1 className="text-2xl font-bold mb-8">
        ✏️ {quizSet?.title || 'Đang tải...'}
      </h1>

      {/* Form thêm câu hỏi */}
      <div className="border rounded-xl p-5 mb-8 bg-gray-50">
        <h2 className="font-semibold mb-4">Thêm câu hỏi mới</h2>

        {/* Chọn loại */}
        <div className="flex gap-2 mb-4">
          {(['multiple_choice', 'fill_in_blank', 'ordering'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition
                ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>
              {t === 'multiple_choice' ? 'Trắc nghiệm'
                : t === 'fill_in_blank' ? 'Điền từ' : 'Sắp xếp'}
            </button>
          ))}
        </div>

        {/* Nội dung câu hỏi */}
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Nội dung câu hỏi *"
          rows={2}
          className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 resize-none" />

        {/* Trắc nghiệm */}
        {type === 'multiple_choice' && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500">Nhập 4 đáp án, chọn đáp án đúng:</p>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="radio" name="correct" checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)} />
                <input value={opt} onChange={e => {
                  const arr = [...options]; arr[i] = e.target.value; setOptions(arr)
                }}
                  placeholder={`Đáp án ${i + 1}`}
                  className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>
        )}

        {/* Điền từ */}
        {type === 'fill_in_blank' && (
          <input value={fillAnswer} onChange={e => setFillAnswer(e.target.value)}
            placeholder="Đáp án đúng *"
            className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500" />
        )}

        {/* Sắp xếp */}
        {type === 'ordering' && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500">Nhập các mục <b>theo thứ tự đúng</b> (hệ thống sẽ tự xáo trộn khi hiển thị):</p>
            {orderItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-sm text-gray-400 w-5">{i + 1}.</span>
                <input value={item} onChange={e => {
                  const arr = [...orderItems]; arr[i] = e.target.value; setOrderItems(arr)
                }}
                  placeholder={`Mục ${i + 1}`}
                  className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>
        )}

        {/* Giải thích */}
        <input value={explanation} onChange={e => setExplanation(e.target.value)}
          placeholder="Giải thích đáp án (không bắt buộc)"
          className="w-full border rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500" />

        <button onClick={addQuestion}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          + Thêm câu hỏi
        </button>
      </div>

      {/* Danh sách câu hỏi */}
      <h2 className="font-semibold mb-3">Câu hỏi trong bộ ({questions.length})</h2>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="border rounded-xl p-4 flex justify-between items-start">
            <div>
              <span className="text-xs text-gray-400 uppercase">
                {q.type === 'multiple_choice' ? 'Trắc nghiệm'
                  : q.type === 'fill_in_blank' ? 'Điền từ' : 'Sắp xếp'}
              </span>
              <p className="font-medium mt-0.5">{i + 1}. {q.question}</p>
            </div>
            <button onClick={() => deleteQuestion(q.id)}
              className="text-red-500 text-sm hover:underline ml-4 shrink-0">Xóa</button>
          </div>
        ))}
      </div>
    </div>
  )
}