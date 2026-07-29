// Dùng biến môi trường để xác thực admin đơn giản
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('isAdmin') === 'true'
}

export function loginAdmin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem('isAdmin', 'true')
    return true
  }
  return false
}

export function logoutAdmin() {
  localStorage.removeItem('isAdmin')
}