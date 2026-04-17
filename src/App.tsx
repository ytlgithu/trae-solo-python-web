import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { PostDetail } from './pages/PostDetail'
import { Profile } from './pages/Profile'
import { Editor } from './pages/Editor'
import { Admin } from './pages/Admin'
import { Navbar } from './components/Navbar'
import { useAuth } from './store/auth'

function App() {
  const { checkAuth, isLoading } = useAuth()

  useEffect(() => {
    checkAuth()
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [checkAuth])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/post/:slug" element={<PostDetail />} />
              <Route path="/post/new" element={<Editor />} />
              <Route path="/post/:id/edit" element={<Editor />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
