'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAdmin, logoutAdmin } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type QuizSet = { id: string; title: string; description: string }

export default function Dashboard() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!isAdmin()) router.push('/admin')
    else loadSets()
  }, [])

  async function loadSets() {
    const { data } = await supabase.from('quiz_sets').select('*').order('created_at', { ascending: false })
    if (data) setQuizSets(data)
  }

  async function addSet() {
    if (!title.trim()) return
    await supabase.from('quiz_sets').insert({ title, description: desc })
    setTitle(''); setDesc('')
    loadSets()
  }

  async function deleteSet(id: string) {
    if (!confirm('Xóa bộ câu hỏi này?')) return
    await supabase.from('quiz_sets').delete().eq('id', id)
    loadSets()
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">⚙️ Quản lý bộ câu hỏi</h1>
        <button onClick={() => { logoutAdmin(); router.push('/admin') }}
          className="text-sm text-red-500 hover:underline">Đăng xuất</button>
      </div>

      {/* Form thêm bộ mới */}
      <div className="border rounded-xl p-5 mb-8 bg-gray-50">
        <h2 className="font-semibold mb-3">Thêm bộ câu hỏi mới</h2>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Tên bộ câu hỏi *"
          className="w-full border rounded-lg px-4 py-2 mb-2 outline-none focus:border-blue-500" />
        <input value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Mô tả (không bắt buộc)"
          className="w-full border rounded-lg px-4 py-2 mb-3 outline-none focus:border-blue-500" />
        <button onClick={addSet}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          + Thêm
        </button>
      </div>

      {/* Danh sách bộ câu hỏi */}
      <div className="space-y-3">
        {quizSets.map(set => (
          <div key={set.id} className="border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{set.title}</p>
              {set.description && <p className="text-sm text-gray-500">{set.description}</p>}
            </div>
            <div className="flex gap-3">
              <Link href={`/admin/dashboard/${set.id}`}
                className="text-blue-600 text-sm hover:underline">Sửa câu hỏi</Link>
              <button onClick={() => deleteSet(set.id)}
                className="text-red-500 text-sm hover:underline">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}