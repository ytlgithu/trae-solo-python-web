import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { useAuth } from './store/auth'
import { Loader2 } from 'lucide-react'

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })))
const PostDetail = lazy(() => import('./pages/PostDetail').then(m => ({ default: m.PostDetail })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const Editor = lazy(() => import('./pages/Editor').then(m => ({ default: m.Editor })))
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })))

const LoadingScreen = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-primary/60">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
)

function App() {
  const { checkAuth, isLoading } = useAuth()

  useEffect(() => {
    checkAuth()
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [checkAuth])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingScreen />}>
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
            </Suspense>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
