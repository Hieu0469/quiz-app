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
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: set } = await supabase
        .from('quiz_sets').select('title').eq('id', id).single()
      if (set) setQuizTitle(set.title)

      const { data } = await supabase
        .from('questions').select('*')
        .eq('quiz_set_id', id).order('order_index')
      if (data) setQuestions(data)
      setLoading(false)
    }
    load()
  }, [])

  const q = questions[current]

  function checkAnswer() {
    const correct = userAnswer === q.correct_answer
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
      setAnswered(false)
    }
  }

  if (loading)
    return <p className="text-center mt-20 text-gray-400">Đang tải...</p>

  if (questions.length === 0)
    return (
      <div className="text-center mt-20">
        <p className="text-gray-400 mb-4">Bộ câu hỏi này chưa có câu hỏi nào.</p>
        <button onClick={() => router.push('/')}
          className="text-blue-600 hover:underline">← Quay lại trang chủ</button>
      </div>
    )

  if (showResult)
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8 border rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-2">{quizTitle}</h2>
        <p className="text-gray-500 mb-6">Kết quả của bạn</p>
        <p className="text-6xl font-bold text-blue-600 mb-2">
          {score}/{questions.length}
        </p>
        <p className="text-gray-400 mb-8">
          {score === questions.length ? '🎉 Hoàn hảo!'
            : score >= questions.length / 2 ? '👍 Tốt lắm!'
            : '💪 Cố gắng hơn nhé!'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => {
            setCurrent(0); setScore(0); setShowResult(false)
            setUserAnswer(''); setAnswered(false)
          }}
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
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{quizTitle}</span>
        <span className="text-sm text-gray-400">{current + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

      {/* Đáp án */}
      {q.options && (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} disabled={answered}
              onClick={() => setUserAnswer(String(i))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition
                ${userAnswer === String(i) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${answered && String(i) === q.correct_answer ? 'border-green-500 bg-green-50' : ''}
                ${answered && userAnswer === String(i) && !isCorrect ? 'border-red-400 bg-red-50' : ''}
              `}>
              <span className="font-medium mr-2">{['A','B','C','D'][i]}.</span>{opt}
            </button>
          ))}
        </div>
      )}

      {/* Giải thích */}
      {answered && (
        <div className={`mt-4 p-4 rounded-lg text-sm
          ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-bold mb-1">{isCorrect ? '✓ Đúng!' : `✗ Sai! Đáp án: ${q.options?.[parseInt(q.correct_answer)]}`}</p>
          {q.explanation && <p>{q.explanation}</p>}
        </div>
      )}

      {/* Nút */}
      <div className="mt-6">
        {!answered ? (
          <button onClick={checkAnswer} disabled={!userAnswer}
            className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-40">
            Kiểm tra
          </button>
        ) : (
          <button onClick={nextQuestion}
            className="w-full py-3 bg-gray-800 text-white rounded-lg">
            {current + 1 >= questions.length ? '🏁 Xem kết quả' : 'Câu tiếp →'}
          </button>
        )}
      </div>
    </div>
  )
}