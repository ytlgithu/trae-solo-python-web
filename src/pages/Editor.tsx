import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { fetcher } from '../lib/api'
import { Loader2, Plus, X } from 'lucide-react'

export const Editor = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    status: 'DRAFT'
  })

  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [tagsList, setTagsList] = useState<{ id: string, name: string }[]>([])
  
  const [catSearch, setCatSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  const catRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch categories and tags
    Promise.all([
      fetcher('/posts/categories'),
      fetcher('/posts/tags')
    ]).then(([cats, tgs]) => {
      setCategories(cats)
      setTagsList(tgs)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatDropdown(false)
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setShowTagDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isEditing && id) {
      fetcher(`/posts/id/${id}`)
        .then((data) => {
          setForm({
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            category: data.category?.name || '',
            tags: data.tags?.map((t: any) => t.name).join(', ') || '',
            status: data.status || 'DRAFT'
          })
        })
        .catch((err) => {
          alert(err.message)
          navigate('/profile')
        })
        .finally(() => setInitialLoading(false))
    }
  }, [id, isEditing, navigate])

  if (!user) return <div className="p-24 text-center">请先登录</div>
  if (initialLoading) return <div className="p-24 text-center">加载中...</div>

  const handleSelectTag = (tagName: string) => {
    const currentTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    if (!currentTags.includes(tagName)) {
      currentTags.push(tagName)
      setForm({ ...form, tags: currentTags.join(', ') })
    }
    setTagSearch('')
    setShowTagDropdown(false)
  }

  const handleRemoveTag = (tagName: string) => {
    const currentTags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    setForm({ ...form, tags: currentTags.filter(t => t !== tagName).join(', ') })
  }

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
  const filteredTags = tagsList.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
  const currentTagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditing) {
        await fetcher(`/posts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(form)
        })
      } else {
        const slug = form.title.toLowerCase().replace(/[\s\W-]+/g, '-') + '-' + Date.now().toString(36)
        await fetcher('/posts', {
          method: 'POST',
          body: JSON.stringify({ ...form, slug })
        })
      }
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
      <h1 className="text-4xl font-bold mb-12 font-['Space_Grotesk']">{isEditing ? '编辑文章' : '创作中心'}</h1>
      
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Dropdown */}
          <div className="relative" ref={catRef}>
            <div 
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus-within:border-primary flex items-center cursor-pointer"
              onClick={() => setShowCatDropdown(true)}
            >
              <input 
                type="text" 
                placeholder="分类（搜索或输入新分类）" 
                value={showCatDropdown ? catSearch : form.category}
                onChange={e => {
                  setCatSearch(e.target.value)
                  if (!showCatDropdown) setForm({ ...form, category: e.target.value })
                }}
                className="w-full bg-transparent outline-none"
              />
            </div>
            
            <AnimatePresence>
              {showCatDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-50 top-full left-0 w-full mt-2 bg-background border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto"
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(c => (
                      <div 
                        key={c.id}
                        className="px-4 py-2 hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setForm({ ...form, category: c.name })
                          setCatSearch('')
                          setShowCatDropdown(false)
                        }}
                      >
                        {c.name}
                      </div>
                    ))
                  ) : (
                    catSearch.trim() && (
                      <div 
                        className="px-4 py-3 hover:bg-primary/10 text-primary cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setForm({ ...form, category: catSearch.trim() })
                          setCatSearch('')
                          setShowCatDropdown(false)
                        }}
                      >
                        <Plus size={16} />
                        添加新分类 "{catSearch}"
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tags Dropdown */}
          <div className="relative" ref={tagRef}>
            <div 
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus-within:border-primary min-h-[50px] flex flex-wrap items-center gap-2 cursor-pointer"
              onClick={() => setShowTagDropdown(true)}
            >
              {currentTagsArray.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                  {tag}
                  <X size={14} className="cursor-pointer hover:scale-110" onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag) }} />
                </span>
              ))}
              <input 
                type="text" 
                placeholder={currentTagsArray.length === 0 ? "搜索或输入新标签..." : ""} 
                value={tagSearch}
                onChange={e => setTagSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagSearch.trim()) {
                    e.preventDefault()
                    handleSelectTag(tagSearch.trim())
                  }
                }}
                className="flex-1 min-w-[120px] bg-transparent outline-none"
              />
            </div>

            <AnimatePresence>
              {showTagDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-50 top-full left-0 w-full mt-2 bg-background border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto"
                >
                  {filteredTags.length > 0 ? (
                    filteredTags.map(t => (
                      <div 
                        key={t.id}
                        className="px-4 py-2 hover:bg-muted/50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleSelectTag(t.name)}
                      >
                        {t.name}
                        {currentTagsArray.includes(t.name) && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">已选</span>}
                      </div>
                    ))
                  ) : (
                    tagSearch.trim() && (
                      <div 
                        className="px-4 py-3 hover:bg-primary/10 text-primary cursor-pointer flex items-center gap-2"
                        onClick={() => handleSelectTag(tagSearch.trim())}
                      >
                        <Plus size={16} />
                        添加新标签 "{tagSearch}"
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            {loading ? <Loader2 className="animate-spin" /> : (isEditing ? '保存修改' : '保存文章')}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
