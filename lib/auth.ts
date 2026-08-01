import { supabase } from './supabase'

const getRedirectUrl = () => {
  if (typeof window === 'undefined') return ''
  // Nếu đang ở Vercel thì dùng domain thật, không dùng localhost
  if (window.location.hostname !== 'localhost') {
    return `https://${window.location.hostname}/`
  }
  return 'http://localhost:3000/'
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl()
    }
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}