import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { Calendar, Tag } from 'lucide-react'

export const Home = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetcher('/posts')
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative py-24 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 rounded-3xl blur-3xl opacity-50" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-gradient"
        >
          把想法写成文章
          <br />
          让它们有回声
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-muted max-w-2xl mx-auto mb-10"
        >
          全新重构的 Next.js / React 博客体验。支持沉浸式排版、无刷新发布、极简美学以及流畅的 Framer Motion 动效。
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {user ? (
            <Link to="/post/new" className="px-8 py-4 bg-foreground text-background dark:bg-white dark:text-black rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform duration-300">
              开始写文章
            </Link>
          ) : (
            <Link to="/register" className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(214,69,61,0.5)] hover:shadow-[0_0_60px_-15px_rgba(214,69,61,0.7)] transition-all duration-300">
              加入社区，开始创作
            </Link>
          )}
        </motion.div>
      </section>

      {/* Posts List */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 flex items-center gap-4">
          <span className="w-8 h-1 bg-primary rounded-full" />
          最新文章
        </h2>
        
        {loading ? (
          <div className="space-y-8">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 glass animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post: any, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative glass p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-500"
              >
                <Link to={`/post/${post.slug}`} className="absolute inset-0 z-10" />
                <div className="relative z-20 flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <span className="font-bold text-foreground">{post.author.username}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  {post.category && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      {post.category.name}
                    </span>
                  )}
                </div>
                
                <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors font-['Space_Grotesk']">
                  {post.title}
                </h3>
                <p className="text-muted leading-relaxed mb-6">
                  {post.excerpt || post.content.substring(0, 150) + '...'}
                </p>
                
                <div className="flex gap-2 relative z-20">
                  {post.tags?.map((tag: any) => (
                    <span key={tag.id} className="flex items-center gap-1 text-xs text-muted bg-border/50 px-2 py-1 rounded-md">
                      <Tag size={12} />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-24 text-muted border-2 border-dashed border-border rounded-3xl">
                空空如也，快来发布第一篇文章吧
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
