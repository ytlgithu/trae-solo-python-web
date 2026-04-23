import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { Shield, FileText, ScrollText, Users, Tag as TagIcon, FolderTree } from 'lucide-react'

type AdminPost = {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string
  publishedAt: string | null
  author: { id: string; username: string }
}

type AdminCategory = {
  id: string
  name: string
  slug: string
}

type AdminTag = {
  id: string
  name: string
  slug: string
}

type OperationLog = {
  id: string
  action: string
  target?: string | null
  detail?: string | null
  createdAt: string
  actor: { username: string }
}

type AdminUser = {
  id: string
  username: string
  role: string
  createdAt: string
  profile?: { avatarUrl: string | null } | null
}

const ACTION_MAP: Record<string, string> = {
  'AUTH_REGISTER': '用户注册',
  'AUTH_LOGIN': '用户登录',
  'POST_CREATE': '创建文章',
  'POST_UPDATE': '更新文章',
  'POST_DELETE': '删除文章',
  'POST_PUBLISH': '发布文章',
  'POST_UNPUBLISH': '下架文章',
  'POST_STATUS_UPDATE': '更新文章状态',
  'COMMENT_CREATE': '发表评论',
  'USER_ROLE_UPDATE': '修改用户权限',
}

export const Admin = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<'posts' | 'logs' | 'users' | 'taxonomy'>('posts')
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [tags, setTags] = useState<AdminTag[]>([])

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

  const reloadUsers = async () => {
    const data = await fetcher('/admin/users')
    setUsers(data)
  }

  const reloadTaxonomy = async () => {
    const [cats, tgs] = await Promise.all([
      fetcher('/posts/categories'),
      fetcher('/posts/tags')
    ])
    setCategories(cats)
    setTags(tgs)
  }

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    Promise.all([reloadPosts(), reloadLogs(1), reloadUsers(), reloadTaxonomy()])
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
    if (tab === 'logs') await reloadLogs(1)
  }

  const toggleUserRole = async (targetUser: AdminUser) => {
    if (targetUser.id === user?.id) {
      alert('不能修改自己的权限')
      return
    }
    if (targetUser.username === 'admin') {
      alert('不能修改超级管理员权限')
      return
    }
    if (user?.username !== 'admin') {
      alert('只有超级管理员可以修改用户权限')
      return
    }
    const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN'
    try {
      await fetcher(`/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole })
      })
      await reloadUsers()
      if (tab === 'logs') await reloadLogs(1)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？这会将该分类下文章的分类置空。')) return
    try {
      await fetcher(`/admin/categories/${id}`, { method: 'DELETE' })
      await reloadTaxonomy()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleUpdateCategory = async (id: string, oldName: string) => {
    const newName = prompt('输入新的分类名称', oldName)
    if (!newName || newName === oldName) return
    try {
      await fetcher(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName })
      })
      await reloadTaxonomy()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleUpdateTag = async (id: string, oldName: string) => {
    const newName = prompt('输入新的标签名称', oldName)
    if (!newName || newName === oldName) return
    try {
      await fetcher(`/admin/tags/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName })
      })
      await reloadTaxonomy()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return
    try {
      await fetcher(`/admin/tags/${id}`, { method: 'DELETE' })
      await reloadTaxonomy()
    } catch (e: any) {
      alert(e.message)
    }
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
      <header className="glass p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Shield />
          </div>
          <div>
            <h1 className="text-3xl font-black font-['Space_Grotesk']">管理后台</h1>
            <p className="text-muted text-sm">文章、日志与用户管理</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setTab('posts')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'posts' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            文章管理
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'users' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            用户管理
          </button>
          <button
            onClick={() => { setTab('taxonomy'); reloadTaxonomy() }}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === 'taxonomy' ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'hover:bg-border/60'
            }`}
          >
            分类/标签管理
          </button>
          <button
            onClick={() => { setTab('logs'); reloadLogs(1) }}
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
                <div className="flex items-center gap-3 shrink-0">
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
      ) : tab === 'users' ? (
        <section className="glass p-10 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-6 h-1 bg-primary rounded-full" />
              用户管理
            </h2>
            <button onClick={reloadUsers} className="text-sm font-bold text-primary hover:underline">刷新</button>
          </div>

          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="bg-background/60 dark:bg-black/30 border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {u.profile?.avatarUrl ? (
                      <img src={u.profile.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                        <Users size={18} />
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-bold flex items-center gap-2">
                        {u.username}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'}`}>
                          {u.role === 'ADMIN' ? '管理员' : '普通用户'}
                        </span>
                      </div>
                      <div className="text-sm text-muted">
                        注册时间：{new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleUserRole(u)}
                    disabled={u.username === 'admin' || u.id === user?.id}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:hover:bg-primary/10 transition-colors text-sm font-bold border border-primary/20"
                  >
                    设为{u.role === 'ADMIN' ? '普通用户' : '管理员'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : tab === 'taxonomy' ? (
        <section className="glass p-10 rounded-3xl space-y-12">
          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="w-6 h-1 bg-primary rounded-full" />
                <FolderTree className="text-primary" />
                分类管理
              </h2>
              <button onClick={reloadTaxonomy} className="text-sm font-bold text-primary hover:underline">刷新</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(c => (
                <div key={c.id} className="bg-background/60 dark:bg-black/30 border border-border rounded-xl p-4 flex items-center justify-between group">
                  <span className="font-bold">{c.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => handleUpdateCategory(c.id, c.name)} className="text-sm text-primary hover:underline">编辑</button>
                    <button onClick={() => handleDeleteCategory(c.id)} className="text-sm text-red-500 hover:underline">删除</button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <div className="text-muted text-sm col-span-full">暂无分类</div>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="w-6 h-1 bg-primary rounded-full" />
                <TagIcon className="text-primary" />
                标签管理
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {tags.map(t => (
                <div key={t.id} className="bg-background/60 dark:bg-black/30 border border-border rounded-full pl-4 pr-2 py-2 flex items-center gap-3 group">
                  <span className="text-sm font-bold">{t.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 rounded-full px-2">
                    <button onClick={() => handleUpdateTag(t.id, t.name)} className="text-xs text-primary hover:underline px-1">改</button>
                    <button onClick={() => handleDeleteTag(t.id)} className="text-xs text-red-500 hover:underline px-1">删</button>
                  </div>
                </div>
              ))}
              {tags.length === 0 && <div className="text-muted text-sm w-full">暂无标签</div>}
            </div>
          </div>
        </section>
      ) : tab === 'logs' ? (
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
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <ScrollText size={18} />
                  </div>
                  <div>
                    <div className="font-bold">
                      <span className="text-primary">{l.actor.username}</span>
                      <span className="mx-2 text-muted">•</span>
                      <span>{ACTION_MAP[l.action] || l.action}</span>
                    </div>
                    <div className="text-sm text-muted">
                      {l.detail ? l.detail : l.target ? `目标：${l.target}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted shrink-0">{new Date(l.createdAt).toLocaleString()}</div>
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
      ) : null}
    </motion.div>
  )
}
