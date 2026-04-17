export const API_URL = '/api'

export const fetcher = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')
  const headers = new Headers(options.headers)
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}
