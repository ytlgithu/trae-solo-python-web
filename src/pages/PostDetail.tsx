import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { marked } from 'marked'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { Calendar, Tag, Send } from 'lucide-react'

export const PostDetail = () => {
  const { slug } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetcher(`/posts/${slug}`).then(setPost)
  }, [slug])

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await fetcher(`/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: comment })
      })
      setComment('')
      alert('评论提交成功，待审核后展示')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!post) {
    return <div className="h-[50vh] flex items-center justify-center animate-pulse text-muted">Loading...</div>
  }

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto py-12"
    >
      <header className="mb-16 text-center">
        {post.category && (
          <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-widest uppercase mb-6 inline-block">
            {post.category.name}
          </span>
        )}
        <h1 className="text-5xl md:text-6xl font-black mb-8 leading-tight font-['Space_Grotesk']">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-muted">
          <span className="font-bold text-foreground">{post.author.username}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {post.excerpt && (
        <div className="text-xl text-muted leading-relaxed mb-16 px-8 py-6 border-l-4 border-primary bg-primary/5 rounded-r-2xl">
          {post.excerpt}
        </div>
      )}

      <div 
        className="prose prose-lg dark:prose-invert prose-headings:font-['Space_Grotesk'] prose-a:text-primary max-w-none"
        dangerouslySetInnerHTML={{ __html: marked(post.content) }}
      />

      <div className="flex flex-wrap gap-2 mt-16 pt-8 border-t border-border">
        {post.tags?.map((tag: any) => (
          <span key={tag.id} className="flex items-center gap-1.5 text-sm text-muted bg-border/50 hover:bg-border px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            <Tag size={14} />
            {tag.name}
          </span>
        ))}
      </div>

      {/* Comments Section */}
      <section className="mt-24">
        <h3 className="text-2xl font-bold mb-8">评论 <span className="text-muted text-lg font-normal">({post.comments?.length || 0})</span></h3>
        
        {user ? (
          <form onSubmit={submitComment} className="mb-12 relative">
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="写下你的观点..."
              className="w-full min-h-[120px] p-4 pr-16 bg-background border-2 border-border focus:border-primary rounded-2xl outline-none resize-none transition-colors text-base"
              required
            />
            <button 
              disabled={submitting}
              className="absolute right-4 bottom-4 p-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="mb-12 p-8 text-center glass rounded-2xl">
            <p className="text-muted">登录后即可参与讨论</p>
          </div>
        )}

        <div className="space-y-6">
          {post.comments?.map((comment: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={comment.id} 
              className="p-6 glass rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">{comment.user.username}</span>
                <span className="text-xs text-muted">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-muted leading-relaxed">{comment.content}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.article>
  )
}
