'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function CreateQuiz() {
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setUser(data.user)
    })
  }, [])

  async function handleCreate() {
    if (!title.trim() || !user) return
    setLoading(true)
    const { data, error } = await supabase.from('quiz_sets').insert({
      title,
      description,
      owner_id: user.id,
      owner_name: user.user_metadata.full_name || user.email,
    }).select().single()

    if (data) router.push(`/my-quizzes/${data.id}`)
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto mt-16 p-6 border rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Tạo bộ câu hỏi mới</h1>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Tên bộ câu hỏi *"
        className="w-full border rounded-lg px-4 py-3 mb-3 outline-none focus:border-blue-500" />
      <textarea value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Mô tả (không bắt buộc)"
        rows={3}
        className="w-full border rounded-lg px-4 py-3 mb-6 outline-none focus:border-blue-500 resize-none" />
      <button onClick={handleCreate} disabled={!title.trim() || loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-40">
        {loading ? 'Đang tạo...' : 'Tạo bộ câu hỏi →'}
      </button>
    </div>
  )
}