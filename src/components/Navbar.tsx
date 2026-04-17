import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../store/auth'
import { PenSquare, LogOut, User as UserIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-['Space_Grotesk'] tracking-tighter">
          纸上<span className="text-primary">博客</span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/post/new" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <PenSquare size={16} />
                写文章
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 outline-none"
                >
                  {user.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <UserIcon size={16} />
                    </div>
                  )}
                </button>
                
                <div className={`absolute right-0 top-full mt-2 w-48 glass rounded-2xl p-2 transition-all duration-300 ${
                  isDropdownOpen 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 translate-y-2 pointer-events-none'
                }`}>
                  <div className="px-4 py-2 border-b border-border/50 mb-2">
                    <p className="text-sm font-bold">{user.username}</p>
                    <p className="text-xs text-muted">{user.role === 'ADMIN' ? '管理员' : '作者'}</p>
                  </div>
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary rounded-xl transition-colors"
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      logout()
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">登录</Link>
              <Link to="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">注册</Link>
            </div>
          )}
        </nav>
      </div>
    </motion.header>
  )
}
