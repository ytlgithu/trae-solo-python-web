import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'

const getAdminUserId = async (req: Request): Promise<string | null> => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
  const user = await prisma.user.findUnique({ where: { id: decoded.id } })
  if (!user) return null
  if (user.role !== 'ADMIN') return null
  return user.id
}

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const pendingCommentsCount = await prisma.comment.count({ where: { status: 'PENDING' } })
    res.json({ pendingCommentsCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.get('/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const status = (req.query.status as string | undefined) ?? 'PENDING'
    const comments = await prisma.comment.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    })

    res.json(comments)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.post('/comments/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { id } = req.params
    const updated = await prisma.comment.update({
      where: { id },
      data: { status: 'APPROVED' },
    })
    res.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.post('/comments/:id/hide', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { id } = req.params
    const updated = await prisma.comment.update({
      where: { id },
      data: { status: 'HIDDEN' },
    })
    res.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.get('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const status = req.query.status as string | undefined
    const posts = await prisma.post.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true } },
        category: true,
        tags: true,
      },
    })
    res.json(posts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.patch('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { id } = req.params
    const { title, excerpt, content, status } = req.body as {
      title?: string
      excerpt?: string
      content?: string
      status?: string
    }

    const data: any = {}
    if (typeof title === 'string') data.title = title
    if (typeof excerpt === 'string') data.excerpt = excerpt
    if (typeof content === 'string') data.content = content
    if (typeof status === 'string') {
      data.status = status
      if (status === 'PUBLISHED') data.publishedAt = new Date()
      if (status === 'DRAFT') data.publishedAt = null
    }

    const updated = await prisma.post.update({ where: { id }, data })
    res.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.delete('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { id } = req.params
    await prisma.post.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

export default router

