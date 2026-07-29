'use client'
import { useState } from 'react'
import { loginAdmin, isAdmin } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (isAdmin()) router.push('/admin/dashboard')
  }, [])

  function handleLogin() {
    if (loginAdmin(password)) {
      router.push('/admin/dashboard')
    } else {
      setError('Sai mật khẩu!')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-32 p-8 border rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">🔐 Admin Login</h1>
      <input
        type="password"
        placeholder="Nhập mật khẩu..."
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        className="w-full border rounded-lg px-4 py-3 mb-3 outline-none focus:border-blue-500"
      />
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        onClick={handleLogin}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold"
      >
        Đăng nhập
      </button>
    </div>
  )
}