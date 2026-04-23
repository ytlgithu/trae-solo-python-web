import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_do_not_use_in_prod'

// Get my posts
router.get('/me/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    
    const posts = await prisma.post.findMany({
      where: { authorId: decoded.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json(posts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

// Update my avatar
router.patch('/me/avatar', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const { avatarUrl } = req.body

    const profile = await prisma.profile.upsert({
      where: { userId: decoded.id },
      update: { avatarUrl },
      create: { userId: decoded.id, avatarUrl }
    })

    res.json(profile)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

export default router
