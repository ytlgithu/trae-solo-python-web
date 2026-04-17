import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { fetcher } from '../lib/api'
import { Loader2 } from 'lucide-react'

export const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetcher('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      setAuth(res.user, res.token)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-10 rounded-3xl"
      >
        <h1 className="text-3xl font-bold mb-2 font-['Space_Grotesk'] text-center">欢迎回来</h1>
        <p className="text-muted text-center mb-8">登录以继续创作与互动</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">用户名</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button 
            disabled={loading}
            className="w-full py-3 bg-foreground text-background dark:bg-white dark:text-black rounded-xl font-bold flex justify-center items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : '登录'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-muted">
          没有账号？ <Link to="/register" className="text-primary font-medium hover:underline">注册</Link>
        </p>
      </motion.div>
    </div>
  )
}
