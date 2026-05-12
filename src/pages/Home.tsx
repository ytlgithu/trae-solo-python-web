import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { stripMarkdown } from '../lib/utils'
import { PenSquare, Search, BookOpen } from 'lucide-react'

const TAG_COLORS = [
  'text-blue-500 hover:text-blue-600',
  'text-emerald-500 hover:text-emerald-600',
  'text-orange-500 hover:text-orange-600',
  'text-purple-500 hover:text-purple-600',
  'text-pink-500 hover:text-pink-600',
  'text-cyan-500 hover:text-cyan-600',
  'text-red-500 hover:text-red-600',
  'text-yellow-600 hover:text-yellow-700',
]

export const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  // 获取分类列表
  useEffect(() => {
    fetcher('/posts/categories').then(setCategories).catch(() => {})
    fetcher('/posts/tags').then(setTags).catch(() => {})
  }, [])

  // 根据搜索/分类筛选获取文章
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (activeCategory) params.set('category', activeCategory)

    fetcher(`/posts?${params.toString()}`)
      .then((data: any[]) => Array.isArray(data) ? data : [])
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [searchQuery, activeCategory])

  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 头部：标题 + 搜索框 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center justify-between gap-8 flex-wrap">
          {/* 标题 */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">📝</span>
            <h1 className="text-2xl font-bold text-gray-900">技术博客</h1>
          </div>

          {/* 搜索栏 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64 px-4 py-2 pr-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 分类筛选标签栏 */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.slug
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat.name} ({cat._count?.posts ?? ''})
            </button>
          ))}
        </div>

        {/* 写文章按钮 */}
        {user && (
          <Link to="/editor" className="inline-block mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              <PenSquare className="w-4 h-4" />
              写文章
            </motion.button>
          </Link>
        )}

        {/* 文章卡片网格 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
                <div className="h-3 bg-gray-100 rounded-full w-32 mb-1"></div>
                <div className="h-7 bg-gray-200 rounded w-3/4 my-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-100 rounded-full w-full"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-5/6"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-2/3"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-100 rounded-full w-12"></div>
                  <div className="h-5 bg-gray-100 rounded-full w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/post/${post.slug}`)}
                  >
                    {/* 作者 · 日期 · 分类 */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>{post.author.username}</span>
                      <span>·</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      {post.category && (
                        <>
                          <span>·</span>
                          <span className="text-blue-400">{post.category.name}</span>
                        </>
                      )}
                    </div>

                    {/* 标题 */}
                    <h2 className="text-base font-bold text-blue-600 group-hover:text-blue-700 mb-3 leading-snug line-clamp-2">
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {/* 摘要 */}
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt || stripMarkdown(post.content)}
                    </p>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-x-2 gap-y-1 pt-2 border-t border-gray-50">
                      {post.tags?.map((tag: any, idx: number) => (
                        <span key={tag.id} className={`${TAG_COLORS[idx % TAG_COLORS.length]} text-xs`}>
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <BookOpen className="w-14 h-14 mb-4 opacity-40" />
                <p className="text-lg">暂无文章</p>
                <p className="text-sm mt-1">换个关键词或分类试试吧~</p>
                {user && (
                  <Link to="/editor" className="mt-4 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90">
                    写第一篇文章
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
