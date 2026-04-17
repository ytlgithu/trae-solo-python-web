import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { Shield, FileText, ScrollText } from 'lucide-react'

type AdminPost = {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string
  publishedAt: string | null
  author: { id: string; username: string }
}

type OperationLog = {
  id: string
  action: string
  target?: string | null
  detail?: string | null
  createdAt: string
  actor: { username: string }
}

export const Admin = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<'posts' | 'logs'>('posts')
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [logPage, setLogPage] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const reloadPosts = async () => {
    const data = await fetcher('/admin/posts')
    setPosts(data)
  }

  const reloadLogs = async (page: number) => {
    const data = await fetcher(`/admin/logs?page=${page}`)
    setLogs(data.items || [])
    setLogPage(data.page || page)
    setLogTotalPages(data.totalPages || 1)
  }

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    Promise.all([reloadPosts(), reloadLogs(1)])
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const togglePostStatus = async (post: AdminPost) => {
    const nextStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    await fetcher(`/admin/posts/${post.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })
    await reloadPosts()
  }

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
            <p className="text-muted text-sm">文章管理与操作日志</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('posts')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'posts' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            文章管理
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'logs' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            操作日志
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
      ) : tab === 'posts' ? (
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
      ) : (
        <section className="glass p-10 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-6 h-1 bg-primary rounded-full" />
              操作日志
            </h2>
            <button onClick={() => reloadLogs(logPage)} className="text-sm font-bold text-primary hover:underline">刷新</button>
          </div>

          <div className="space-y-3">
            {logs.map((l) => (
              <div key={l.id} className="bg-background/60 dark:bg-black/30 border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <ScrollText size={18} />
                  </div>
                  <div>
                    <div className="font-bold">
                      <span className="text-primary">{l.actor.username}</span>
                      <span className="mx-2 text-muted">•</span>
                      <span>{l.action}</span>
                    </div>
                    <div className="text-sm text-muted">
                      {l.detail ? l.detail : l.target ? `目标：${l.target}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted">{new Date(l.createdAt).toLocaleString()}</div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-16 text-muted border-2 border-dashed border-border rounded-2xl">
                暂无日志
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-10">
            <button
              disabled={logPage <= 1}
              onClick={() => reloadLogs(logPage - 1)}
              className="px-4 py-2 rounded-xl hover:bg-border/60 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm font-bold"
            >
              上一页
            </button>
            <div className="text-sm text-muted">
              第 {logPage} / {logTotalPages} 页（每页 20 条，最多保留 200 条）
            </div>
            <button
              disabled={logPage >= logTotalPages}
              onClick={() => reloadLogs(logPage + 1)}
              className="px-4 py-2 rounded-xl hover:bg-border/60 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm font-bold"
            >
              下一页
            </button>
          </div>
        </section>
      )}
    </motion.div>
  )
}
