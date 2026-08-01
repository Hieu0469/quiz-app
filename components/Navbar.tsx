'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signInWithGoogle, signOut } from '@/lib/auth'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <nav className="border-b px-6 py-4 flex justify-between items-center">
      <Link href="/" className="font-bold text-lg">📝 QuizApp</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              + Tạo bộ câu hỏi
            </Link>
            <Link href="/my-quizzes" className="text-sm text-gray-600 hover:underline">
              Bộ câu hỏi của tôi
            </Link>
            <Link href="/history" className="text-sm text-gray-600 hover:underline">
              Lịch sử
            </Link>
            <div className="flex items-center gap-2">
              <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" />
              <button onClick={signOut} className="text-sm text-gray-400 hover:text-red-500">
                Đăng xuất
              </button>
            </div>
          </>
        ) : (
          <button onClick={signInWithGoogle}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
            Đăng nhập với Google
          </button>
        )}
      </div>
    </nav>
  )
}