import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../store/auth'
import { fetcher } from '../lib/api'
import { Camera, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export const Profile = () => {
  const { user, checkAuth } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      fetcher('/users/me/posts')
        .then(setPosts)
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 256
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          // 压缩并转为 base64
          const avatarUrl = canvas.toDataURL('image/jpeg', 0.8)

          await fetcher('/users/me/avatar', {
            method: 'PATCH',
            body: JSON.stringify({ avatarUrl })
          })

          await checkAuth()
          setUploading(false)
        }
      }
    } catch (err: any) {
      alert(err.message || '上传头像失败')
      setUploading(false)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!user) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-12"
    >
      <header className="glass p-12 rounded-3xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl z-10 bg-muted/20 ${uploading ? 'opacity-50' : ''}`}
        >
          {user.profile?.avatarUrl ? (
            <img src={user.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-primary font-bold bg-primary/10">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="text-white animate-spin" size={32} />
            ) : (
              <Camera className="text-white" size={32} />
            )}
          </div>
        </div>

        <div className="text-center md:text-left z-10 flex-1">
          <h1 className="text-4xl font-black mb-2 font-['Space_Grotesk']">{user.username}</h1>
          <p className="text-muted text-lg mb-6">{user.role === 'ADMIN' ? '超级管理员' : '专栏作者'}</p>
          
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            <div className="bg-background/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-border text-center">
              <div className="text-2xl font-black font-['Space_Grotesk'] text-primary">{posts.length}</div>
              <div className="text-xs text-muted font-bold tracking-widest uppercase">发布文章</div>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">我的文章</h2>
          <Link to="/post/new" className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            发布新文章
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-border rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-border rounded"></div>
                <div className="h-4 bg-border rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post: any) => (
              <div key={post.id} className="glass p-6 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-colors">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {post.status === 'PUBLISHED' ? (
                      <Link to={`/post/${post.slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
                    ) : (
                      <span className="text-muted">{post.title}</span>
                    )}
                  </h3>
                  <div className="flex gap-4 text-sm text-muted">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${post.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/post/${post.id}/edit`} className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                    编辑
                  </Link>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 text-muted glass rounded-3xl">
                还没有发布过任何文章
              </div>
            )}
          </div>
        )}
      </section>
    </motion.div>
  )
}
