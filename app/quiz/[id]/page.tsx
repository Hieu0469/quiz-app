'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Question = {
  id: string
  type: string
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
}

export default function QuizPage() {
  const { id } = useParams()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizTitle, setQuizTitle] = useState('')
  const [current, setCurrent] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [userOrder, setUserOrder] = useState<string[]>([])   // cho câu sắp xếp
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: set } = await supabase.from('quiz_sets').select('title').eq('id', id).single()
      if (set) setQuizTitle(set.title)

      const { data } = await supabase.from('questions').select('*')
        .eq('quiz_set_id', id).order('order_index')
      if (data) setQuestions(data)
    }
    load()
  }, [])

  // Shuffle options khi chuyển câu ordering
  useEffect(() => {
    const q = questions[current]
    if (!q) return
    if (q.type === 'ordering' && q.options) {
      const shuffled = [...q.options].sort(() => Math.random() - 0.5)
      setShuffledOptions(shuffled)
      setUserOrder(shuffled)
    }
  }, [current, questions])

  const q = questions[current]

  function checkAnswer() {
    let correct = false
    if (q.type === 'multiple_choice') {
      correct = userAnswer === q.correct_answer
    } else if (q.type === 'fill_in_blank') {
      correct = userAnswer.trim().toLowerCase() === q.correct_answer.toLowerCase()
    } else if (q.type === 'ordering') {
      // So sánh thứ tự user với thứ tự đúng (options gốc)
      correct = JSON.stringify(userOrder) === JSON.stringify(q.options)
    }
    setIsCorrect(correct)
    setAnswered(true)
    if (correct) setScore(s => s + 1)
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      setShowResult(true)
    } else {
      setCurrent(c => c + 1)
      setUserAnswer('')
      setUserOrder([])
      setAnswered(false)
    }
  }

  // Hàm di chuyển item trong câu sắp xếp
  function moveItem(index: number, direction: 'up' | 'down') {
    const arr = [...userOrder]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= arr.length) return
    ;[arr[index], arr[swapIndex]] = [arr[swapIndex], arr[index]]
    setUserOrder(arr)
  }

  if (questions.length === 0)
    return <p className="p-8 text-center text-gray-400">Đang tải câu hỏi...</p>

  if (showResult)
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8 border rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-2">{quizTitle}</h2>
        <p className="text-gray-500 mb-6">Kết quả của bạn</p>
        <p className="text-6xl font-bold text-blue-600 mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 mb-8">
          {score === questions.length ? '🎉 Hoàn hảo!' : score >= questions.length / 2 ? '👍 Tốt lắm!' : '💪 Cố gắng hơn nhé!'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setCurrent(0); setScore(0); setShowResult(false); setUserAnswer(''); setAnswered(false) }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            Làm lại
          </button>
          <button onClick={() => router.push('/')}
            className="px-6 py-2 border rounded-lg">
            Trang chủ
          </button>
        </div>
      </div>
    )

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{quizTitle}</span>
        <span className="text-sm text-gray-400">{current + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Loại câu hỏi */}
      <span className="text-xs uppercase text-blue-600 font-semibold">
        {q.type === 'multiple_choice' ? 'Trắc nghiệm'
          : q.type === 'fill_in_blank' ? 'Điền từ' : 'Sắp xếp'}
      </span>
      <h2 className="text-lg font-semibold mt-1 mb-6">{q.question}</h2>

      {/* Trắc nghiệm */}
      {q.type === 'multiple_choice' && q.options && (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} disabled={answered} onClick={() => setUserAnswer(String(i))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition
                ${userAnswer === String(i) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${answered && String(i) === q.correct_answer ? 'border-green-500 bg-green-50' : ''}
                ${answered && userAnswer === String(i) && !isCorrect ? 'border-red-400 bg-red-50' : ''}
              `}>
              <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][i]}.</span>{opt}
            </button>
          ))}
        </div>
      )}

      {/* Điền từ */}
      {q.type === 'fill_in_blank' && (
        <input type="text" disabled={answered} value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !answered && userAnswer && checkAnswer()}
          placeholder="Nhập câu trả lời..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
      )}

      {/* Sắp xếp */}
      {q.type === 'ordering' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3">Kéo sắp xếp theo thứ tự đúng:</p>
          {userOrder.map((item, i) => (
            <div key={i} className={`flex items-center gap-2 border rounded-lg px-4 py-3
              ${answered
                ? item === q.options?.[i]
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-200 bg-white'}`}>
              <span className="text-gray-400 text-sm w-5">{i + 1}.</span>
              <span className="flex-1">{item}</span>
              {!answered && (
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveItem(i, 'up')}
                    className="text-gray-400 hover:text-gray-700 text-xs px-1">▲</button>
                  <button onClick={() => moveItem(i, 'down')}
                    className="text-gray-400 hover:text-gray-700 text-xs px-1">▼</button>
                </div>
              )}
            </div>
          ))}
          {answered && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-semibold mb-1">Thứ tự đúng:</p>
              {q.options?.map((item, i) => <p key={i}>{i + 1}. {item}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Giải thích */}
      {answered && q.explanation && (
        <div className={`mt-4 p-4 rounded-lg text-sm
          ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-bold mb-1">{isCorrect ? '✓ Đúng!' : '✗ Sai!'}</p>
          <p>{q.explanation}</p>
        </div>
      )}
      {answered && !q.explanation && (
        <p className={`mt-4 text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
          {isCorrect ? '✓ Đúng!' : `✗ Sai! Đáp án đúng: ${q.type === 'multiple_choice'
            ? q.options?.[parseInt(q.correct_answer)] : q.correct_answer}`}
        </p>
      )}

      {/* Nút bấm */}
      <div className="mt-6">
        {!answered && (
          <button onClick={checkAnswer}
            disabled={q.type !== 'ordering' && !userAnswer}
            className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-40">
            Kiểm tra
          </button>
        )}
        {answered && (
          <button onClick={nextQuestion}
            className="w-full py-3 bg-gray-800 text-white rounded-lg">
            {current + 1 >= questions.length ? '🏁 Xem kết quả' : 'Câu tiếp →'}
          </button>
        )}
      </div>
    </div>
  )
}