import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { Check, EyeOff, Shield, FileText } from 'lucide-react'

type AdminComment = {
  id: string
  content: string
  status: string
  createdAt: string
  user: { id: string; username: string }
  post: { id: string; title: string; slug: string }
}

type AdminPost = {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string
  publishedAt: string | null
  author: { id: string; username: string }
}

export const Admin = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<'comments' | 'posts'>('comments')
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<AdminComment[]>([])
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const reloadComments = async () => {
    const data = await fetcher('/admin/comments?status=PENDING')
    setComments(data)
  }

  const reloadPosts = async () => {
    const data = await fetcher('/admin/posts')
    setPosts(data)
  }

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    Promise.all([reloadComments(), reloadPosts()])
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const approve = async (id: string) => {
    await fetcher(`/admin/comments/${id}/approve`, { method: 'POST' })
    await reloadComments()
  }

  const hide = async (id: string) => {
    await fetcher(`/admin/comments/${id}/hide`, { method: 'POST' })
    await reloadComments()
  }

  const togglePostStatus = async (post: AdminPost) => {
    const nextStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    await fetcher(`/admin/posts/${post.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })
    await reloadPosts()
  }

  const pendingCount = useMemo(() => comments.length, [comments])

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 rounded-3xl text-center">
        <p className="text-muted mb-4">你没有权限访问管理后台</p>
        <Link to="/" className="text-primary font-medium hover:underline">返回首页</Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <header className="glass p-10 rounded-3xl flex items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Shield />
          </div>
          <div>
            <h1 className="text-3xl font-black font-['Space_Grotesk']">管理后台</h1>
            <p className="text-muted text-sm">评论审核与文章管理</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('comments')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'comments' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            待审评论 {pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
          <button
            onClick={() => setTab('posts')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'posts' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            文章管理
          </button>
        </div>
      </header>

      {error && (
        <div className="glass p-6 rounded-2xl border border-red-500/30 text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass p-12 rounded-3xl text-center text-muted">Loading...</div>
      ) : tab === 'comments' ? (
        <section className="glass p-10 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-6 h-1 bg-primary rounded-full" />
              待审核评论
            </h2>
            <button onClick={reloadComments} className="text-sm font-bold text-primary hover:underline">刷新</button>
          </div>

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-background/60 dark:bg-black/30 border border-border rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                  <div className="text-sm text-muted">
                    <span className="font-bold text-foreground">{c.user.username}</span>
                    <span className="mx-2">•</span>
                    <Link to={`/post/${c.post.slug}`} className="text-primary hover:underline">{c.post.title}</Link>
                  </div>
                  <div className="text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => approve(c.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/15 transition-colors font-bold text-sm"
                  >
                    <Check size={16} />
                    通过
                  </button>
                  <button
                    onClick={() => hide(c.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/15 transition-colors font-bold text-sm"
                  >
                    <EyeOff size={16} />
                    隐藏
                  </button>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-16 text-muted border-2 border-dashed border-border rounded-2xl">
                暂无待审核评论
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="glass p-10 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-6 h-1 bg-primary rounded-full" />
              文章管理
            </h2>
            <button onClick={reloadPosts} className="text-sm font-bold text-primary hover:underline">刷新</button>
          </div>

          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="bg-background/60 dark:bg-black/30 border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-primary" />
                    <div className="text-lg font-bold">{p.title}</div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-orange-500/10 text-orange-600 dark:text-orange-500'}`}>
                      {p.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </div>
                  <div className="text-sm text-muted flex flex-wrap gap-x-4 gap-y-1">
                    <span>作者：{p.author.username}</span>
                    <span>创建：{new Date(p.createdAt).toLocaleDateString()}</span>
                    {p.publishedAt ? <span>发布：{new Date(p.publishedAt).toLocaleDateString()}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/post/${p.slug}`} className="px-4 py-2 rounded-xl hover:bg-border/60 transition-colors text-sm font-bold">
                    查看
                  </Link>
                  <button
                    onClick={() => togglePostStatus(p)}
                    className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-bold shadow-lg shadow-primary/20"
                  >
                    {p.status === 'PUBLISHED' ? '下架' : '发布'}
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-16 text-muted border-2 border-dashed border-border rounded-2xl">
                暂无文章
              </div>
            )}
          </div>
        </section>
      )}
    </motion.div>
  )
}

