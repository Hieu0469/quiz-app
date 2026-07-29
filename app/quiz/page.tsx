'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Question = {
  id: string
  type: 'multiple_choice' | 'fill_in_blank'
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Lấy câu hỏi từ Supabase
  useEffect(() => {
    async function fetchQuestions() {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic', 'general')
    
    console.log('Data:', data)      // ← thêm dòng này
    console.log('Error:', error)    // ← thêm dòng này
    
    if (data) setQuestions(data)
    }
    fetchQuestions()
  }, [])

  const q = questions[current]

  function checkAnswer() {
    const correct =
      q.type === 'multiple_choice'
        ? userAnswer === q.correct_answer
        : userAnswer.trim().toLowerCase() === q.correct_answer.toLowerCase()

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

  // Màn hình loading
  if (questions.length === 0)
    return <p className="p-8 text-center">Đang tải câu hỏi...</p>

  // Màn hình kết quả
  if (showResult)
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8 border rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">Kết quả</h2>
        <p className="text-4xl font-bold text-blue-600">
          {score} / {questions.length}
        </p>
        <button
          onClick={() => { setCurrent(0); setScore(0); setShowResult(false); setUserAnswer(''); setAnswered(false) }}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Làm lại
        </button>
      </div>
    )

  // Màn hình câu hỏi
  return (
    <div className="max-w-lg mx-auto mt-16 p-6 border rounded-xl shadow">
      {/* Tiến độ */}
      <p className="text-sm text-gray-500 mb-4">
        Câu {current + 1} / {questions.length}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Câu hỏi */}
      <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

      {/* Trắc nghiệm */}
      {q.type === 'multiple_choice' && q.options && (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              disabled={answered}
              onClick={() => setUserAnswer(String(i))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition
                ${userAnswer === String(i) ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
                ${answered && String(i) === q.correct_answer ? 'border-green-500 bg-green-50' : ''}
                ${answered && userAnswer === String(i) && !isCorrect ? 'border-red-400 bg-red-50' : ''}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Điền vào chỗ trống */}
      {q.type === 'fill_in_blank' && (
        <input
          type="text"
          disabled={answered}
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          placeholder="Nhập câu trả lời..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500"
        />
      )}

      {/* Giải thích sau khi trả lời */}
      {answered && (
        <div className={`mt-4 p-4 rounded-lg text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-bold mb-1">{isCorrect ? '✓ Đúng!' : '✗ Sai!'}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {/* Nút bấm */}
      <div className="mt-6 flex gap-3">
        {!answered && (
          <button
            onClick={checkAnswer}
            disabled={!userAnswer}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-40"
          >
            Kiểm tra
          </button>
        )}
        {answered && (
          <button
            onClick={nextQuestion}
            className="flex-1 py-3 bg-gray-800 text-white rounded-lg"
          >
            {current + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp →'}
          </button>
        )}
      </div>
    </div>
  )
}