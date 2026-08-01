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

type UserAnswer = {
  questionIndex: number
  userAnswer: string
  isCorrect: boolean
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
  const [showReview, setShowReview] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]) // lưu lại tất cả đáp án

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
    // Lưu đáp án của câu này
    setUserAnswers(prev => [...prev, {
      questionIndex: current,
      userAnswer,
      isCorrect: correct
    }])
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

  function resetQuiz() {
    setCurrent(0); setScore(0); setShowResult(false)
    setShowReview(false); setUserAnswer('')
    setAnswered(false); setUserAnswers([])
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

  // Màn hình xem lại bài
  if (showReview)
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">📋 Xem lại bài làm</h2>
          <button onClick={() => setShowReview(false)}
            className="text-blue-600 hover:underline text-sm">← Quay lại kết quả</button>
        </div>

        <div className="space-y-6">
          {questions.map((q, i) => {
            const ua = userAnswers[i]
            const userAnswerText = q.options?.[parseInt(ua?.userAnswer)] ?? ua?.userAnswer ?? 'Chưa trả lời'
            const correctAnswerText = q.options?.[parseInt(q.correct_answer)] ?? q.correct_answer

            return (
              <div key={q.id} className={`border rounded-xl p-5
                ${ua?.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>

                {/* Tiêu đề câu */}
                <div className="flex gap-2 items-start mb-4">
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white
                    ${ua?.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {ua?.isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="font-semibold text-gray-900">Câu {i + 1}: {q.question}</p>
                </div>

                {/* Các đáp án */}
                {q.options && (
                  <div className="space-y-2 mb-4 ml-9">
                    {q.options.map((opt, j) => {
                      const isCorrectOpt = String(j) === q.correct_answer
                      const isUserOpt = String(j) === ua?.userAnswer
                      return (
                        <div key={j} className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2
                          ${isCorrectOpt ? 'border-green-500 bg-green-100 text-green-800' : ''}
                          ${isUserOpt && !isCorrectOpt ? 'border-red-400 bg-red-100 text-red-800' : ''}
                          ${!isCorrectOpt && !isUserOpt ? 'border-gray-200 bg-white text-gray-600' : ''}
                        `}>
                          <span className="font-medium">{['A','B','C','D'][j]}.</span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectOpt && <span className="text-green-600 font-semibold">✓ Đúng</span>}
                          {isUserOpt && !isCorrectOpt && <span className="text-red-500 font-semibold">Bạn chọn</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Giải thích */}
                {q.explanation && (
                  <div className="ml-9 mt-2 text-sm text-gray-600 bg-white border rounded-lg px-4 py-3">
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex gap-3 justify-center">
          <button onClick={resetQuiz}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Làm lại từ đầu
          </button>
          <button onClick={() => router.push('/')}
            className="px-6 py-3 border rounded-lg">
            Trang chủ
          </button>
        </div>
      </div>
    )

  // Màn hình kết quả
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

        {/* Thống kê nhanh */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{score}</p>
            <p className="text-sm text-gray-400">Đúng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{questions.length - score}</p>
            <p className="text-sm text-gray-400">Sai</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {Math.round((score / questions.length) * 100)}%
            </p>
            <p className="text-sm text-gray-400">Tỉ lệ đúng</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => setShowReview(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold">
            📋 Xem lại bài làm
          </button>
          <button onClick={resetQuiz}
            className="w-full py-3 border rounded-lg">
            🔄 Làm lại
          </button>
          <button onClick={() => router.push('/')}
            className="w-full py-3 text-gray-400 hover:underline text-sm">
            Trang chủ
          </button>
        </div>
      </div>
    )

  // Màn hình làm bài
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-xl shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{quizTitle}</span>
        <span className="text-sm text-gray-400">{current + 1}/{questions.length}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

      {q.options && (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} disabled={answered}
              onClick={() => setUserAnswer(String(i))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition
                ${answered && String(i) === q.correct_answer
                  ? 'border-green-500 bg-green-500 text-white'
                  : ''}
                ${answered && userAnswer === String(i) && !isCorrect
                  ? 'border-red-400 bg-red-500 text-white'
                  : ''}
                ${!answered && userAnswer === String(i)
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : ''}
                ${(!answered && userAnswer !== String(i)) ||
                  (answered && String(i) !== q.correct_answer && userAnswer !== String(i))
                  ? 'border-gray-600 bg-transparent text-white'
                  : ''}
              `}>
              <span className="font-medium mr-2">{['A','B','C','D'][i]}.</span>{opt}
            </button>
          ))}
        </div>
      )}

      {answered && (
        <div className={`mt-4 p-4 rounded-lg text-sm
          ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-bold mb-1">
            {isCorrect ? '✓ Đúng!'
              : `✗ Sai! Đáp án: ${q.options?.[parseInt(q.correct_answer)]}`}
          </p>
          {q.explanation && <p>{q.explanation}</p>}
        </div>
      )}

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