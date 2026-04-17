import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { fetcher } from '../lib/api'
import { Loader2 } from 'lucide-react'

export const Editor = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    status: 'DRAFT'
  })

  if (!user) return <div className="p-24 text-center">请先登录</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const slug = form.title.toLowerCase().replace(/[\s\W-]+/g, '-') + '-' + Date.now().toString(36)
      await fetcher('/posts', {
        method: 'POST',
        body: JSON.stringify({ ...form, slug })
      })
      navigate('/profile')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-4xl font-bold mb-12 font-['Space_Grotesk']">创作中心</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 glass p-10 rounded-3xl">
        <input 
          type="text" 
          placeholder="文章标题..." 
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full text-4xl font-bold bg-transparent border-b-2 border-transparent focus:border-primary outline-none transition-colors pb-4 font-['Space_Grotesk']"
          required
        />
        
        <textarea 
          placeholder="写一段吸引人的摘要（可选）..." 
          value={form.excerpt}
          onChange={e => setForm({ ...form, excerpt: e.target.value })}
          className="w-full bg-background border border-border p-4 rounded-xl focus:border-primary outline-none transition-colors resize-none h-24"
        />
        
        <textarea 
          placeholder="正文（支持 Markdown）..." 
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          className="w-full bg-background border border-border p-6 rounded-2xl focus:border-primary outline-none transition-colors resize-y min-h-[400px] text-lg leading-relaxed font-mono"
          required
        />
        
        <div className="grid grid-cols-2 gap-6">
          <input 
            type="text" 
            placeholder="分类（如：技术分享）" 
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
          />
          <input 
            type="text" 
            placeholder="标签（逗号分隔，如：React, Node）" 
            value={form.tags}
            onChange={e => setForm({ ...form, tags: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-6 pt-6 border-t border-border">
          <select 
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none cursor-pointer"
          >
            <option value="DRAFT">存为草稿</option>
            <option value="PUBLISHED">立即发布</option>
          </select>
          
          <button 
            disabled={loading}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : '保存文章'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
