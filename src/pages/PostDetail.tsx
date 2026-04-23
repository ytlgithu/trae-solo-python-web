import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetcher } from '../lib/api'
import { useAuth } from '../store/auth'
import { Calendar, Tag, Send, ArrowLeft, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import GithubSlugger from 'github-slugger'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const MarkdownCodeBlock = ({ language, value }: { language?: string; value: string }) => {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-border/40 bg-[#1E1E1E]">
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-2 top-2 p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg opacity-100 transition-all duration-200 z-10"
        title="复制代码"
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: 'transparent',
          padding: '16px',
          fontSize: '0.875rem',
          lineHeight: 1.6,
        }}
        codeTagProps={{ style: { background: 'transparent' } }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

export const PostDetail = () => {
  const { slug } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string>('')

  const headings = useMemo(() => {
    if (!post?.content) return []
    const slugger = new GithubSlugger()
    const regex = /^(#{1,4})\s+(.+)$/gm
    const matches = Array.from(post.content.matchAll(regex))
    return matches.map(m => {
      const text = m[2].trim()
      return { level: m[1].length, text, id: slugger.slug(text) }
    })
  }, [post?.content])

  useEffect(() => {
    fetcher(`/posts/${slug}`).then(setPost)
  }, [slug])

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = ''
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          // 150px offset to trigger slightly before it hits the top
          if (rect.top < 150) {
            currentActiveId = heading.id
          }
        }
      }
      if (currentActiveId) {
        setActiveId(currentActiveId)
      } else if (headings.length > 0) {
        // If scrolled to top, set the first heading as active
        setActiveId(headings[0].id)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initialize on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

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
      alert('评论已发布')
      const updated = await fetcher(`/posts/${slug}`)
      setPost(updated)
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-12 flex flex-col lg:flex-row gap-12"
    >
      {/* Left Sidebar: TOC */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 space-y-8 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain pb-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
            返回首页
          </Link>

          {headings.length > 0 && (
            <div className="glass p-6 rounded-2xl border border-border/50 bg-background/50">
              <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                文章目录
              </h3>
              <ul className="space-y-3 text-sm text-muted relative">
                {headings.map((h, i) => {
                  const isActive = activeId === h.id
                  return (
                    <li key={i} style={{ paddingLeft: `${(h.level - 1) * 12}px` }} className="relative">
                      {isActive && (
                        <motion.div 
                          layoutId="activeTOC"
                          className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <a 
                        href={`#${h.id}`} 
                        onClick={() => setActiveId(h.id)}
                        className={`block truncate transition-all duration-200 ${
                          isActive 
                            ? 'text-primary font-bold scale-[1.02] origin-left' 
                            : 'hover:text-primary'
                        }`} 
                        title={h.text}
                      >
                        {h.text}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 max-w-3xl mx-auto w-full">
        <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={20} />
          返回首页
        </Link>

        <article>
          <header className="mb-16 text-center lg:text-left">
            {post.category && (
              <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-widest uppercase mb-6 inline-block">
                {post.category.name}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight font-['Space_Grotesk']">
              {post.title}
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-4 text-muted">
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

          <div className="prose prose-lg dark:prose-invert max-w-none w-full break-words prose-headings:font-['Space_Grotesk'] prose-headings:font-bold prose-headings:scroll-mt-24 prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:shadow-lg mt-8">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeSlug]}
              components={{
                pre({ children }: any) {
                  return <div className="m-0 p-0 bg-transparent">{children}</div>
                },
                code({node, inline, className, children, ...props}: any) {
                  const value = String(children).replace(/\n$/, '')
                  if (!inline) {
                    const match = /language-(\w+)/.exec(className || '')
                    return <MarkdownCodeBlock language={match?.[1]} value={value} />
                  }
                  return (
                    <code {...props} className={`${className || ''} bg-muted px-1.5 py-0.5 rounded-md font-mono text-sm`}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

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
        </article>
      </main>
    </motion.div>
  )
}
